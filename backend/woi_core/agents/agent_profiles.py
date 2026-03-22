from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, List, Any


@dataclass
class AgentProfile:
    agent_id: str
    name: str
    role: str
    emoji: str
    specialty: str
    enabled: bool = True
    weight: float = 1.0
    train_mode_support: List[str] = None

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["train_mode_support"] = self.train_mode_support or ["fast", "deep", "master"]
        return data


def default_agent_profiles() -> List[AgentProfile]:
    return [
        AgentProfile(
            agent_id="macro_agent",
            name="Macro Agent",
            role="macro",
            emoji="📈",
            specialty="Rates, CPI, Fed, macro regime, economic pressure",
            weight=1.15,
            train_mode_support=["fast", "deep", "master"],
        ),
        AgentProfile(
            agent_id="geopolitical_agent",
            name="Geopolitical Agent",
            role="geopolitics",
            emoji="🌍",
            specialty="Conflicts, elections, sanctions, state pressure, public telemetry",
            weight=1.10,
            train_mode_support=["deep", "master"],
        ),
        AgentProfile(
            agent_id="equities_agent",
            name="Equities Agent",
            role="equities",
            emoji="📊",
            specialty="Stocks, sectors, earnings, momentum, equity flow",
            weight=1.20,
            train_mode_support=["fast", "deep", "master"],
        ),
        AgentProfile(
            agent_id="crypto_agent",
            name="Crypto Agent",
            role="crypto",
            emoji="🪙",
            specialty="BTC, ETH, ETF flow, exchange news, onchain narratives",
            weight=1.05,
            train_mode_support=["fast", "deep", "master"],
        ),
        AgentProfile(
            agent_id="polymarket_agent",
            name="Polymarket Agent",
            role="prediction",
            emoji="🎯",
            specialty="Event probabilities, market dislocations, yes/no framing",
            weight=1.10,
            train_mode_support=["fast", "deep", "master"],
        ),
        AgentProfile(
            agent_id="risk_agent",
            name="Risk Agent",
            role="risk",
            emoji="🛡️",
            specialty="Drawdown, kill switch, risk override, sizing discipline",
            weight=1.35,
            train_mode_support=["fast", "deep", "master"],
        ),
        AgentProfile(
            agent_id="memory_agent",
            name="Memory Agent",
            role="memory",
            emoji="🧠",
            specialty="Lessons, recurring patterns, what worked in similar conditions",
            weight=1.15,
            train_mode_support=["deep", "master"],
        ),
        AgentProfile(
            agent_id="strategy_judge_agent",
            name="Strategy Judge",
            role="strategy_judge",
            emoji="🧪",
            specialty="Scores strategy candidates and routes them to shadow/guarded-live",
            weight=1.25,
            train_mode_support=["deep", "master"],
        ),
    ]