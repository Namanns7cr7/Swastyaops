"""Unit tests for the event envelope and publish guards (architecture/event_catalog.md)."""

import json
from datetime import datetime

import pytest

from app.core import pubsub
from app.core.pubsub import TOPICS, envelope, publish


class _FakeFuture:
    def result(self, timeout=None):
        return "msg-1"


class _FakePublisher:
    def __init__(self):
        self.calls: list[dict] = []

    def topic_path(self, project: str, topic: str) -> str:
        return f"projects/{project}/topics/{topic}"

    def publish(self, topic_path, data, **kwargs):
        self.calls.append({"topic_path": topic_path, "data": data, **kwargs})
        return _FakeFuture()


@pytest.fixture
def fake_publisher(monkeypatch):
    fake = _FakePublisher()
    monkeypatch.setattr(pubsub, "_publisher", fake)
    return fake


def _event(event_type: str, facility_id: str | None = "f1") -> dict:
    return envelope(event_type, "d1", {"k": "v"}, actor="user:u1", facility_id=facility_id)


# ── envelope ─────────────────────────────────────────────────────────────────

def test_envelope_carries_the_full_event_contract():
    event = envelope("facility.inventory.updated", "d1", {"qty": -5},
                     actor="user:u1", facility_id="f1", trace_id="t-1")
    assert event["event_type"] == "facility.inventory.updated"
    assert event["district_id"] == "d1"
    assert event["facility_id"] == "f1"
    assert event["actor"] == "user:u1"
    assert event["trace_id"] == "t-1"
    assert event["payload"] == {"qty": -5}
    # occurred_at is a parseable UTC timestamp; event_id is unique per envelope
    datetime.fromisoformat(event["occurred_at"])
    assert event["event_id"] != envelope("x", "d1", {}, actor="a")["event_id"]


# ── publish ──────────────────────────────────────────────────────────────────

def test_publish_rejects_unregistered_topic(fake_publisher):
    with pytest.raises(ValueError, match="not in the registry"):
        publish(_event("facility.made.up"))
    assert fake_publisher.calls == []


def test_publish_sends_serialized_envelope_to_the_topic(fake_publisher):
    event = _event("alerts.stockout.predicted", facility_id=None)
    assert publish(event) == "msg-1"
    call = fake_publisher.calls[0]
    assert call["topic_path"].endswith("/topics/alerts.stockout.predicted")
    assert json.loads(call["data"]) == event
    assert call["event_type"] == "alerts.stockout.predicted"
    assert call["district_id"] == "d1"


def test_facility_events_are_ordered_per_facility(fake_publisher):
    publish(_event("facility.inventory.updated", facility_id="f7"))
    assert fake_publisher.calls[0]["ordering_key"] == "f7"


def test_non_facility_events_have_no_ordering_key(fake_publisher):
    publish(_event("alerts.footfall.spike"))
    assert "ordering_key" not in fake_publisher.calls[0]


def test_agent_attribute_added_for_subscription_filtering(fake_publisher):
    publish(_event("agents.tasks.dispatch", facility_id=None), agent="inventory")
    assert fake_publisher.calls[0]["agent"] == "inventory"


def test_registry_topics_all_have_expected_domain_prefixes():
    prefixes = ("facility.", "alerts.", "agents.", "recommendations.", "notifications.",
                "reports.", "briefings.", "forecasts.", "ingest.")
    assert all(topic.startswith(prefixes) for topic in TOPICS)
