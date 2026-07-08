"""Envelope builder and typed topic publishers.

Topic names mirror architecture/pubsub_topics.yaml — that file is the registry;
this module fails fast at startup if asked to publish to an unregistered topic.
Envelope contract: architecture/event_catalog.md.
"""

import json
from datetime import UTC, datetime
from typing import Any

import google.cloud.pubsub_v1 as pubsub_v1
from uuid_extensions import uuid7str

from app.core.config import settings

# Publish-side registry (subset: topics this codebase publishes). Kept in sync with
# architecture/pubsub_topics.yaml by tests/contract/test_topic_registry.py.
TOPICS = {
    "facility.inventory.updated",
    "facility.footfall.recorded",
    "facility.attendance.recorded",
    "facility.beds.updated",
    "facility.labs.updated",
    "alerts.stockout.predicted",
    "alerts.footfall.spike",
    "alerts.outbreak.suspected",
    "alerts.staffing.gap",
    "alerts.bed.saturation",
    "alerts.lab.downtime",
    "alerts.stock.anomaly",
    "alerts.forecast.degraded",
    "agents.tasks.dispatch",
    "agents.runs.completed",
    "recommendations.created",
    "recommendations.approved",
    "notifications.outbound",
    "reports.requested",
    "reports.generated",
    "briefings.ready",
    "forecasts.generated",
    "ingest.hmis.loaded",
    "ingest.idsp.loaded",
    "ingest.weather.loaded",
    "ingest.directory.loaded",
}

_publisher = pubsub_v1.PublisherClient(
    publisher_options=pubsub_v1.types.PublisherOptions(enable_message_ordering=True)
)


def envelope(
    event_type: str,
    district_id: str,
    payload: dict[str, Any],
    actor: str,
    facility_id: str | None = None,
    trace_id: str | None = None,
) -> dict[str, Any]:
    return {
        "event_id": uuid7str(),
        "event_type": event_type,
        "occurred_at": datetime.now(UTC).isoformat(),
        "district_id": district_id,
        "facility_id": facility_id,
        "actor": actor,
        "trace_id": trace_id,
        "payload": payload,
    }


def publish(event: dict[str, Any], *, agent: str | None = None) -> str:
    """Publish an enveloped event. facility.* topics are ordered per facility (TRD §3)."""
    topic = event["event_type"]
    if topic not in TOPICS:
        raise ValueError(
            f"Topic '{topic}' is not in the registry (architecture/pubsub_topics.yaml)")
    attrs: dict[str, str] = {"event_type": topic, "district_id": event["district_id"]}
    if agent:
        attrs["agent"] = agent  # subscription filters key on this (agents.tasks.dispatch)
    kwargs: dict[str, Any] = {}
    if topic.startswith("facility.") and event.get("facility_id"):
        kwargs["ordering_key"] = event["facility_id"]
    future = _publisher.publish(
        _publisher.topic_path(settings().project_id, topic),
        json.dumps(event).encode(),
        **attrs,
        **kwargs,
    )
    message_id: str = future.result(timeout=10)
    return message_id
