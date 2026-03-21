from __future__ import annotations
import os
from typing import Any, Dict, Optional

from woi_core.alpha.shadow_mode import load_runtime_mode
from woi_core.alpha.risk_governor import RiskGovernor
from woi_core.modules.polymarket.execution_guard import place_order_guarded
from woi_core.modules.polymarket.live_executor_stub import place_live_order as stub_place

_risk = RiskGovernor()

def _get_executor():
    choice = os.getenv("POLY_EXECUTOR", "stub").lower().strip()
    if choice == "pmxt":
        try:
            from woi_core.modules.polymarket.live_executor_pmxt import place_live_order as pmxt_place
            return pmxt_place
        except Exception:
            return stub_place
    return stub_place

async def execute_order(runtime, order: Dict[str, Any], expected_mid: Optional[float]=None) -> Dict[str, Any]:
    mode = load_runtime_mode()
    executor = _get_executor()
    return await place_order_guarded(
        runtime=runtime,
        order=order,
        expected_mid=expected_mid,
        live_enabled=bool(mode.get("live_enabled", False)),
        shadow_enabled=bool(mode.get("shadow_enabled", True)),
        risk_governor=_risk,
        executor=executor,
    )

def risk_status() -> Dict[str, Any]:
    return _risk.status()

def risk_note_error():
    _risk.note_error()
