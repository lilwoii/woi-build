from __future__ import annotations

from typing import Dict, Any, List
from datetime import datetime, timezone

from woi_core.agents.agent_registry import AgentRegistry
from woi_core.intel.event_matcher import EventMatcher


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AgentCouncilEngine:
    def __init__(self) -> None:
        self.registry = AgentRegistry()
        self.matcher = EventMatcher()
        self.history: List[Dict[str, Any]] = []

    def evaluate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        text = str(payload.get("text") or payload.get("title") or "").strip()
        symbol = str(payload.get("symbol") or "").upper()
        if not text:
            raise ValueError("text or title is required")

        links = self.matcher.match(text)
        linked_symbols = list(dict.fromkeys(([symbol] if symbol else []) + links["linked_symbols"]))

        active_agents = self.registry.active_agents()
        reports = []
        votes = []
        total_weighted_score = 0.0
        total_weight = 0.0

        for agent in active_agents:
            report = self._agent_report(agent, text, linked_symbols, links)
            reports.append(report)

            weighted = report["score"] * float(agent["weight"])
            total_weighted_score += weighted
            total_weight += float(agent["weight"])

            votes.append({
                "agent_id": agent["agent_id"],
                "name": agent["name"],
                "emoji": agent["emoji"],
                "verdict": report["verdict"],
                "score": report["score"],
                "weight": agent["weight"],
            })

        consensus_score = round(total_weighted_score / total_weight, 4) if total_weight else 0.0
        consensus = self._consensus_verdict(consensus_score, reports)

        result = {
            "ok": True,
            "train_mode": self.registry.train_mode,
            "text": text,
            "linked_symbols": linked_symbols,
            "linked_prediction_markets": links["linked_prediction_markets"],
            "strategy_candidates": links["strategy_candidates"],
            "consensus_score": consensus_score,
            "consensus_verdict": consensus["verdict"],
            "consensus_summary": consensus["summary"],
            "reports": reports,
            "votes": votes,
            "ts_utc": utc_now(),
        }

        self.history.insert(0, result)
        self.history = self.history[:100]
        return result

    def _agent_report(
        self,
        agent: Dict[str, Any],
        text: str,
        linked_symbols: List[str],
        links: Dict[str, Any],
    ) -> Dict[str, Any]:
        lower = text.lower()
        role = agent["role"]
        score = 0.52
        verdict = "monitor"
        note = f"{agent['emoji']} {agent['name']} is monitoring."

        if role == "macro":
            if any(k in lower for k in ["fed", "rates", "cpi", "inflation", "jobs", "treasury"]):
                score = 0.83
                verdict = "high-interest"
                note = "📈 Macro pressure is elevated and should be prioritized."

        elif role == "geopolitics":
            if any(k in lower for k in ["election", "war", "sanction", "shipping", "flight", "escalation"]):
                score = 0.84
                verdict = "high-interest"
                note = "🌍 Public-telemetry / geopolitical overlap suggests elevated situational relevance."

        elif role == "equities":
            if linked_symbols:
                score = 0.78
                verdict = "watch-symbols"
                note = f"📊 Equity-linked symbols detected: {', '.join(linked_symbols[:5])}"

        elif role == "crypto":
            if any(k in lower for k in ["btc", "bitcoin", "eth", "ethereum", "crypto", "etf"]):
                score = 0.80
                verdict = "crypto-watch"
                note = "🪙 Crypto narrative is active."

        elif role == "prediction":
            if links["linked_prediction_markets"]:
                score = 0.79
                verdict = "prediction-link"
                note = "🎯 This event maps to prediction-market relevance."

        elif role == "risk":
            if any(k in lower for k in ["urgent", "critical", "shock", "kill", "drawdown"]):
                score = 0.91
                verdict = "risk-alert"
                note = "🛡️ Risk profile is elevated; guardrails should tighten."
            else:
                score = 0.74
                verdict = "risk-check"
                note = "🛡️ Risk agent wants guardrails reviewed before escalation."

        elif role == "memory":
            if any(k in lower for k in ["again", "similar", "worked", "before", "pattern"]):
                score = 0.77
                verdict = "memory-recall"
                note = "🧠 Similar-condition recall may be useful here."
            else:
                score = 0.66
                verdict = "memory-store"
                note = "🧠 This looks memory-worthy for future retrieval."

        elif role == "strategy_judge":
            if links["strategy_candidates"] or any(k in lower for k in ["strategy", "trade", "setup", "long", "short"]):
                score = 0.86
                verdict = "shadow-candidate"
                note = "🧪 Strategy Judge recommends routing a candidate into shadow."
            else:
                score = 0.61
                verdict = "observe"
                note = "🧪 Not enough structure yet for a strategy decision."

        return