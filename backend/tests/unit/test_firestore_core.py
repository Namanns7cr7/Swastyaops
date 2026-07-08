"""Unit tests for the write-and-publish invariant and idempotency-key contract
(docs/03 §1/§6 invariant #2; docs/05 §5). Firestore and Pub/Sub are replaced by
in-memory fakes — the transactional machinery itself is Google's, not ours.
"""

import pytest
from google.api_core.exceptions import AlreadyExists as GcpAlreadyExists
from google.cloud import firestore

from app.core import firestore as fscore
from app.core.errors import AlreadyExists


class FakeRef:
    def __init__(self):
        self.updates: list[dict] = []

    def update(self, data):
        self.updates.append(data)


class FakeTxn:
    def __init__(self):
        self.sets: list[tuple] = []

    def set(self, ref, data, merge=False):
        self.sets.append((ref, data, merge))


class FakeClient:
    def __init__(self):
        self.txn = FakeTxn()

    def transaction(self):
        return self.txn


@pytest.fixture
def fake_db(monkeypatch):
    client = FakeClient()
    monkeypatch.setattr(fscore, "db", lambda: client)
    # Run the transaction body directly; retry/commit belongs to the real client.
    monkeypatch.setattr(fscore.firestore, "transactional", lambda fn: fn)
    return client


def _event() -> dict:
    return {"event_id": "evt-1", "event_type": "facility.inventory.updated",
            "district_id": "d1"}


# ── write_and_publish ────────────────────────────────────────────────────────

def test_commit_marks_docs_unpublished_then_flips_marker_after_publish(fake_db, monkeypatch):
    published: list[dict] = []
    monkeypatch.setattr(fscore.pubsub, "publish", published.append)
    marker, ledger = FakeRef(), FakeRef()

    event_id = fscore.write_and_publish(
        writes=[(marker, {"current_stock": 90}, True),
                (ledger, {"qty": -10}, False)],
        event=_event(),
    )

    assert event_id == "evt-1"
    assert published == [_event()]
    # both writes committed atomically with the outbox marker fields
    (ref1, data1, merge1), (ref2, data2, merge2) = fake_db.txn.sets
    assert (ref1, merge1) == (marker, True)
    assert (ref2, merge2) == (ledger, False)
    for data in (data1, data2):
        assert data["_published"] is False
        assert data["updated_at"] is firestore.SERVER_TIMESTAMP
    assert data1["current_stock"] == 90
    # publish succeeded → the marker doc is flipped to published
    assert marker.updates == [{"_published": True}]


def test_publish_failure_is_swallowed_and_marker_stays_unpublished(fake_db, monkeypatch):
    def _explode(event):
        raise RuntimeError("pubsub down")
    monkeypatch.setattr(fscore.pubsub, "publish", _explode)
    marker = FakeRef()

    # Commit is durable; the reconciler owns recovery — the caller must not see an error.
    event_id = fscore.write_and_publish(writes=[(marker, {"x": 1}, True)], event=_event())

    assert event_id == "evt-1"
    assert marker.updates == []  # reconciler will find _published=False and republish


# ── is_idempotent_replay ─────────────────────────────────────────────────────

class FakeIdemRef:
    def __init__(self, existing: dict | None):
        self.existing = existing
        self.created: dict | None = None

    def create(self, data):
        if self.existing is not None:
            raise GcpAlreadyExists("document already exists")
        self.created = data

    def get(self):
        ref = self

        class Snap:
            exists = ref.existing is not None

            def get(self, key):
                return ref.existing[key]

        return Snap()


def _wire_idem_ref(monkeypatch, ref: FakeIdemRef):
    class Client:
        def collection(self, name):
            assert name == "idempotency_keys"

            class Coll:
                def document(self, key):
                    return ref

            return Coll()

    monkeypatch.setattr(fscore, "db", lambda: Client())


def test_first_use_of_a_key_records_it_and_is_not_a_replay(monkeypatch):
    ref = FakeIdemRef(existing=None)
    _wire_idem_ref(monkeypatch, ref)
    assert fscore.is_idempotent_replay("key-1", "digest-a") is False
    assert ref.created["digest"] == "digest-a"


def test_same_key_same_payload_is_a_replay(monkeypatch):
    _wire_idem_ref(monkeypatch, FakeIdemRef(existing={"digest": "digest-a"}))
    assert fscore.is_idempotent_replay("key-1", "digest-a") is True


def test_same_key_different_payload_is_rejected(monkeypatch):
    _wire_idem_ref(monkeypatch, FakeIdemRef(existing={"digest": "digest-a"}))
    with pytest.raises(AlreadyExists) as exc:
        fscore.is_idempotent_replay("key-1", "digest-B")
    assert exc.value.reason == "IDEMPOTENCY_MISMATCH"
