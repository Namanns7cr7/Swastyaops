"""Facilities and Districts read endpoints.

Scoped per tenancy claims of the Principal (district/facility lists).
Contract: docs/05_API_Specification.md §6.1.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from app.core.auth import Principal, require_roles
from app.core.errors import NotFound
from app.core.firestore import db

router = APIRouter(tags=["facilities"])


@router.get("/v1/districts/{district_id}")
async def get_district(
    district_id: str,
    principal: Principal = require_roles("state_admin", "district_admin", "dm", "viewer"),
) -> dict:
    principal.assert_district(district_id)
    doc = db().collection("districts").document(district_id).get()
    if not doc.exists:
        raise NotFound("District not found.")
    return {"id": doc.id, **doc.to_dict()}


@router.get("/v1/districts/{district_id}/facilities")
async def list_facilities(
    district_id: str,
    type: Annotated[str | None, Query()] = None,
    status: Annotated[str | None, Query()] = None,
    min_score: Annotated[float | None, Query()] = None,
    max_score: Annotated[float | None, Query()] = None,
    block: Annotated[str | None, Query()] = None,
    sort_by: Annotated[str, Query()] = "health_score",
    sort_order: Annotated[str, Query()] = "asc",
    principal: Principal = require_roles(
        "state_admin", "district_admin", "dm", "viewer", "facility_incharge",
        "pharmacist", "lab_tech"
    ),
) -> dict:
    # Tenancy scoping
    principal.assert_district(district_id)

    coll = db().collection("facilities").where("district_id", "==", district_id)

    if type:
        coll = coll.where("type", "==", type)
    if status:
        coll = coll.where("status", "==", status)
    if block:
        coll = coll.where("block", "==", block)

    docs = coll.get()
    results = []

    for d in docs:
        data = d.to_dict()
        score = data.get("health_score", 0.0)

        # Apply min/max score filters in memory if needed
        if min_score is not None and score < min_score:
            continue
        if max_score is not None and score > max_score:
            continue

        results.append({"id": d.id, **data})

    # Sort results
    reverse = sort_order == "desc"
    results.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)

    return {"facilities": results, "count": len(results)}


@router.get("/v1/districts/{district_id}/summary")
async def get_district_summary(
    district_id: str,
    principal: Principal = require_roles("state_admin", "district_admin", "dm", "viewer"),
) -> dict:
    principal.assert_district(district_id)
    doc = db().collection("districts").document(district_id).get()
    if not doc.exists:
        raise NotFound("District not found.")
    
    data = doc.to_dict() or {}
    # Build Looker Studio/Command Center tiles structure
    counters = data.get("counters", {})
    reporting = counters.get("reporting", 0)
    facilities = counters.get("facilities", 0)
    return {
        "district_id": district_id,
        "name": data.get("name"),
        "health_score": data.get("health_score", 0),
        "counters": counters,
        "reporting_rate": f"{reporting}/{facilities}",
    }


@router.get("/v1/facilities/{facility_id}")
async def get_facility(
    facility_id: str,
    principal: Principal = require_roles(
        "state_admin", "district_admin", "dm", "viewer", "facility_incharge",
        "pharmacist", "lab_tech"
    ),
) -> dict:
    doc = db().collection("facilities").document(facility_id).get()
    if not doc.exists:
        raise NotFound("Facility not found.")
    
    data = doc.to_dict()
    principal.assert_district(data.get("district_id"))
    principal.assert_facility(facility_id)
    
    return {"id": doc.id, **data}
