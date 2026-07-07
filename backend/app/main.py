"""svc-api — public REST surface (docs/05_API_Specification.md).

Routers are thin: auth → validate → Firestore txn → event. Long work is dispatched
to Pub/Sub, never done in-request (docs/02_TRD.md §2).
"""

import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import ApiError, api_error_handler
from app.routers import inventory  # noqa: F401 — additional routers registered below

app = FastAPI(
    title="SwasthyaOps AI API",
    version="1.0.0",
    docs_url=None,  # OpenAPI served at /v1/openapi.json for authenticated users only
    openapi_url="/v1/openapi.json",
)

app.add_exception_handler(ApiError, api_error_handler)


@app.middleware("http")
async def trace_context(request: Request, call_next):
    header = request.headers.get("x-cloud-trace-context", "")
    request.state.trace_id = header.split("/")[0] if header else str(uuid.uuid4())
    response = await call_next(request)
    response.headers["x-trace-id"] = request.state.trace_id
    return response


app.include_router(inventory.router)
# Remaining routers land per docs/11_Implementation_Plan.md sprint order:
#   S2: facilities, footfall, attendance     S3: sync, beds, labs
#   S5: alerts                               S6–7: recommendations, reports, briefings
#   S10: query (NL), admin, me


@app.get("/healthz", include_in_schema=False)
async def healthz() -> dict:
    return {"status": "ok"}


@app.get("/readyz", include_in_schema=False)
async def readyz() -> JSONResponse:
    from app.core.firestore import db

    try:
        db().collection("config").document("thresholds").get(timeout=5)
        return JSONResponse({"status": "ready"})
    except Exception as exc:  # noqa: BLE001
        return JSONResponse({"status": "degraded", "reason": str(exc)}, status_code=503)
