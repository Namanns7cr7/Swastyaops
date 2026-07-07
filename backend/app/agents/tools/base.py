"""Shared agent tool library (docs/07_Agent_Design.md, common contract).

Every tool: Pydantic-validated I/O, district-scoped, runs under sa-svc-agents, returns
digests not dumps (docs/06 §6 — top-N + aggregate, never full tables). BigQuery access
is through parameterized templates only — agents cannot compose SQL (docs/13 §8).

Representative implementations below; the per-agent specialist tools referenced in
app/agents/registry.py follow the same pattern and land per the sprint plan.
"""

from typing import Any

from pydantic import BaseModel, Field

from app.core.firestore import db


class StockQuery(BaseModel):
    district_id: str
    item_code: str | None = None
    risk_only: bool = False
    limit: int = Field(default=20, le=50)


def query_stock_levels(q: StockQuery) -> dict[str, Any]:
    """Current stock across facilities for an item (or all risk items). Digest: top-N by urgency."""
    coll = db().collection_group("inventory").where("district_id", "==", q.district_id)
    if q.item_code:
        coll = coll.where("item_code", "==", q.item_code)
    if q.risk_only:
        coll = coll.order_by("predicted_stockout_date").limit(q.limit)
    rows = [
        {"facility_id": d.reference.parent.parent.id, "item_code": d.get("item_code"),
         "current_stock": d.get("current_stock"),
         "predicted_stockout_date": str(d.get("predicted_stockout_date") or ""),
         "avg_daily_consumption": d.get("avg_daily_consumption")}
        for d in coll.limit(q.limit).stream()
    ]
    return {"rows": rows, "count": len(rows),
            "citation": {"kind": "metric", "ref": f"inventory?district={q.district_id}&item={q.item_code}"}}


class FacilityQuery(BaseModel):
    district_id: str
    facility_id: str


def get_facility(q: FacilityQuery) -> dict[str, Any]:
    snap = db().collection("facilities").document(q.facility_id).get()
    if not snap.exists or snap.get("district_id") != q.district_id:
        return {"error": "not_found"}
    data = snap.to_dict()
    keep = ("name", "type", "block", "status", "health_score", "snapshot", "sanctioned", "services")
    return {k: data.get(k) for k in keep} | {
        "citation": {"kind": "metric", "ref": f"facilities/{q.facility_id}"}}


class RememberFact(BaseModel):
    district_id: str
    agent: str
    fact: str = Field(max_length=500)


def remember_fact(q: RememberFact) -> dict[str, Any]:
    """Explicit Memory Bank write — surfaced in admin UI S15, deletable (docs/13 §8)."""
    from vertexai import agent_engines  # deferred import; memory bank client

    agent_engines.MemoryBank(scope=f"district/{q.district_id}").store(
        fact=q.fact, source=f"agent:{q.agent}")
    return {"stored": True}


# ── Registered-but-sprint-scheduled tools (docs/11 sprint order). Each raises until
# implemented so a prompt referencing it fails loudly in evals, never silently. ──────
def _pending(name: str, sprint: str):
    def _fn(*_a: Any, **_k: Any) -> dict[str, Any]:
        raise NotImplementedError(f"tool {name} lands in {sprint} (docs/11_Implementation_Plan.md)")
    _fn.__name__ = name
    return _fn


list_facilities = _pending("list_facilities", "Sprint 2")
get_stock_ledger = _pending("get_stock_ledger", "Sprint 2")
query_curated = _pending("query_curated", "Sprint 5")
get_forecast = _pending("get_forecast", "Sprint 5")
list_open_alerts = _pending("list_open_alerts", "Sprint 5")
list_recommendations = _pending("list_recommendations", "Sprint 6")
get_weather = _pending("get_weather", "Sprint 5")
travel_time = _pending("travel_time", "Sprint 6")
recall_facts = _pending("recall_facts", "Sprint 6")
dispatch_task = _pending("dispatch_task", "Sprint 6")
get_plan_status = _pending("get_plan_status", "Sprint 6")
find_donor_facilities = _pending("find_donor_facilities", "Sprint 6")
get_indent_calendar = _pending("get_indent_calendar", "Sprint 6")
get_model_metrics = _pending("get_model_metrics", "Sprint 9")
get_idsp_reports = _pending("get_idsp_reports", "Sprint 8")
spatial_cluster = _pending("spatial_cluster", "Sprint 8")
get_attendance_history = _pending("get_attendance_history", "Sprint 8")
get_sanctioned_vs_actual = _pending("get_sanctioned_vs_actual", "Sprint 8")
find_available_beds = _pending("find_available_beds", "Sprint 8")
find_alternative_lab = _pending("find_alternative_lab", "Sprint 8")
create_recommendation = _pending("create_recommendation", "Sprint 6")
take_validity_snapshot = _pending("take_validity_snapshot", "Sprint 6")
get_kpi_series = _pending("get_kpi_series", "Sprint 9")
request_render = _pending("request_render", "Sprint 9")
resolve_recipients = _pending("resolve_recipients", "Sprint 8")
enqueue_notification = _pending("enqueue_notification", "Sprint 8")
get_overnight_delta = _pending("get_overnight_delta", "Sprint 9")

BASE = [get_facility, list_facilities, query_stock_levels, get_stock_ledger, query_curated,
        get_forecast, list_open_alerts, list_recommendations, get_weather, travel_time,
        remember_fact, recall_facts]
