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

_db: firestore.Client | None = None


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
    try:
        pubsub.publish(event)
        marker_ref.update({"_published": True})
    except Exception:  # noqa: BLE001 — reconciler owns recovery; commit already durable
        pass
    return event["event_id"]


def is_idempotent_replay(key: str, payload_digest: str) -> bool:
    """True if this key was already seen with the same payload; raises AlreadyExists on
    a digest mismatch; otherwise records the key and returns False.

    Contract: docs/05_API_Specification.md §5.
    """
    from app.core.errors import AlreadyExists

    ref = db().collection("idempotency_keys").document(key)
    snap = ref.get()
    if snap.exists:
        if snap.get("digest") != payload_digest:
            raise AlreadyExists(
                "Idempotency key reused with a different payload.", reason="IDEMPOTENCY_MISMATCH"
            )
        return True
    ref.set({"digest": payload_digest, "created_at": firestore.SERVER_TIMESTAMP})
    return False
