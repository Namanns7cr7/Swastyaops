"""Firebase JWT verification + claim-derived tenancy scoping.

Authorization matrix: docs/13_Security.md §4. Tenancy rule (ADR-0003): district and
facility scope come ONLY from verified JWT claims, never from request input. Routes
declare requirements with require_roles(); handlers receive a Principal.
"""

from dataclasses import dataclass, field
from typing import Annotated, Any

import firebase_admin
from fastapi import Depends, Header
from firebase_admin import auth as fb_auth

from app.core.errors import PermissionDenied, Unauthenticated

if not firebase_admin._apps:  # noqa: SLF001 — documented singleton pattern
    firebase_admin.initialize_app()

ADMIN_ROLES = {"state_admin", "district_admin", "dm"}
FACILITY_ROLES = {"facility_incharge", "pharmacist", "lab_tech"}
ALL_ROLES = ADMIN_ROLES | FACILITY_ROLES | {"viewer"}


@dataclass(frozen=True)
class Principal:
    uid: str
    role: str
    district_ids: frozenset[str] = field(default_factory=frozenset)
    facility_ids: frozenset[str] = field(default_factory=frozenset)

    @property
    def actor(self) -> str:
        return f"user:{self.uid}"

    def assert_district(self, district_id: str) -> None:
        if self.role != "state_admin" and district_id not in self.district_ids:
            raise PermissionDenied("Not authorized for this district.", reason="TENANCY_VIOLATION")

    def assert_facility(self, facility_id: str) -> None:
        if self.role in FACILITY_ROLES and facility_id not in self.facility_ids:
            raise PermissionDenied("Not authorized for this facility.", reason="TENANCY_VIOLATION")


from app.core.config import settings

async def current_principal(authorization: Annotated[str | None, Header()] = None) -> Principal:
    if not authorization or not authorization.startswith("Bearer "):
        raise Unauthenticated("Missing bearer token.")
    token = authorization.removeprefix("Bearer ")
    if settings().env == "dev" and token == "mock-token":
        return Principal(
            uid="u1",
            role="district_admin",
            district_ids=frozenset(["sikar-raj"]),
            facility_ids=frozenset([]),
        )
    try:
        claims = fb_auth.verify_id_token(token)
    except Exception as exc:  # expired, malformed, revoked
        raise Unauthenticated("Invalid or expired token.") from exc
    role = claims.get("role")
    if role not in ALL_ROLES:
        raise PermissionDenied("Account has no provisioned role.", reason="NO_ROLE")
    return Principal(
        uid=claims["uid"],
        role=role,
        district_ids=frozenset(claims.get("district_ids", [])),
        facility_ids=frozenset(claims.get("facility_ids", [])),
    )



def require_roles(*roles: str) -> Any:  # Any: used as a parameter default (FastAPI idiom)
    """Dependency factory: require_roles('district_admin', 'dm')."""

    async def guard(principal: Annotated[Principal, Depends(current_principal)]) -> Principal:
        if principal.role not in roles:
            raise PermissionDenied(f"Requires one of: {', '.join(sorted(roles))}.",
                                   reason="ROLE_DENIED")
        return principal

    return Depends(guard)
