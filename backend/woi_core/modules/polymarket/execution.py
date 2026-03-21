from __future__ import annotations
from typing import Any, Dict, Optional
from woi_core.modules.polymarket.execution_entrypoint import execute_order

async def place(runtime, order: Dict[str, Any], expected_mid: Optional[float]=None) -> Dict[str, Any]:
    """Single entrypoint your strategies should call for Polymarket execution."""
    return await execute_order(runtime, order=order, expected_mid=expected_mid)
