from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any, List


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PaperBlotter:
    def __init__(self) -> None:
        self.orders: List[Dict[str, Any]] = []
        self.positions: List[Dict[str, Any]] = []

    def submit(self, order: Dict[str, Any]) -> Dict[str, Any]:
        item = {
            "order_id": order.get("order_id") or f"paper-{len(self.orders)+1}",
            "symbol": str(order.get("symbol") or "").upper(),
            "asset_class": str(order.get("asset_class") or "stocks"),
            "side": str(order.get("side") or "BUY").upper(),
            "qty": float(order.get("qty") or 0.0),
            "price": float(order.get("price") or 0.0),
            "notional_usd": float(order.get("notional_usd") or 0.0),
            "mode": "paper",
            "status": "filled",
            "ts_utc": utc_now(),
        }
        self.orders.insert(0, item)
        self.orders = self.orders[:500]

        self.positions.insert(0, {
            "symbol": item["symbol"],
            "asset_class": item["asset_class"],
            "side": item["side"],
            "qty": item["qty"],
            "entry_price": item["price"],
            "mode": "paper",
            "opened_at": item["ts_utc"],
        })
        self.positions = self.positions[:200]
        return {"ok": True, "order": item}

    def list_orders(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.orders[:100]}

    def list_positions(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.positions[:100]}