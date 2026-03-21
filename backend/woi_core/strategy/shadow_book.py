from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Dict, List, Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ShadowTrade:
    trade_id: str
    symbol: str
    side: str
    thesis: str
    entry_ref: float
    current_ref: float
    pnl_pct: float
    strategy_id: str
    status: str = "open"
    confidence: float = 0.5
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)


class ShadowBook:
    def __init__(self) -> None:
        self.items: Dict[str, ShadowTrade] = {}

    def record(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        trade_id = str(payload.get("trade_id") or payload.get("id") or "").strip()
        if not trade_id:
            raise ValueError("trade_id is required")

        item = ShadowTrade(
            trade_id=trade_id,
            symbol=str(payload.get("symbol") or "SPY").upper(),
            side=str(payload.get("side") or "BUY").upper(),
            thesis=str(payload.get("thesis") or ""),
            entry_ref=float(payload.get("entry_ref") or 0.0),
            current_ref=float(payload.get("current_ref") or payload.get("entry_ref") or 0.0),
            pnl_pct=float(payload.get("pnl_pct") or 0.0),
            strategy_id=str(payload.get("strategy_id") or "unassigned"),
            status=str(payload.get("status") or "open"),
            confidence=float(payload.get("confidence") or 0.5),
        )
        self.items[trade_id] = item
        return {"ok": True, "item": asdict(item)}

    def update(self, trade_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if trade_id not in self.items:
            raise KeyError(f"Unknown trade_id: {trade_id}")

        item = self.items[trade_id]
        for field_name in ["current_ref", "pnl_pct", "status", "confidence", "thesis"]:
            if field_name in payload:
                setattr(item, field_name, payload[field_name])
        item.updated_at = utc_now()
        return {"ok": True, "item": asdict(item)}

    def list(self) -> Dict[str, Any]:
        items = sorted(self.items.values(), key=lambda x: x.updated_at, reverse=True)
        return {"ok": True, "items": [asdict(x) for x in items]}

    def summary(self) -> Dict[str, Any]:
        items = list(self.items.values())
        open_count = len([x for x in items if x.status == "open"])
        closed_count = len([x for x in items if x.status != "open"])
        avg_pnl = sum(x.pnl_pct for x in items) / len(items) if items else 0.0
        return {
            "ok": True,
            "open": open_count,
            "closed": closed_count,
            "avg_pnl_pct": round(avg_pnl, 3),
            "count": len(items),
        }