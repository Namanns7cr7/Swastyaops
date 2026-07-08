"""Footfall write endpoints.

Handles daily symptom-mix tracking and updates facility snapshot values.
Contract: docs/05_API_Specification.md §6.2.
"""

import hashlib
from typing import Annotated

from fastapi import APIRouter, Header
from google.cloud import firestore as fs

from app.core.auth import Principal, require_roles
from app.core.errors import NotFound
from app.core.firestore import db, is_idempotent_replay, write_and_publish
from app.core.pubsub import envelope
from app.models.schemas import FootfallIn

router = APIRouter(tags=["footfall"])


@router.post("/v1/facilities/{facility_id}/footfall", status_code=201)
async def record_footfall(
    facility_id: str,
    body: FootfallIn,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
    principal: Principal = require_roles("pharmacist", "facility_incharge"),
) -> dict:
    principal.assert_facility(facility_id)
    facility_ref = db().collection("facilities").document(facility_id)
    facility = facility_ref.get()
    if not facility.exists:
        raise NotFound("Facility not found.")
    
    district_id = facility.get("district_id")
    principal.assert_district(district_id)

    if idempotency_key:
        digest = hashlib.sha256(body.model_dump_json().encode()).hexdigest()
        if is_idempotent_replay(idempotency_key, digest):
            prior = (db().collection_group("footfall")
                     .where("idempotency_key", "==", idempotency_key).limit(1).get())
            if prior:
                return prior[0].to_dict()["response_snapshot"]

    footfall_ref = facility_ref.collection("footfall").document(body.date)
    
    # We execute a transaction to atomically read and update the daily footfall log.
    @fs.transactional
    def _txn(txn: fs.Transaction) -> dict:
        snap = footfall_ref.get(transaction=txn)
        if snap.exists:
            current_data = snap.to_dict()
            new_total = current_data.get("total", 0) + body.delta
            
            current_symptoms = current_data.get("by_symptom", {})
            symptoms = ["fever", "diarrheal", "respiratory", "injury", "anc", "other"]
            new_symptoms = {}
            for sym in symptoms:
                new_symptoms[sym] = current_symptoms.get(sym, 0) + body.by_symptom.get(sym, 0)
                
            entries = current_data.get("entries", [])
        else:
            new_total = body.delta
            symptoms = ["fever", "diarrheal", "respiratory", "injury", "anc", "other"]
            new_symptoms = {sym: body.by_symptom.get(sym, 0) for sym in symptoms}
            entries = []

        new_entry = {
            "recorded_at": body.recorded_at,
            "delta": body.delta,
            "by_symptom": body.by_symptom,
        }
        entries.append(new_entry)

        response_snapshot = {
            "date": body.date,
            "total": new_total,
            "by_symptom": new_symptoms,
            "recorded_delta": body.delta,
        }

        # Stage the document updates in transaction
        txn.set(footfall_ref, {
            "total": new_total,
            "by_symptom": new_symptoms,
            "source": body.source,
            "entries": entries,
            "idempotency_key": idempotency_key,
            "response_snapshot": response_snapshot,
            "district_id": district_id,
            "_published": False,
            "updated_at": fs.SERVER_TIMESTAMP,
        }, merge=True)

        # Stage facility snapshot updates in transaction
        txn.update(facility_ref, {
            "snapshot.footfall_today": new_total,
            "snapshot.last_event_at": fs.SERVER_TIMESTAMP,
        })

        return response_snapshot

    response = _txn(db().transaction())

    # Publish domain event
    write_and_publish(
        writes=[
            (footfall_ref, {"_published": False}, True),
        ],
        event=envelope(
            "facility.footfall.recorded", district_id,
            {
                "date": body.date,
                "delta": body.delta,
                "total_today": response["total"],
                "by_symptom": body.by_symptom,
                "source": body.source,
                "recorded_at": body.recorded_at.isoformat(),
            },
            actor=principal.actor, facility_id=facility_id,
        ),
    )

    return response
