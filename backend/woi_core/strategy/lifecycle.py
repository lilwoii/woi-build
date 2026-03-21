from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Dict, List, Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


VALID_STAGES = [
    "draft",
    "paper-observing",
    "shadow-live",
    "guarded-live",
    "paused",
    "killed",
    "retired",
]


@dataclass
class StrategyLifecycleItem:
    strategy_id: str
    name: str
    stage: str = "draft"
    symbol: str = "SPY"
    thesis: str = ""
    score: float = 0.0
    confidence: float = 0.5
    trades_shadow: int = 0
    trades_live: int = 0
    last_result: str = "N/A"
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    timeline: List[Dict[str, Any]] = field(default_factory=list)

    def advance(self, stage: str, note: str = "") -> None:
        if stage not in VALID_STAGES:
            raise ValueError(f"Invalid stage: {stage}")
        self.stage = stage
        self.updated_at = utc_now()
        self.timeline.insert(0, {
            "ts_utc": self.updated_at,
            "stage": stage,
            "note": note,
        })
        self.timeline = self.timeline[:50]


class StrategyLifecycleStore:
    def __init__(self) -> None:
        self.items: Dict[str, StrategyLifecycleItem] = {}

    def upsert(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        strategy_id = str(payload.get("strategy_id") or payload.get("id") or "").strip()
        if not strategy_id:
            raise ValueError("strategy_id is required")

        item = self.items.get(strategy_id)
        if item is None:
            item = StrategyLifecycleItem(
                strategy_id=strategy_id,
                name=str(payload.get("name") or strategy_id),
                symbol=str(payload.get("symbol") or "SPY"),
                thesis=str(payload.get("thesis") or ""),
            )
            item.advance("draft", "🚀 Strategy registered")
            self.items[strategy_id] = item

        for field_name in ["name", "symbol", "thesis", "score", "confidence", "trades_shadow", "trades_live", "last_result"]:
            if field_name in payload:
                setattr(item, field_name, payload[field_name])

        item.updated_at = utc_now()
        return {"ok": True, "item": asdict(item)}

    def advance(self, strategy_id: str, stage: str, note: str = "") -> Dict[str, Any]:
        if strategy_id not in self.items:
            raise KeyError(f"Unknown strategy_id: {strategy_id}")
        self.items[strategy_id].advance(stage, note)
        return {"ok": True, "item": asdict(self.items[strategy_id])}

    def list(self) -> Dict[str, Any]:
        items = sorted(self.items.values(), key=lambda x: x.updated_at, reverse=True)
        return {"ok": True, "items": [asdict(x) for x in items]}

    def summary(self) -> Dict[str, Any]:
        counts = {stage: 0 for stage in VALID_STAGES}
        for item in self.items.values():
            counts[item.stage] = counts.get(item.stage, 0) + 1
        return {"ok": True, "counts": counts}