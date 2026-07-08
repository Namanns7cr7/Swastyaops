"""Firestore access + the write-and-publish invariant.

Architecture invariant #2 (docs/03_System_Architecture.md §1/§6): every state
mutation publishes its domain event. Pattern: commit with _published=False, publish,
then flip the flag; an Eventarc reconciler republishes any doc still unpublished
after 60s, guaranteeing at-least-once emission. Consumers dedup on event_id.
"""

from typing import Any

from google.cloud import firestore

from app.core import pubsub
from app.core.config import settings

import logging

_db: firestore.Client | None = None
logger = logging.getLogger(__name__)


def db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client(project=settings().project_id)
    return _db


def write_and_publish(
    *,
    writes: list[tuple[firestore.DocumentReference, dict[str, Any], bool]],
    event: dict[str, Any],
) -> str:
    """Atomically apply writes (ref, data, merge) then emit the domain event.

    Returns the published event_id. If publish fails after commit, the doc keeps
    _published=False and the reconciler drains it — callers treat commit as success.
    """
    marker_ref = writes[0][0]

    @firestore.transactional
    def _txn(txn: firestore.Transaction) -> None:
        for ref, data, merge in writes:
            txn.set(ref, data | {"_published": False, "updated_at": firestore.SERVER_TIMESTAMP}, merge=merge)

    _txn(db().transaction())
    logger.info("Committed transaction with %d writes.", len(writes), extra={"extra_attrs": {"writes_count": len(writes)}})
    try:
        pubsub.publish(event)
        marker_ref.update({"_published": True})
        logger.info("Published domain event %s successfully.", event["event_id"])
    except Exception as exc:  # noqa: BLE001 — reconciler owns recovery; commit already durable
        logger.warning(
            "Failed to publish domain event %s. Reconciler will recover.",
            event["event_id"],
            exc_info=True,
            extra={"extra_attrs": {"event_id": event["event_id"]}}
        )
    return event["event_id"]



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
    except GcpAlreadyExists:
        snap = ref.get()
        if snap.exists and snap.get("digest") != payload_digest:
            raise AlreadyExists(
                "Idempotency key reused with a different payload.", reason="IDEMPOTENCY_MISMATCH"
            )
        return True

