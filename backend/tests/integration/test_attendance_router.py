"""HTTP-level tests for the attendance router.

Exercises the write paths, transactions, and event generation.
"""

from datetime import UTC, datetime
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.auth import Principal, current_principal
from app.core.errors import ApiError, api_error_handler
from app.routers import attendance

FACILITY = "f1"
DISTRICT = "d1"


# ── In-memory Firestore fake ──────────────────────────────────────────────────

class Snap:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data

    @property
    def exists(self):
        return self._data is not None

    def get(self, key):
        return self._data[key]

    def to_dict(self):
        return dict(self._data)


class Ref:
    def __init__(self, store, path):
        self.store, self.path = store, path

    def get(self, transaction=None):
        return Snap(self.path.split("/")[-1], self.store.docs.get(self.path))


class Coll:
    def __init__(self, store, path):
        self.store, self.path = store, path
        self._wheres = []

    def document(self, doc_id):
        return Ref(self.store, f"{self.path}/{doc_id}")

    def where(self, field, op, val):
        self._wheres.append((field, op, val))
        return self

    def limit(self, n):
        return self

    def get(self):
        results = []
        for path, data in self.store.docs.items():
            if path.startswith(f"{self.path}/") and "/" not in path[len(self.path)+1:]:
                match = True
                for field, op, val in self._wheres:
                    if data.get(field) != val:
                        match = False
                if match:
                    results.append(Snap(path.split("/")[-1], data))
        return results


class FakeTxn:
    def __init__(self, db):
        self.db = db

    def set(self, ref, data, merge=False):
        self.db.docs[ref.path] = data

    def update(self, ref, data):
        if ref.path in self.db.docs:
            self.db.docs[ref.path].update(data)


class FakeDb:
    def __init__(self, docs):
        self.docs = docs
        self.replay_results = []

    def collection(self, name):
        return Coll(self, name)

    def collection_group(self, name):
        class GroupQuery:
            def __init__(self, results):
                self._results = results
            def where(self, *args, **kwargs):
                return self
            def limit(self, n):
                return self
            def get(self):
                return self._results
        return GroupQuery(self.replay_results)

    def transaction(self):
        return FakeTxn(self)


# ── Fixtures ─────────────────────────────────────────────────────────────────

def _incharge(facilities=(FACILITY,), districts=(DISTRICT,)) -> Principal:
    return Principal(uid="u1", role="facility_incharge",
                      district_ids=frozenset(districts), facility_ids=frozenset(facilities))


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeDb({
        f"facilities/{FACILITY}": {"district_id": DISTRICT, "name": "PHC Losal", "type": "PHC", "health_score": 48, "status": "active"},
    })
    monkeypatch.setattr(attendance, "db", lambda: db)
    # Stub write_and_publish to avoid network Pub/Sub errors in integration tests
    monkeypatch.setattr(attendance, "write_and_publish", lambda writes, event: "event_id_123")
    return db


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(attendance.router)
    app.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]
    return TestClient(app)


# ── Tests ────────────────────────────────────────────────────────────────────

def test_record_attendance_success(client, fake_db):
    app = client.app
    app.dependency_overrides[current_principal] = lambda: _incharge()

    payload = {
        "entries": [
            {"staff_id": "s1", "name": "Dr. Ramesh", "role": "doctor", "status": "present"},
            {"staff_id": "s2", "name": "Sita", "role": "nurse", "status": "present"},
            {"staff_id": "s3", "name": "Gopal", "role": "doctor", "status": "absent"}
        ]
    }
    
    resp = client.put(f"/v1/facilities/{FACILITY}/attendance/2026-07-08", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["doctors_present"] == 1
    assert data["total_staff_logged"] == 3
