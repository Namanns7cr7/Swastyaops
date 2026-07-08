"""Unit tests for JWT-derived tenancy scoping (docs/13 §4, ADR-0003 — unit level)."""

import pytest

from app.core import auth
from app.core.auth import Principal, current_principal, require_roles
from app.core.errors import PermissionDenied, Unauthenticated


def _principal(role: str, districts=("d1",), facilities=("f1",)) -> Principal:
    return Principal(uid="u1", role=role,
                     district_ids=frozenset(districts), facility_ids=frozenset(facilities))


# ── Principal tenancy assertions ─────────────────────────────────────────────

def test_actor_is_prefixed_uid():
    assert _principal("pharmacist").actor == "user:u1"


def test_state_admin_may_touch_any_district():
    _principal("state_admin", districts=()).assert_district("d-anything")


def test_district_admin_allowed_only_in_own_districts():
    principal = _principal("district_admin", districts=("d1", "d2"))
    principal.assert_district("d2")
    with pytest.raises(PermissionDenied) as exc:
        principal.assert_district("d3")
    assert exc.value.reason == "TENANCY_VIOLATION"


def test_facility_role_bound_to_its_facilities():
    principal = _principal("pharmacist", facilities=("f1",))
    principal.assert_facility("f1")
    with pytest.raises(PermissionDenied) as exc:
        principal.assert_facility("f2")
    assert exc.value.reason == "TENANCY_VIOLATION"


def test_admin_roles_are_not_facility_bound():
    # District admins operate across every facility of their districts (docs/13 §4).
    _principal("district_admin", facilities=()).assert_facility("f-any")


# ── current_principal (token → Principal) ────────────────────────────────────

async def test_missing_authorization_header_is_unauthenticated():
    with pytest.raises(Unauthenticated):
        await current_principal(None)


async def test_non_bearer_scheme_is_unauthenticated():
    with pytest.raises(Unauthenticated):
        await current_principal("Basic dXNlcjpwdw==")


async def test_invalid_token_is_unauthenticated(monkeypatch):
    def _reject(token):
        raise ValueError("expired")
    monkeypatch.setattr(auth.fb_auth, "verify_id_token", _reject)
    with pytest.raises(Unauthenticated):
        await current_principal("Bearer bad-token")


async def test_token_without_provisioned_role_is_denied(monkeypatch):
    monkeypatch.setattr(auth.fb_auth, "verify_id_token", lambda t: {"uid": "u1"})
    with pytest.raises(PermissionDenied) as exc:
        await current_principal("Bearer token")
    assert exc.value.reason == "NO_ROLE"


async def test_valid_token_yields_scoped_principal(monkeypatch):
    claims = {"uid": "u9", "role": "pharmacist",
              "district_ids": ["d1"], "facility_ids": ["f1", "f2"]}
    monkeypatch.setattr(auth.fb_auth, "verify_id_token", lambda t: claims)
    principal = await current_principal("Bearer good-token")
    assert principal == Principal(uid="u9", role="pharmacist",
                                  district_ids=frozenset({"d1"}),
                                  facility_ids=frozenset({"f1", "f2"}))


async def test_scope_claims_default_to_empty(monkeypatch):
    monkeypatch.setattr(auth.fb_auth, "verify_id_token",
                        lambda t: {"uid": "u9", "role": "viewer"})
    principal = await current_principal("Bearer token")
    assert principal.district_ids == frozenset()
    assert principal.facility_ids == frozenset()


# ── require_roles guard ──────────────────────────────────────────────────────

async def test_guard_admits_listed_role():
    guard = require_roles("pharmacist", "facility_incharge").dependency
    principal = _principal("pharmacist")
    assert await guard(principal) is principal


async def test_guard_rejects_unlisted_role():
    guard = require_roles("district_admin", "dm").dependency
    with pytest.raises(PermissionDenied) as exc:
        await guard(_principal("viewer"))
    assert exc.value.reason == "ROLE_DENIED"
