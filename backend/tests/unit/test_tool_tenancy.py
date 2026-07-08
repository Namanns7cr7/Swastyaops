"""Unit tests for the agent-tool tenancy guard (docs/13 §8, ADR-0003)."""

import pytest
from pydantic import BaseModel

from app.agents.tools.base import enforce_tenancy
from app.core.context import active_district_id
from app.core.errors import PermissionDenied


class _Query(BaseModel):
    district_id: str


@enforce_tenancy
def _tool(q) -> str:
    return "ran"


@pytest.fixture
def bound_to_d1():
    token = active_district_id.set("d1")
    yield
    active_district_id.reset(token)


def test_tool_runs_when_query_matches_active_district(bound_to_d1):
    assert _tool(_Query(district_id="d1")) == "ran"


def test_mismatched_district_is_a_tenancy_violation(bound_to_d1):
    with pytest.raises(PermissionDenied) as exc:
        _tool(_Query(district_id="d2"))
    assert exc.value.reason == "TENANCY_VIOLATION"


def test_dict_queries_are_checked_too(bound_to_d1):
    with pytest.raises(PermissionDenied):
        _tool({"district_id": "d2"})
    assert _tool({"district_id": "d1"}) == "ran"


def test_guard_is_inert_outside_an_agent_session():
    # No active_district_id bound (e.g. unit-level tool invocation): pass through.
    assert _tool(_Query(district_id="d-any")) == "ran"
