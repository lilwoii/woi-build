from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import List, Dict, Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class PulseItem:
    pulse_id: str
    scope: str                  # country | state | region | city
    name: str
    category: str               # macro | geopolitics | transport | disaster | infrastructure | defense-watch
    urgency: str                # low | medium | high | critical
    score: float
    summary: str
    linked_symbols: List[str] = field(default_factory=list)
    linked_prediction_markets: List[str] = field(default_factory=list)
    ts_utc: str = field(default_factory=utc_now)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TelemetryItem:
    telemetry_id: str
    kind: str                   # flight | maritime | disaster | infrastructure | emergency
    region: str
    zone: str
    signal: str
    urgency: str
    score: float
    summary: str
    linked_symbols: List[str] = field(default_factory=list)
    linked_prediction_markets: List[str] = field(default_factory=list)
    ts_utc: str = field(default_factory=utc_now)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)