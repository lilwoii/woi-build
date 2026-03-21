from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Any, Optional

@dataclass
class AlphaStatus:
    running: bool = False
    tick: int = 0
    last_decision_utc: str = ""
    last_summary: str = ""
    mode: str = "DRY_RUN"  # derived from Polymarket mode: OFF/DRY_RUN/LIVE

@dataclass
class AlphaContext:
    # shared scratchpad per tick (signals, intel, etc.)
    signals: Dict[str, Any] = field(default_factory=dict)
    notes: Dict[str, Any] = field(default_factory=dict)
