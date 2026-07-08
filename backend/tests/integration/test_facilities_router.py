"""HTTP-level tests for the facilities router.

Exercises the read routes, filters, and tenancy constraints.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.auth import Principal, current_principal
from app.core.errors import ApiError, api_error_handler
from app.routers import facilities

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

    def get(self):
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


class FakeDb:
    def __init__(self, docs):
        self.docs = docs

    def collection(self, name):
        return Coll(self, name)


# ── Fixtures ─────────────────────────────────────────────────────────────────

def _admin(districts=(DISTRICT,)) -> Principal:
    return Principal(uid="u1", role="district_admin",
                      district_ids=frozenset(districts), facility_ids=frozenset())


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeDb({
        f"districts/{DISTRICT}": {"name": "Sikar", "state": "Rajasthan", "health_score": 74, "counters": {"facilities": 111, "reporting": 96}},
        f"facilities/{FACILITY}": {"district_id": DISTRICT, "name": "PHC Losal", "type": "PHC", "block": "Losal", "health_score": 48, "status": "active"},
    })
    monkeypatch.setattr(facilities, "db", lambda: db)
    return db


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(facilities.router)
    app.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]
    return TestClient(app)


# ── Tests ────────────────────────────────────────────────────────────────────

def test_get_district_success(client, fake_db):
    app = client.app
    app.dependency_overrides[current_principal] = lambda: _admin()
    
    resp = client.get(f"/v1/districts/{DISTRICT}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Sikar"


def test_get_district_tenancy_violation(client, fake_db):
    app = client.app
    app.dependency_overrides[current_principal] = lambda: _admin(districts=("other_district",))
    
    resp = client.get(f"/v1/districts/{DISTRICT}")
    assert resp.status_code == 403
    assert resp.json()["error"]["status"] == "PERMISSION_DENIED"


def test_list_facilities_filters(client, fake_db):
    app = client.app
    app.dependency_overrides[current_principal] = lambda: _admin()

    resp = client.get(f"/v1/districts/{DISTRICT}/facilities?type=PHC")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 1
    assert data["facilities"][0]["name"] == "PHC Losal"
