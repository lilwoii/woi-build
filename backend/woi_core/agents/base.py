from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Any, List


@dataclass
class AgentDecision:
    agent_id: str
    role: str
    confidence: float
    urgency: float
    summary: str
    stance: str
    linked_symbols: List[str]
    linked_prediction_markets: List[str]
    actions: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BaseWOIAgent:
    agent_id = "base-agent"
    role = "general"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        title = str(payload.get("title") or payload.get("text") or "WOI event")
        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=0.50,
            urgency=0.50,
            summary=f"{self.role} reviewed: {title}",
            stance="neutral",
            linked_symbols=list(payload.get("linked_symbols") or []),
            linked_prediction_markets=list(payload.get("linked_prediction_markets") or []),
            actions=[],
        )