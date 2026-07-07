"""Inventory write path — the reference implementation of the core loop:
validate → Firestore transaction (ledger append + level update) → domain event.
Flow: docs/03_System_Architecture.md §4.1; API contract: docs/05 §6.2.
"""

import hashlib
from typing import Annotated

from fastapi import APIRouter, Header
from google.cloud import firestore as fs
from uuid_extensions import uuid7str

from app.core.auth import Principal, require_roles
from app.core.errors import FailedPrecondition, NotFound
from app.core.firestore import db, is_idempotent_replay, write_and_publish
from app.core.pubsub import envelope
from app.models.schemas import InventoryTransactionIn, InventoryTransactionOut, TxnType

router = APIRouter(prefix="/v1/facilities/{facility_id}/inventory", tags=["inventory"])

SIGNED = {TxnType.issue: -1, TxnType.expiry: -1, TxnType.transfer_out: -1,
          TxnType.receipt: 1, TxnType.transfer_in: 1, TxnType.adjustment: 1}
RISK_COVER_DAYS = 14


@router.post("/transactions", response_model=InventoryTransactionOut, status_code=201)
async def create_transaction(
    facility_id: str,
    body: InventoryTransactionIn,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
    principal: Principal = require_roles("pharmacist", "facility_incharge"),
) -> InventoryTransactionOut:
    principal.assert_facility(facility_id)
    facility = db().collection("facilities").document(facility_id).get()
    if not facility.exists:
        raise NotFound("Facility not found.")
    district_id = facility.get("district_id")
    principal.assert_district(district_id)

    if idempotency_key:
        digest = hashlib.sha256(body.model_dump_json().encode()).hexdigest()
        if is_idempotent_replay(idempotency_key, digest):
            prior = (db().collection_group("ledger")
                     .where("idempotency_key", "==", idempotency_key).limit(1).get())
            return InventoryTransactionOut(**prior[0].to_dict()["response_snapshot"])

    item_ref = (db().collection("facilities").document(facility_id)
                .collection("inventory").document(body.item_code))
    item = item_ref.get()
    if not item.exists:
        raise NotFound(f"Item {body.item_code} not in facility catalog.")
    item_data = item.to_dict()
    current = item_data["current_stock"]
    delta = SIGNED[body.type] * body.qty
    if current + delta < 0:
        raise FailedPrecondition(
            f"Issue of {body.qty} exceeds current stock {current} for {body.item_code}.",
            reason="INSUFFICIENT_STOCK", metadata={"current_stock": current},
        )
    balance = current + delta
    txn_id = f"txn_{uuid7str()}"

    burn = item_data.get("avg_daily_consumption") or 0
    below_risk_cover = burn and balance / burn < RISK_COVER_DAYS
    warning = "STOCK_RISK: below 14-day cover based on current burn rate" if below_risk_cover else None

    out = InventoryTransactionOut(txn_id=txn_id, item_code=body.item_code,
                                  balance_after=balance,
                                  predicted_stockout_date=item_data.get("predicted_stockout_date"),
                                  warning=warning)
    ledger_ref = item_ref.collection("ledger").document(txn_id)
    write_and_publish(
        writes=[
            (item_ref, {"current_stock": balance}, True),
            (ledger_ref, {
                "type": body.type, "qty": delta, "balance_after": balance,
                "batch_no": body.batch_no, "source": body.source,
                "recorded_at": body.recorded_at, "idempotency_key": idempotency_key,
                "created_by": principal.actor, "district_id": district_id,
                "response_snapshot": out.model_dump(mode="json"),
                "created_at": fs.SERVER_TIMESTAMP,
            }, False),
        ],
        event=envelope(
            "facility.inventory.updated", district_id,
            {"txn_id": txn_id, "item_code": body.item_code,
             "item_name": item_data.get("name"), "txn_type": body.type,
             "qty": delta, "balance_after": balance, "batch_no": body.batch_no,
             "source": body.source, "recorded_at": body.recorded_at.isoformat()},
            actor=principal.actor, facility_id=facility_id,
        ),
    )
    return out
