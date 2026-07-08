"""Unit tests for the AIP-193 error envelope (docs/05 §4 — unit level)."""

import json
from types import SimpleNamespace

import pytest

from app.core.errors import (
    Aborted,
    AlreadyExists,
    ApiError,
    FailedPrecondition,
    InvalidArgument,
    NotFound,
    PermissionDenied,
    ResourceExhausted,
    Unauthenticated,
    Unavailable,
    api_error_handler,
)


def _request(trace_id: str | None = "trace-123"):
    state = SimpleNamespace(trace_id=trace_id) if trace_id else SimpleNamespace()
    return SimpleNamespace(state=state)


def _body(response) -> dict:
    return json.loads(response.body)


@pytest.mark.parametrize(("exc_cls", "http", "status"), [
    (InvalidArgument, 400, "INVALID_ARGUMENT"),
    (Unauthenticated, 401, "UNAUTHENTICATED"),
    (PermissionDenied, 403, "PERMISSION_DENIED"),
    (NotFound, 404, "NOT_FOUND"),
    (Aborted, 409, "ABORTED"),
    (AlreadyExists, 409, "ALREADY_EXISTS"),
    (FailedPrecondition, 422, "FAILED_PRECONDITION"),
    (ResourceExhausted, 429, "RESOURCE_EXHAUSTED"),
    (Unavailable, 503, "UNAVAILABLE"),
    (ApiError, 500, "INTERNAL"),
])
def test_every_error_maps_to_its_http_code_and_status(exc_cls, http, status):
    response = api_error_handler(_request(), exc_cls("boom"))
    assert response.status_code == http
    body = _body(response)["error"]
    assert body["code"] == http
    assert body["status"] == status
    assert body["message"] == "boom"


def test_reason_and_metadata_render_as_a_details_entry_with_string_values():
    exc = FailedPrecondition("no stock", reason="INSUFFICIENT_STOCK",
                             metadata={"current_stock": 42})
    body = _body(api_error_handler(_request(), exc))["error"]
    assert body["details"] == [
        {"reason": "INSUFFICIENT_STOCK", "metadata": {"current_stock": "42"}}
    ]


def test_details_empty_when_no_reason_given():
    body = _body(api_error_handler(_request(), NotFound("gone")))["error"]
    assert body["details"] == []


def test_trace_id_comes_from_request_state():
    body = _body(api_error_handler(_request("t-9"), NotFound("gone")))["error"]
    assert body["trace_id"] == "t-9"


def test_trace_id_is_null_when_middleware_did_not_set_it():
    body = _body(api_error_handler(_request(trace_id=None), NotFound("gone")))["error"]
    assert body["trace_id"] is None


@pytest.mark.parametrize("exc_cls", [ResourceExhausted, Unavailable])
def test_retryable_errors_carry_retry_after_header(exc_cls):
    response = api_error_handler(_request(), exc_cls("later"))
    assert response.headers["Retry-After"] == "5"


def test_non_retryable_errors_have_no_retry_after_header():
    response = api_error_handler(_request(), NotFound("gone"))
    assert "Retry-After" not in response.headers
