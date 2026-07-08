"""svc-api — public REST surface (docs/05_API_Specification.md).

Routers are thin: auth → validate → Firestore txn → event. Long work is dispatched
to Pub/Sub, never done in-request (docs/02_TRD.md §2).
"""

import logging
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.context import active_trace_id
from app.core.errors import ApiError, api_error_handler
from app.core.logging import configure_logging
from app.routers import inventory, facilities, footfall, attendance

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SwasthyaOps AI API",
    version="1.0.0",
    docs_url=None,  # OpenAPI served at /v1/openapi.json for authenticated users only
    openapi_url="/v1/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Starlette's signature wants (Request, Exception); ours narrows to ApiError.
app.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort handler: same AIP-193 envelope, no internal details leaked (docs/05 §4)."""
    logger.error("Unhandled exception on %s %s", request.method, request.url.path, exc_info=exc)
    return api_error_handler(request, ApiError("An internal error occurred."))


@app.middleware("http")
async def trace_context(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    header = request.headers.get("x-cloud-trace-context", "")
    trace_id = header.split("/")[0] if header else str(uuid.uuid4())
    request.state.trace_id = trace_id
    token = active_trace_id.set(trace_id)
    try:
        response = await call_next(request)
        response.headers["x-trace-id"] = trace_id
        return response
    finally:
        active_trace_id.reset(token)



app.include_router(inventory.router)
app.include_router(facilities.router)
app.include_router(footfall.router)
app.include_router(attendance.router)

# Remaining routers land per docs/11_Implementation_Plan.md sprint order:
# Trigger reload S2
#   S2: facilities, footfall, attendance     S3: sync, beds, labs
#   S5: alerts                               S6–7: recommendations, reports, briefings
#   S10: query (NL), admin, me


@app.get("/healthz", include_in_schema=False)
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz", include_in_schema=False)
async def readyz() -> JSONResponse:
    from app.core.firestore import db

    try:
        db().collection("config").document("thresholds").get(timeout=5)
        return JSONResponse({"status": "ready"})
    except Exception as exc:  # noqa: BLE001
        return JSONResponse({"status": "degraded", "reason": str(exc)}, status_code=503)
