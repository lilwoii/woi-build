from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional

class DecisionType(str, Enum):
    NOOP = "noop"
    ORDER = "order"

@dataclass
class PolyDecision:
    kind: DecisionType = DecisionType.NOOP
    token_id: str = ""
    side: str = "buy"
    price: float = 0.0
    size: float = 0.0
    note: str = ""

class PolyStrategy:
    name: str = "base"

    async def decide(self, ctx, polymarket) -> PolyDecision:
        return PolyDecision(kind=DecisionType.NOOP)
