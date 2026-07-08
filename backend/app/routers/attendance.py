"""Attendance write endpoints.

Handles daily staffing logs (present/absent/leave) and updates doctors present snapshot count.
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
from app.models.schemas import AttendanceMarkIn

router = APIRouter(tags=["attendance"])


@router.put("/v1/facilities/{facility_id}/attendance/{date}", status_code=200)
async def record_attendance(
    facility_id: str,
    date: str,
    body: AttendanceMarkIn,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
    principal: Principal = require_roles("facility_incharge"),
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
            prior = (db().collection_group("attendance")
                     .where("idempotency_key", "==", idempotency_key).limit(1).get())
            if prior:
                return prior[0].to_dict()["response_snapshot"]

    attendance_ref = facility_ref.collection("attendance").document(date)

    # Compute how many doctors are present from body entries
    doctors_present = sum(
        1 for e in body.entries 
        if e.role.lower() == "doctor" and e.status.value == "present"
    )

    response_snapshot = {
        "date": date,
        "doctors_present": doctors_present,
        "total_staff_logged": len(body.entries),
    }

    # Save daily logs and update facility snapshot atomically
    @fs.transactional
    def _txn(txn: fs.Transaction) -> None:
        txn.set(attendance_ref, {
            "entries": [e.model_dump() for e in body.entries],
            "marked_by": principal.actor,
            "marked_at": fs.SERVER_TIMESTAMP,
            "idempotency_key": idempotency_key,
            "response_snapshot": response_snapshot,
            "district_id": district_id,
            "_published": False,
            "updated_at": fs.SERVER_TIMESTAMP,
        }, merge=True)

        txn.update(facility_ref, {
            "snapshot.doctors_present_today": doctors_present,
            "snapshot.last_event_at": fs.SERVER_TIMESTAMP,
        })

    _txn(db().transaction())

    # Publish domain event
    write_and_publish(
        writes=[
            (attendance_ref, {"_published": False}, True),
        ],
        event=envelope(
            "facility.attendance.recorded", district_id,
            {
                "date": date,
                "doctors_present": doctors_present,
                "staff_count": len(body.entries),
                "recorded_at": fs.SERVER_TIMESTAMP,
            },
            actor=principal.actor, facility_id=facility_id,
        ),
    )

    return response_snapshot
