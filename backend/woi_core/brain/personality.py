from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict


@dataclass
class WOIPersonality:
    mode: str = "tactical"          # tactical | aggressive | defensive | research
    emotion: str = "focused"        # focused | calm | alert | stressed | opportunistic
    voice: str = "confident"        # confident | analytical | cautious
    confidence_bias: float = 0.55   # 0..1
    urgency_bias: float = 0.60      # 0..1
    risk_bias: float = 0.45         # 0..1

    def to_dict(self) -> Dict:
        return asdict(self)

    def apply_market_context(self, market_stress: float, opportunity_score: float) -> None:
        market_stress = max(0.0, min(1.0, float(market_stress)))
        opportunity_score = max(0.0, min(1.0, float(opportunity_score)))

        if market_stress >= 0.8:
            self.mode = "defensive"
            self.emotion = "alert"
            self.voice = "cautious"
            self.risk_bias = 0.20
            self.urgency_bias = 0.85
        elif opportunity_score >= 0.75 and market_stress < 0.55:
            self.mode = "aggressive"
            self.emotion = "opportunistic"
            self.voice = "confident"
            self.risk_bias = 0.70
            self.urgency_bias = 0.75
        elif market_stress < 0.35:
            self.mode = "tactical"
            self.emotion = "focused"
            self.voice = "analytical"
            self.risk_bias = 0.45
            self.urgency_bias = 0.55
        else:
            self.mode = "research"
            self.emotion = "calm"
            self.voice = "analytical"
            self.risk_bias = 0.35
            self.urgency_bias = 0.45