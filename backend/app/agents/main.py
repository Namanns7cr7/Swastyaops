"""svc-agents — Pub/Sub push receiver hosting the Vertex AI Agent Engine runtime.

One filtered push subscription per agent delivers task envelopes here
(architecture/pubsub_topics.yaml → agents.tasks.dispatch). Every run is audited to
agent_runs regardless of outcome (docs/06_AI_Architecture.md §9).
"""

import base64
import json
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from google.cloud import firestore as fs
from uuid_extensions import uuid7str

from app.agents.registry import get_agent
from app.core import pubsub
from app.core.firestore import db
from app.core.logging import configure_logging

configure_logging()

app = FastAPI(title="svc-agents", docs_url=None, openapi_url=None)



@app.post("/internal/pubsub/tasks")
async def handle_task(request: Request) -> JSONResponse:
    # Ingress is internal-only + OIDC-authenticated (docs/02_TRD.md §12); the OIDC
    # audience/SA check happens in middleware configured at deploy (cloudrun.tf).
    body = await request.json()
    task = json.loads(base64.b64decode(body["message"]["data"]))
    event_id = task["event_id"]

    # Consumer idempotency (TRD §3): dedup on event_id.
    from google.api_core.exceptions import AlreadyExists as GcpAlreadyExists
    dedup_ref = db().collection("processed_events").document(f"agents_{event_id}")
    try:
        dedup_ref.create({
            "at": fs.SERVER_TIMESTAMP,
            "expires_at": datetime.now(UTC) + timedelta(days=30),
        })
    except GcpAlreadyExists:
        return JSONResponse({"status": "duplicate_ignored"})


    payload = task["payload"]
    agent_name = payload["agent"]
    run_id = f"run_{uuid7str()}"
    run_ref = db().collection("agent_runs").document(run_id)
    run_ref.set({
        "agent": agent_name, "task_type": payload["task_type"],
        "trigger_event_id": event_id, "plan_id": payload.get("plan_id"),
        "district_id": task["district_id"], "status": "running",
        "created_at": fs.SERVER_TIMESTAMP,
        "expires_at": datetime.now(UTC) + timedelta(days=30),
    })

    from app.core.context import active_district_id

    agent = get_agent(agent_name)
    token = active_district_id.set(task["district_id"])
    try:
        try:
            result = await agent.run(task=payload, district_id=task["district_id"], run_ref=run_ref)
            outcome = result.get("outcome", "ok")
        except Exception as exc:  # noqa: BLE001 — outcome recorded; Pub/Sub retry via 500
            run_ref.update({"status": "failed", "error": str(exc)[:2000]})
            # 5xx → Pub/Sub redelivers (backoff per TRD §11); after 5 attempts → DLQ.
            return JSONResponse({"status": "error"}, status_code=500)
    finally:
        active_district_id.reset(token)


    run_ref.update({"status": "done", "outcome": outcome,
                    "prompt_version": agent.prompt_version, "model": agent.model,
                    "tokens": result.get("tokens"), "cost_usd": result.get("cost_usd"),
                    "latency_ms": result.get("latency_ms")})
    pubsub.publish(pubsub.envelope(
        "agents.runs.completed", task["district_id"],
        {"run_id": run_id, "task_id": payload["task_id"], "plan_id": payload.get("plan_id"),
         "agent": agent_name, "outcome": outcome,
         "result_ref": f"agent_runs/{run_id}", "summary": result.get("summary", {})},
        actor=f"agent:{agent_name}",
    ))
    return JSONResponse({"status": "ok", "run_id": run_id})


@app.get("/healthz", include_in_schema=False)
async def healthz() -> dict:
    return {"status": "ok"}
