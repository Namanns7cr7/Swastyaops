"""Unit tests for the structured GCP JSON log formatter (docs/10 §6)."""

import json
import logging

from app.core.context import active_trace_id
from app.core.logging import GoogleCloudJsonFormatter, configure_logging


def _record(level: int = logging.INFO, msg: str = "hello %s", args=("world",)):
    return logging.LogRecord(name="app.test", level=level, pathname=__file__, lineno=42,
                             msg=msg, args=args, exc_info=None)


def _format(record) -> dict:
    return json.loads(GoogleCloudJsonFormatter(project_id="proj-1").format(record))


def test_payload_carries_severity_message_and_source_location():
    payload = _format(_record(level=logging.WARNING))
    assert payload["severity"] == "WARNING"
    assert payload["message"] == "hello world"
    assert payload["logger"] == "app.test"
    assert payload["line"] == 42


def test_timestamp_is_rfc3339_utc_with_single_zone_designator():
    timestamp = _format(_record())["timestamp"]
    assert timestamp.endswith("Z")
    assert "+00:00" not in timestamp  # regression: isoformat()+"Z" produced "+00:00Z"


def test_trace_id_from_contextvar_maps_to_cloud_trace_resource():
    token = active_trace_id.set("trace-abc")
    try:
        payload = _format(_record())
    finally:
        active_trace_id.reset(token)
    assert payload["logging.googleapis.com/trace"] == "projects/proj-1/traces/trace-abc"
    assert payload["trace_id"] == "trace-abc"


def test_extra_attrs_are_merged_into_the_payload():
    record = _record()
    record.extra_attrs = {"writes_count": 2}
    assert _format(record)["writes_count"] == 2


def test_exception_info_is_rendered():
    try:
        raise ValueError("boom")
    except ValueError:
        import sys
        record = logging.LogRecord(name="app.test", level=logging.ERROR, pathname=__file__,
                                   lineno=1, msg="failed", args=(), exc_info=sys.exc_info())
    payload = _format(record)
    assert "ValueError: boom" in payload["exception"]


def test_configure_logging_is_idempotent_single_handler():
    configure_logging()
    configure_logging()
    assert len(logging.getLogger().handlers) == 1
