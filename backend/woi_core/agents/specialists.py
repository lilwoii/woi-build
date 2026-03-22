from __future__ import annotations

from typing import Dict, Any, List

from .base import BaseWOIAgent, AgentDecision


def _txt(payload: Dict[str, Any]) -> str:
    return f"{payload.get('title', '')} {payload.get('summary', '')} {payload.get('text', '')}".lower()


class MacroAgent(BaseWOIAgent):
    agent_id = "macro-agent"
    role = "macro"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.52
        stance = "neutral"
        actions: List[str] = []

        if any(x in text for x in ["fed", "cpi", "inflation", "rates", "treasury", "jobs"]):
            score = 0.84
            stance = "actionable"
            actions = ["focus_macro_desk", "watch_rates_assets"]

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="📈 Macro agent assessed rates/inflation sensitivity.",
            stance=stance,
            linked_symbols=["TLT", "DXY", "SPY", "QQQ"] if score > 0.7 else [],
            linked_prediction_markets=["Fed cut next meeting?"] if score > 0.7 else [],
            actions=actions,
        )


class GeopoliticalAgent(BaseWOIAgent):
    agent_id = "geopolitical-agent"
    role = "geopolitics"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.48
        stance = "neutral"
        actions: List[str] = []

        if any(x in text for x in ["sanction", "conflict", "election", "shipping", "route", "military", "diplomatic"]):
            score = 0.86
            stance = "actionable"
            actions = ["focus_situation_room", "watch_energy_logistics"]

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="🌍 Geopolitical agent assessed escalation/logistics/policy risk.",
            stance=stance,
            linked_symbols=["USO", "XLE", "LMT", "RTX"] if score > 0.7 else [],
            linked_prediction_markets=["Escalation odds this week?", "Election outcome market"] if score > 0.7 else [],
            actions=actions,
        )


class EquitiesAgent(BaseWOIAgent):
    agent_id = "equities-agent"
    role = "equities"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.50
        stance = "neutral"
        actions: List[str] = []

        if any(x in text for x in ["earnings", "guidance", "semis", "stock", "equity", "nvda", "amd", "qqq"]):
            score = 0.79
            stance = "bullish-watch"
            actions = ["watch_equities", "route_chart_engine"]

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="📊 Equities agent assessed stock/sector impact.",
            stance=stance,
            linked_symbols=["QQQ", "NVDA", "AMD", "SMH"] if score > 0.7 else [],
            linked_prediction_markets=["Company beats estimates?"] if score > 0.7 else [],
            actions=actions,
        )


class CryptoAgent(BaseWOIAgent):
    agent_id = "crypto-agent"
    role = "crypto"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.49
        stance = "neutral"
        actions: List[str] = []

        if any(x in text for x in ["crypto", "bitcoin", "btc", "eth", "etf", "stablecoin", "exchange", "onchain"]):
            score = 0.82
            stance = "actionable"
            actions = ["watch_crypto", "route_polymarket_context"]

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="🪙 Crypto agent assessed flow/policy/narrative impact.",
            stance=stance,
            linked_symbols=["BTC", "ETH", "COIN", "MSTR"] if score > 0.7 else [],
            linked_prediction_markets=["BTC above 100k by year-end?"] if score > 0.7 else [],
            actions=actions,
        )


class PolymarketAgent(BaseWOIAgent):
    agent_id = "polymarket-agent"
    role = "prediction"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        linked_markets = list(payload.get("linked_prediction_markets") or [])
        score = 0.56 if linked_markets else 0.45
        stance = "neutral"
        actions: List[str] = []

        if linked_markets or any(x in text for x in ["odds", "probability", "market price", "polymarket", "yes/no"]):
            score = 0.83
            stance = "actionable"
            actions = ["watch_prediction_desk", "compare_probabilities"]

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="🎯 Prediction agent assessed event-market relevance.",
            stance=stance,
            linked_symbols=[],
            linked_prediction_markets=linked_markets or ["Fed cut next meeting?"] if score > 0.7 else [],
            actions=actions,
        )


class RiskAgent(BaseWOIAgent):
    agent_id = "risk-agent"
    role = "risk"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.70 if any(x in text for x in ["critical", "urgent", "drawdown", "loss", "shock", "risk"]) else 0.58
        stance = "cautious"
        actions = ["check_kill_switch", "reduce_aggression"] if score >= 0.7 else ["monitor"]

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="🛡️ Risk agent assessed stress, drawdown, and execution caution.",
            stance=stance,
            linked_symbols=[],
            linked_prediction_markets=[],
            actions=actions,
        )


class MemoryAgent(BaseWOIAgent):
    agent_id = "memory-agent"
    role = "memory"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.62 if any(x in text for x in ["remember", "repeat", "pattern", "worked", "failed", "lesson"]) else 0.47
        actions = ["promote_memory_candidate"] if score > 0.6 else []

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=0.42,
            summary="🧠 Memory agent assessed whether the event should become a lesson or recurring pattern.",
            stance="observe",
            linked_symbols=[],
            linked_prediction_markets=[],
            actions=actions,
        )


class StrategyJudgeAgent(BaseWOIAgent):
    agent_id = "strategy-judge-agent"
    role = "strategy-judge"

    def evaluate(self, payload: Dict[str, Any]) -> AgentDecision:
        text = _txt(payload)
        score = 0.64 if any(x in text for x in ["setup", "trade", "strategy", "entry", "exit", "breakout"]) else 0.46
        actions = ["route_shadow_candidate"] if score > 0.6 else []

        return AgentDecision(
            agent_id=self.agent_id,
            role=self.role,
            confidence=score,
            urgency=score,
            summary="🧪 Strategy judge assessed whether this should become a strategy candidate.",
            stance="evaluate",
            linked_symbols=list(payload.get("linked_symbols") or []),
            linked_prediction_markets=list(payload.get("linked_prediction_markets") or []),
            actions=actions,
        )