from __future__ import annotations

from typing import Dict, Any, List


class FlightWatchService:
    def __init__(self) -> None:
        self.items: List[Dict[str, Any]] = [
            {
                "flight_id": "fw-001",
                "region": "Europe",
                "zone": "Berlin corridor",
                "signal": "Unusual concentration",
                "urgency": "medium",
                "summary": "✈️ Flight concentration increased around a monitored zone.",
                "linked_symbols": ["BA", "LMT"],
                "linked_prediction_markets": ["Escalation odds this week?"],
            },
            {
                "flight_id": "fw-002",
                "region": "Middle East",
                "zone": "Shipping / air route overlap",
                "signal": "Routing shift",
                "urgency": "high",
                "summary": "✈️ Routing changes may front-run logistics, defense, or energy sensitivity.",
                "linked_symbols": ["USO", "XLE", "LNG"],
                "linked_prediction_markets": ["Oil above threshold this month?"],
            },
        ]

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.items[:50]}