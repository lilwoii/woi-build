from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import List, Dict, Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class GlobeEvent:
    event_id: str
    title: str
    category: str
    region: str
    country: str
    lat: float
    lon: float
    urgency: str
    source_count: int
    market_impact_score: float
    summary: str
    linked_symbols: List[str] = field(default_factory=list)
    linked_sectors: List[str] = field(default_factory=list)
    linked_prediction_markets: List[str] = field(default_factory=list)
    ts_utc: str = field(default_factory=utc_now)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)