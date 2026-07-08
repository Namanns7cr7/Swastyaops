"""HTTP-level tests for the inventory write path (docs/12 §1 — integration level).

Exercises the real router + auth guard + error envelope through TestClient, with
Firestore and the write-and-publish outbox replaced by in-memory fakes.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.auth import Principal, current_principal
from app.core.errors import ApiError, api_error_handler
from app.routers import inventory

FACILITY = "f1"
ITEM = "EDL-ORS-200"


# ── In-memory Firestore fake (path-keyed documents) ──────────────────────────

class Snap:
    def __init__(self, data):
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
        return Snap(self.store.docs.get(self.path))

    def collection(self, name):
        return Coll(self.store, f"{self.path}/{name}")


class Coll:
    def __init__(self, store, path):
        self.store, self.path = store, path

    def document(self, doc_id):
        return Ref(self.store, f"{self.path}/{doc_id}")


class ReplayQuery:
    def __init__(self, results):
        self._results = results

    def where(self, *args, **kwargs):
        return self

    def limit(self, n):
        return self

    def get(self):
        return self._results


class FakeDb:
    def __init__(self, docs):
        self.docs = docs
        self.replay_results: list[Snap] = []

    def collection(self, name):
        return Coll(self, name)

    def collection_group(self, name):
        return ReplayQuery(self.replay_results)


# ── Fixtures ─────────────────────────────────────────────────────────────────

def _pharmacist(facilities=(FACILITY,), districts=("d1",)) -> Principal:
    return Principal(uid="u1", role="pharmacist",
                     district_ids=frozenset(districts), facility_ids=frozenset(facilities))


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeDb({
        f"facilities/{FACILITY}": {"district_id": "d1"},
        f"facilities/{FACILITY}/inventory/{ITEM}": {
            "name": "ORS Sachet 200ml", "current_stock": 200,
            "avg_daily_consumption": 20, "predicted_stockout_date": None,
        },
    })
    monkeypatch.setattr(inventory, "db", lambda: db)
    return db


@pytest.fixture
def outbox(monkeypatch):
    """Captures write_and_publish calls instead of touching Firestore/PubSub."""
    calls: list[dict] = []

    def _capture(*, writes, event):
        calls.append({"writes": writes, "event": event})
        return event["event_id"]

    monkeypatch.setattr(inventory, "write_and_publish", _capture)
    monkeypatch.setattr(inventory, "is_idempotent_replay", lambda key, digest: False)
    return calls


@pytest.fixture
def app(fake_db, outbox):
    app = FastAPI()
    app.include_router(inventory.router)
    app.add_exception_handler(ApiError, api_error_handler)
    app.dependency_overrides[current_principal] = _pharmacist
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


def _post(client, body_overrides=None, facility=FACILITY, headers=None):
    body = {"item_code": ITEM, "type": "issue", "qty": 10,
            "recorded_at": "2026-07-08T10:00:00Z"} | (body_overrides or {})
    return client.post(f"/v1/facilities/{facility}/inventory/transactions",
                       json=body, headers=headers)


# ── Happy path ───────────────────────────────────────────────────────────────

def test_receipt_increases_balance_and_returns_201(client):
    # 200 stock + 100 receipt = 300 at burn 20/day → 15 days of cover, above threshold.
    response = _post(client, {"type": "receipt", "qty": 100})
    assert response.status_code == 201
    body = response.json()
    assert body["balance_after"] == 300
    assert body["txn_id"].startswith("txn_")
    assert body["item_code"] == ITEM
    assert body["warning"] is None


def test_issue_decrements_stock_and_publishes_signed_domain_event(client, outbox):
    response = _post(client, {"type": "issue", "qty": 30})
    assert response.status_code == 201
    assert response.json()["balance_after"] == 170

    event = outbox[0]["event"]
    assert event["event_type"] == "facility.inventory.updated"
    assert event["district_id"] == "d1"
    assert event["facility_id"] == FACILITY
    assert event["payload"]["qty"] == -30  # issues are signed negative in the ledger
    assert event["payload"]["balance_after"] == 170

    level_write, ledger_write = outbox[0]["writes"]
    assert level_write[1] == {"current_stock": 170}
    assert ledger_write[1]["created_by"] == "user:u1"
    assert ledger_write[1]["qty"] == -30


def test_warning_when_balance_falls_below_14_day_cover(client):
    # 200 stock, burn 20/day: issuing 100 leaves 5 days of cover (< 14).
    response = _post(client, {"type": "issue", "qty": 100})
    assert response.status_code == 201
    assert "STOCK_RISK" in response.json()["warning"]


# ── Guardrails ───────────────────────────────────────────────────────────────

def test_overissue_is_rejected_with_current_stock_evidence(client, outbox):
    response = _post(client, {"type": "issue", "qty": 300})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["status"] == "FAILED_PRECONDITION"
    assert error["details"][0]["reason"] == "INSUFFICIENT_STOCK"
    assert error["details"][0]["metadata"]["current_stock"] == "200"
    assert outbox == []  # nothing committed, nothing published


def test_unknown_facility_is_404(app, client):
    app.dependency_overrides[current_principal] = lambda: _pharmacist(facilities=("f9",))
    assert _post(client, facility="f9").status_code == 404


def test_item_not_in_facility_catalog_is_404(client):
    response = _post(client, {"item_code": "EDL-UNKNOWN-1"})
    assert response.status_code == 404
    assert "not in facility catalog" in response.json()["error"]["message"]


def test_pharmacist_cannot_write_to_another_facility(app, client, fake_db):
    fake_db.docs["facilities/f2"] = {"district_id": "d1"}
    response = _post(client, facility="f2")
    assert response.status_code == 403
    assert response.json()["error"]["details"][0]["reason"] == "TENANCY_VIOLATION"


def test_cross_district_facility_is_denied_even_if_in_facility_claims(app, client, fake_db):
    # Facility claim present but the facility belongs to a district outside the JWT scope.
    fake_db.docs[f"facilities/{FACILITY}"] = {"district_id": "d2"}
    response = _post(client)
    assert response.status_code == 403
    assert response.json()["error"]["details"][0]["reason"] == "TENANCY_VIOLATION"


def test_viewer_role_is_denied(app, client):
    app.dependency_overrides[current_principal] = lambda: Principal(uid="u2", role="viewer")
    response = _post(client)
    assert response.status_code == 403
    assert response.json()["error"]["details"][0]["reason"] == "ROLE_DENIED"


def test_request_without_token_is_401(app, client):
    del app.dependency_overrides[current_principal]  # real auth: no header → 401
    response = _post(client)
    assert response.status_code == 401
    assert response.json()["error"]["status"] == "UNAUTHENTICATED"


# ── Idempotency ──────────────────────────────────────────────────────────────

def test_replayed_idempotency_key_returns_prior_response_without_rewriting(
        client, fake_db, outbox, monkeypatch):
    prior = {"txn_id": "txn_prior", "item_code": ITEM, "balance_after": 170,
             "predicted_stockout_date": None, "warning": None}
    fake_db.replay_results = [Snap({"response_snapshot": prior})]
    monkeypatch.setattr(inventory, "is_idempotent_replay", lambda key, digest: True)

    response = _post(client, headers={"Idempotency-Key": "idem-1"})

    assert response.status_code == 201
    assert response.json() == prior
    assert outbox == []  # replay must not write or publish again
