from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Any

from .personality import WOIPersonality


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class WOIBrainState:
    status: str = "online"
    active_focus: str = "cross-market intelligence"
    market_regime: str = "mixed"
    market_stress: float = 0.35
    opportunity_score: float = 0.52
    last_summary: str = "🧠 WOI is online and scanning for asymmetric opportunities."
    top_priorities: List[str] = field(default_factory=lambda: [
        "🌍 Monitor macro and geopolitical shifts",
        "🧪 Evaluate strategy candidates in shadow mode",
        "📈 Rank tradable events by urgency and impact",
    ])
    personality: WOIPersonality = field(default_factory=WOIPersonality)
    counters: Dict[str, Any] = field(default_factory=lambda: {
        "events_processed": 0,
        "strategies_active": 0,
        "shadow_trades": 0,
        "promoted_lessons": 0,
        "kill_switch_trips": 0,
    })
    updated_at: str = field(default_factory=utc_now)

    def refresh(
        self,
        *,
        market_regime: str | None = None,
        market_stress: float | None = None,
        opportunity_score: float | None = None,
        summary: str | None = None,
        top_priorities: List[str] | None = None,
    ) -> None:
        if market_regime is not None:
            self.market_regime = market_regime
        if market_stress is not None:
            self.market_stress = max(0.0, min(1.0, float(market_stress)))
        if opportunity_score is not None:
            self.opportunity_score = max(0.0, min(1.0, float(opportunity_score)))
        if summary is not None:
            self.last_summary = summary
        if top_priorities is not None:
            self.top_priorities = top_priorities[:6]

        self.personality.apply_market_context(
            market_stress=self.market_stress,
            opportunity_score=self.opportunity_score,
        )
        self.updated_at = utc_now()

    def bump(self, key: str, amount: int = 1) -> None:
        self.counters[key] = int(self.counters.get(key, 0)) + int(amount)
        self.updated_at = utc_now()

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["personality"] = self.personality.to_dict()
        return data