"""Firestore access + the write-and-publish invariant.

Architecture invariant #2 (docs/03_System_Architecture.md §1/§6): every state
mutation publishes its domain event. Pattern: commit with _published=False, publish,
then flip the flag; an Eventarc reconciler republishes any doc still unpublished
after 60s, guaranteeing at-least-once emission. Consumers dedup on event_id.
"""

import logging
from typing import Any, cast

from google.cloud import firestore
from google.cloud.firestore_v1.base_document import BaseDocumentReference, DocumentSnapshot

from app.core import pubsub
from app.core.config import settings

_db: firestore.Client | None = None
logger = logging.getLogger(__name__)


def db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client(project=settings().project_id)
    return _db


def get_doc(ref: BaseDocumentReference) -> DocumentSnapshot:
    """Typed sync read — the base stubs union `.get()` with the async client's Awaitable."""
    return cast(DocumentSnapshot, ref.get())


def write_and_publish(
    *,
    writes: list[tuple[firestore.DocumentReference, dict[str, Any], bool]],
    event: dict[str, Any],
) -> str:
    """Atomically apply writes (ref, data, merge) then emit the domain event.

    Returns the published event_id. If publish fails after commit, the doc keeps
    _published=False and the reconciler drains it — callers treat commit as success.
    """
    event_id: str = event["event_id"]
    marker_ref = writes[0][0]

    @firestore.transactional
    def _txn(txn: firestore.Transaction) -> None:
        outbox_fields = {"_published": False, "updated_at": firestore.SERVER_TIMESTAMP}
        for ref, data, merge in writes:
            txn.set(ref, data | outbox_fields, merge=merge)

    _txn(db().transaction())
    logger.info("Committed transaction with %d writes.", len(writes),
                extra={"extra_attrs": {"writes_count": len(writes)}})
    try:
        pubsub.publish(event)
        marker_ref.update({"_published": True})
        logger.info("Published domain event %s successfully.", event_id)
    except Exception:  # noqa: BLE001 — reconciler owns recovery; commit already durable
        logger.warning(
            "Failed to publish domain event %s. Reconciler will recover.",
            event_id,
            exc_info=True,
            extra={"extra_attrs": {"event_id": event_id}},
        )
    return event_id



def is_idempotent_replay(key: str, payload_digest: str) -> bool:
    """True if this key was already seen with the same payload; raises AlreadyExists on
    a digest mismatch; otherwise records the key and returns False.

    Contract: docs/05_API_Specification.md §5.
    """
    from google.api_core.exceptions import AlreadyExists as GcpAlreadyExists

    from app.core.errors import AlreadyExists

    ref = db().collection("idempotency_keys").document(key)
    try:
        ref.create({"digest": payload_digest, "created_at": firestore.SERVER_TIMESTAMP})
        return False
    except GcpAlreadyExists as exc:
        snap = get_doc(ref)
        if snap.exists and snap.get("digest") != payload_digest:
            raise AlreadyExists(
                "Idempotency key reused with a different payload.", reason="IDEMPOTENCY_MISMATCH"
            ) from exc
        return True

