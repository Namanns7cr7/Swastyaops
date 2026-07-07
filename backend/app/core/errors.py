"""AIP-193-style error envelope — the single error shape for the whole API.

Contract: docs/05_API_Specification.md §4. Every handler raises ApiError (or a
subclass); the exception handler in app.main renders the envelope with trace_id.
"""

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    http = 500
    status = "INTERNAL"

    def __init__(self, message: str, reason: str | None = None, metadata: dict[str, Any] | None = None):
        self.message = message
        self.reason = reason
        self.metadata = metadata or {}
        super().__init__(message)


class InvalidArgument(ApiError):
    http, status = 400, "INVALID_ARGUMENT"


class Unauthenticated(ApiError):
    http, status = 401, "UNAUTHENTICATED"


class PermissionDenied(ApiError):
    http, status = 403, "PERMISSION_DENIED"


class NotFound(ApiError):
    http, status = 404, "NOT_FOUND"


class Aborted(ApiError):
    http, status = 409, "ABORTED"


class AlreadyExists(ApiError):
    http, status = 409, "ALREADY_EXISTS"


class FailedPrecondition(ApiError):
    http, status = 422, "FAILED_PRECONDITION"


class ResourceExhausted(ApiError):
    http, status = 429, "RESOURCE_EXHAUSTED"


class Unavailable(ApiError):
    http, status = 503, "UNAVAILABLE"


def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    trace_id = getattr(request.state, "trace_id", None)
    details = []
    if exc.reason:
        details.append({"reason": exc.reason, "metadata": {k: str(v) for k, v in exc.metadata.items()}})
    return JSONResponse(
        status_code=exc.http,
        content={"error": {"code": exc.http, "status": exc.status, "message": exc.message,
                           "details": details, "trace_id": trace_id}},
        headers={"Retry-After": "5"} if exc.http in (429, 503) else None,
    )
