"""API request/response models. Shapes mirror docs/04_Database_Schema.md; the served
OpenAPI generated from these models must match docs/05_API_Specification.md (contract
test: tests/contract/test_openapi_drift.py)."""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, PositiveInt


class TxnType(StrEnum):
    receipt = "receipt"
    issue = "issue"
    adjustment = "adjustment"
    expiry = "expiry"
    transfer_in = "transfer_in"
    transfer_out = "transfer_out"


class EntrySource(StrEnum):
    form = "form"
    voice = "voice"
    barcode = "barcode"
    import_ = "import"


class InventoryTransactionIn(BaseModel):
    item_code: str = Field(pattern=r"^EDL-[A-Z0-9-]+$")
    type: TxnType
    qty: PositiveInt
    batch_no: str | None = None
    source: EntrySource = EntrySource.form
    recorded_at: datetime  # client clock; server timestamp authoritative (PRD §9)


class InventoryTransactionOut(BaseModel):
    txn_id: str
    item_code: str
    balance_after: int
    predicted_stockout_date: datetime | None = None
    warning: str | None = None


class FootfallIn(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    delta: PositiveInt
    by_symptom: dict[Literal["fever", "diarrheal", "respiratory", "injury", "anc", "other"], int]
    source: EntrySource = EntrySource.form
    recorded_at: datetime


class Severity(StrEnum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class AlertStatus(StrEnum):
    open = "open"
    acknowledged = "acknowledged"
    in_progress = "in_progress"
    resolved = "resolved"
    dismissed = "dismissed"


class Citation(BaseModel):
    kind: Literal["metric", "forecast", "event", "dataset", "recommendation", "memory"]
    ref: str
    value: dict | None = None


class AlertOut(BaseModel):
    id: str
    district_id: str
    facility_ids: list[str]
    type: str
    severity: Severity
    status: AlertStatus
    title: str
    summary: str
    evidence: list[Citation]
    source: str
    agent_run_id: str | None
    recommendation_ids: list[str]
    created_at: datetime


class TransferAction(BaseModel):
    kind: Literal["transfer"] = "transfer"
    item_code: str
    qty: PositiveInt
    from_facility_id: str
    to_facility_id: str
    by_date: str


class IndentAction(BaseModel):
    kind: Literal["indent"] = "indent"
    item_code: str
    qty: PositiveInt
    supplier: Literal["RMSC"] = "RMSC"
    priority: Literal["routine", "urgent", "emergency"]


class DirectiveAction(BaseModel):
    kind: Literal["directive"] = "directive"
    facility_id: str
    staff_role: str
    instruction: str
    duration_days: PositiveInt


RecommendationAction = TransferAction | IndentAction | DirectiveAction


class RecommendationOut(BaseModel):
    id: str
    district_id: str
    alert_id: str | None
    type: str
    status: Literal["draft", "pending_approval", "approved", "rejected", "executed", "expired"]
    title: str
    rationale: str
    actions: list[RecommendationAction]
    agent_run_id: str
    created_at: datetime


class ApproveRequest(BaseModel):
    edits: list[dict] | None = None  # RFC 6902 JSON Patch over /actions


class RejectRequest(BaseModel):
    rejection_reason: str = Field(min_length=10)  # feeds the eval loop (docs/06 §8)


class SyncMutation(BaseModel):
    idempotency_key: str
    method: Literal["POST", "PUT"]
    path: str
    payload: dict


class SyncBatchIn(BaseModel):
    mutations: list[SyncMutation] = Field(max_length=200)


class SyncItemResult(BaseModel):
    idempotency_key: str
    status_code: int
    replayed: bool = False
    warning: str | None = None
    error: dict | None = None
