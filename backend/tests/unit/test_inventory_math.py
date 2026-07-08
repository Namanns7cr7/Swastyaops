"""Unit tests for the inventory write path invariants (docs/12 §1 — unit level)."""

from datetime import UTC, datetime

import pytest
from hypothesis import given
from hypothesis import strategies as st

from app.models.schemas import InventoryTransactionIn, TxnType
from app.routers.inventory import RISK_COVER_DAYS, SIGNED


def test_signed_direction_covers_every_txn_type():
    assert set(SIGNED) == set(TxnType)
    assert all(s in (-1, 1) for s in SIGNED.values())


@given(current=st.integers(min_value=0, max_value=10_000),
       qty=st.integers(min_value=1, max_value=10_000))
def test_issue_never_goes_negative(current: int, qty: int):
    delta = SIGNED[TxnType.issue] * qty
    allowed = current + delta >= 0
    assert allowed == (qty <= current)


@pytest.mark.parametrize(("stock", "burn", "risky"),
                         [(50, 10, True), (200, 10, False), (140, 10, False), (139, 10, True)])
def test_risk_warning_threshold(stock: int, burn: float, risky: bool):
    assert (stock / burn < RISK_COVER_DAYS) is risky


def test_item_code_pattern_rejects_garbage():
    with pytest.raises(ValueError):
        InventoryTransactionIn(item_code="ors 200", type=TxnType.issue, qty=1,
                               recorded_at=datetime.now(UTC))


def test_qty_must_be_positive():
    with pytest.raises(ValueError):
        InventoryTransactionIn(item_code="EDL-ORS-200", type=TxnType.issue, qty=0,
                               recorded_at=datetime.now(UTC))
