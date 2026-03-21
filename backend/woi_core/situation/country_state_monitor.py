from __future__ import annotations

from typing import Dict, Any, List

from .models import PulseItem


class CountryStateMonitor:
    def __init__(self) -> None:
        self.country_items: List[PulseItem] = [
            PulseItem(
                pulse_id="country-us-macro",
                scope="country",
                name="United States",
                category="macro",
                urgency="high",
                score=0.88,
                summary="📈 US macro pulse elevated: rates, CPI sensitivity, and election-linked prediction flow remain market-moving.",
                linked_symbols=["SPY", "QQQ", "TLT", "DXY", "BTC"],
                linked_prediction_markets=["Fed cut next meeting?", "Election outcome market"],
            ),
            PulseItem(
                pulse_id="country-de-transport",
                scope="country",
                name="Germany",
                category="transport",
                urgency="medium",
                score=0.59,
                summary="✈️ Transport and industrial pulse active: route shifts and infrastructure chatter worth monitoring.",
                linked_symbols=["EWG", "LMT", "BA"],
                linked_prediction_markets=["Escalation odds this week?"],
            ),
            PulseItem(
                pulse_id="country-sa-energy",
                scope="country",
                name="Saudi Arabia",
                category="geopolitics",
                urgency="critical",
                score=0.93,
                summary="🛢️ Energy + geopolitical pulse elevated: global crude and shipping sensitivity is high.",
                linked_symbols=["USO", "XLE", "LNG"],
                linked_prediction_markets=["Oil above threshold this month?"],
            ),
        ]

        self.state_items: List[PulseItem] = [
            PulseItem(
                pulse_id="state-ca-ai",
                scope="state",
                name="California",
                category="infrastructure",
                urgency="medium",
                score=0.66,
                summary="💻 AI / semis / hyperscaler pulse elevated with infrastructure and earnings sensitivity.",
                linked_symbols=["NVDA", "AMD", "SMH"],
                linked_prediction_markets=["Company beats estimates?"],
            ),
            PulseItem(
                pulse_id="state-tx-energy",
                scope="state",
                name="Texas",
                category="macro",
                urgency="medium",
                score=0.62,
                summary="⚡ Energy and logistics pulse active with macro spillover into transport and industrial names.",
                linked_symbols=["XLE", "COP", "SLB"],
                linked_prediction_markets=["Oil above threshold this month?"],
            ),
            PulseItem(
                pulse_id="state-dc-policy",
                scope="state",
                name="District of Columbia",
                category="geopolitics",
                urgency="high",
                score=0.84,
                summary="🏛️ Policy pulse elevated: rates, regulation, and election narrative can spill into cross-asset volatility.",
                linked_symbols=["TLT", "DXY", "SPY"],
                linked_prediction_markets=["Fed cut next meeting?", "Election outcome market"],
            ),
        ]

    def countries(self) -> Dict[str, Any]:
        return {"ok": True, "items": [x.to_dict() for x in self.country_items]}

    def states(self) -> Dict[str, Any]:
        return {"ok": True, "items": [x.to_dict() for x in self.state_items]}

    def heat(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "countries": [
                {"name": x.name, "score": x.score, "urgency": x.urgency, "category": x.category}
                for x in self.country_items
            ],
            "states": [
                {"name": x.name, "score": x.score, "urgency": x.urgency, "category": x.category}
                for x in self.state_items
            ],
        }