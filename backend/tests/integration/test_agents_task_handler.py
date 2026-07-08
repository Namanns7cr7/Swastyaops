"""HTTP-level tests for the svc-agents Pub/Sub push receiver (docs/06 §9, TRD §3).

Covers consumer idempotency (dedup on event_id) and the audit trail around a run.
The regression that matters most here: a FAILED run must release its dedup marker,
otherwise the Pub/Sub redelivery it requests via 500 is swallowed as a duplicate
and the task is silently lost.
"""

import base64
import json

import pytest
from fastapi.testclient import TestClient
from google.api_core.exceptions import AlreadyExists as GcpAlreadyExists

from app.agents import main as agents_main


class FakeDocRef:
    """Firestore document ref with create-once semantics (dedup markers) + audit log."""

    def __init__(self, store: dict, key: str):
        self.store, self.key = store, key
        self.updates: list[dict] = []

    def create(self, data):
        if self.key in self.store:
            raise GcpAlreadyExists("already exists")
        self.store[self.key] = data

    def delete(self):
        self.store.pop(self.key, None)

    def set(self, data):
        self.store[self.key] = data

    def update(self, data):
        self.updates.append(data)
        self.store[self.key] = {**self.store.get(self.key, {}), **data}


class FakeDb:
    def __init__(self):
        self.collections: dict[str, dict] = {"processed_events": {}, "agent_runs": {}}
        self.refs: dict[tuple[str, str], FakeDocRef] = {}

    def collection(self, name):
        db = self

        class Coll:
            def document(self, doc_id):
                key = (name, doc_id)
                if key not in db.refs:
                    db.refs[key] = FakeDocRef(db.collections[name], doc_id)
                return db.refs[key]

        return Coll()

    def run_ref(self):
        [ref] = [r for (coll, _), r in self.refs.items() if coll == "agent_runs"]
        return ref


class FakeAgent:
    prompt_version = "1.0.0"
    model = "gemini-2.5-flash"
    name = "inventory"

    def __init__(self, result=None, error: Exception | None = None):
        self.result = result or {"outcome": "ok", "summary": {"n": 1}}
        self.error = error

    async def run(self, *, task, district_id, run_ref):
        if self.error:
            raise self.error
        return self.result


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeDb()
    monkeypatch.setattr(agents_main, "db", lambda: db)
    return db


@pytest.fixture
def published(monkeypatch):
    events: list[dict] = []
    monkeypatch.setattr(agents_main.pubsub, "publish", events.append)
    return events


@pytest.fixture
def client(fake_db, published):
    return TestClient(agents_main.app, raise_server_exceptions=False)


def _push_body(event_id: str = "evt-1") -> dict:
    task = {"event_id": event_id, "district_id": "d1",
            "payload": {"agent": "inventory", "task_type": "donor_search", "task_id": "t-1"}}
    return {"message": {"data": base64.b64encode(json.dumps(task).encode()).decode()}}


def _use_agent(monkeypatch, agent: FakeAgent):
    monkeypatch.setattr(agents_main, "get_agent", lambda name: agent)


# ── Happy path ───────────────────────────────────────────────────────────────

def test_successful_run_audits_and_publishes_completion(client, fake_db, published, monkeypatch):
    _use_agent(monkeypatch, FakeAgent())

    response = client.post("/internal/pubsub/tasks", json=_push_body())

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    run = fake_db.run_ref()
    assert run.store[run.key]["status"] == "done"
    assert run.store[run.key]["prompt_version"] == "1.0.0"
    [event] = published
    assert event["event_type"] == "agents.runs.completed"
    assert event["payload"]["outcome"] == "ok"
    assert event["actor"] == "agent:inventory"


def test_duplicate_event_is_ignored_without_running_the_agent(client, fake_db, monkeypatch):
    _use_agent(monkeypatch, FakeAgent())
    first = client.post("/internal/pubsub/tasks", json=_push_body("evt-dup"))
    assert first.json()["status"] == "ok"

    second = client.post("/internal/pubsub/tasks", json=_push_body("evt-dup"))

    assert second.status_code == 200
    assert second.json()["status"] == "duplicate_ignored"
    # only the first attempt created an agent_runs doc
    assert len([k for k in fake_db.refs if k[0] == "agent_runs"]) == 1


# ── Failure path (Prove-It regression for the dedup/redelivery bug) ─────────

def test_failed_run_returns_500_and_releases_the_dedup_marker(client, fake_db, monkeypatch):
    _use_agent(monkeypatch, FakeAgent(error=RuntimeError("model unavailable")))

    response = client.post("/internal/pubsub/tasks", json=_push_body("evt-fail"))

    assert response.status_code == 500  # asks Pub/Sub to redeliver
    run = fake_db.run_ref()
    assert run.store[run.key]["status"] == "failed"
    assert "model unavailable" in run.store[run.key]["error"]
    # marker must be gone so the redelivery is processed, not swallowed
    assert "agents_evt-fail" not in fake_db.collections["processed_events"]


def test_redelivery_after_failure_is_processed_not_deduplicated(client, fake_db, published,
                                                                monkeypatch):
    agent = FakeAgent(error=RuntimeError("transient"))
    _use_agent(monkeypatch, agent)
    assert client.post("/internal/pubsub/tasks", json=_push_body("evt-retry")).status_code == 500

    agent.error = None  # transient fault clears before the redelivery
    retry = client.post("/internal/pubsub/tasks", json=_push_body("evt-retry"))

    assert retry.status_code == 200
    assert retry.json()["status"] == "ok"
    assert [e["event_type"] for e in published] == ["agents.runs.completed"]
