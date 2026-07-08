"""Structured JSON logging utility for Google Cloud Run / Google Cloud Logging.

Maps standard Python logging levels to Google Cloud severity levels and formats logs as JSON
so they are fully indexable and searchable in Log Explorer.
See docs/10_Deployment_Guide.md §6.
"""

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

from app.core.config import settings


class GoogleCloudJsonFormatter(logging.Formatter):
    """Formats logs as JSON mapping to GCP structured logging fields."""

    def __init__(self, project_id: str):
        super().__init__()
        self.project_id = project_id

    def format(self, record: logging.LogRecord) -> str:
        # Map python levels to GCP severity
        severity = record.levelname
        if severity == "WARNING":
            severity = "WARNING"
        elif severity == "CRITICAL":
            severity = "CRITICAL"

        log_payload: dict[str, Any] = {
            "severity": severity,
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat() + "Z",
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
        }

        # Include custom log attributes if passed in extra
        if hasattr(record, "extra_attrs") and isinstance(record.extra_attrs, dict):
            log_payload.update(record.extra_attrs)

        # Include tracing contexts for Cloud Trace correlation
        from app.core.context import active_trace_id
        trace_id = getattr(record, "trace_id", None) or active_trace_id.get(None)
        if trace_id:
            log_payload["logging.googleapis.com/trace"] = f"projects/{self.project_id}/traces/{trace_id}"
            log_payload["trace_id"] = trace_id


        span_id = getattr(record, "span_id", None)
        if span_id:
            log_payload["logging.googleapis.com/spanId"] = span_id

        # Format exception info if present
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_payload)


def configure_logging() -> None:
    """Configures the root logger to output structured JSON to stdout."""
    root = logging.getLogger()
    
    # Remove existing handlers to avoid duplicate formats
    for handler in list(root.handlers):
        root.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(GoogleCloudJsonFormatter(project_id=settings().project_id))
    root.addHandler(handler)
    root.setLevel(logging.INFO if settings().env == "prod" else logging.DEBUG)
