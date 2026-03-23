from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any, List


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class LiveExecutionGate:
    def __init__(self) -> None:
        self.queue: List[Dict[str, Any]] = []
        self.executed: List[Dict[str, Any]] = []

    def queue_order(self, order: Dict[str, Any], guard_result: Dict[str, Any]) -> Dict[str, Any]:
        item = {
            "queue_id": order.get("order_id") or f"live-{len(self.queue)+1}",
            "symbol": str(order.get("symbol") or "").upper(),
            "asset_class": str(order.get("asset_class") or "stocks"),
            "side": str(order.get("side") or "BUY").upper(),
            "qty": float(order.get("qty") or 0.0),
            "price": float(order.get("price") or 0.0),
            "notional_usd": float(order.get("notional_usd") or 0.0),
            "mode": "live",
            "guard_result": guard_result,
            "status": "queued" if guard_result.get("approved") else "rejected",
            "ts_utc": utc_now(),
        }
        if item["status"] == "queued":
            self.queue.insert(0, item)
            self.queue = self.queue[:200]
        return {"ok": True, "item": item}

    def approve(self, queue_id: str) -> Dict[str, Any]:
        for idx, item in enumerate(self.queue):
            if item["queue_id"] == queue_id:
                item["status"] = "approved"
                item["approved_at"] = utc_now()
                self.executed.insert(0, item)
                self.executed = self.executed[:200]
                self.queue.pop(idx)
                return {"ok": True, "item": item}
        return {"ok": False, "error": "queue_id not found"}

    def queued(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.queue[:100]}

    def history(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.executed[:100]}