from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class WOIIdentity:
    name: str = "WOI"
    tagline: str = "A self-evolving intelligence core for markets + projects."
    resonance_label: str = "Radiant"
    resonance_pct: float = 0.85
    wisdom: int = 14
    self_awareness: int = 60
    user_understanding: int = 76
    context: int = 21
    reasoning: int = 414
    last_calibrated_utc: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def as_dict(self) -> dict:
        return {
            "name": self.name,
            "tagline": self.tagline,
            "resonance": {"label": self.resonance_label, "pct": self.resonance_pct},
            "metrics": {
                "wisdom": self.wisdom,
                "self_awareness": self.self_awareness,
                "user_understanding": self.user_understanding,
                "context": self.context,
                "reasoning": self.reasoning,
            },
            "last_calibrated_utc": self.last_calibrated_utc,
        }
