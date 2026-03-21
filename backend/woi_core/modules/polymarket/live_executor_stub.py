from __future__ import annotations
from typing import Any, Dict

async def place_live_order(order: Dict[str, Any]) -> Dict[str, Any]:
    return {"ok": False, "error": "live_executor_stub_not_configured", "order": order}
