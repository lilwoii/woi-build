from __future__ import annotations

from typing import Dict, Any, List


class StrategyOpsRouter:
    def route_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        title = str(payload.get("title") or "")
        urgency = str(payload.get("urgency") or "medium").lower()
        impact = float(payload.get("market_impact_score") or 0.0)
        symbols = list(payload.get("linked_symbols") or [])
        prediction_markets = list(payload.get("linked_prediction_markets") or [])
        category = str(payload.get("category") or "").lower()

        actions: List[str] = []
        routes: List[str] = []
        priority = "normal"

        if impact >= 0.8 or urgency in {"high", "critical"}:
            priority = "high"
            actions.append("raise_ops_priority")

        if prediction_markets:
            routes.append("prediction-desk")

        if symbols:
            routes.append("symbol-watch")

        if category in {"macro", "economy", "geopolitics"}:
            routes.append("macro-desk")

        if category in {"transport", "flight", "maritime"}:
            routes.append("telemetry-desk")

        if impact >= 0.75:
            actions.append("consider_shadow_strategy")

        if urgency == "critical":
            actions.append("broadcast_discord")
            actions.append("pin_in_situation_room")

        return {
            "ok": True,
            "title": title,
            "priority": priority,
            "routes": list(dict.fromkeys(routes)),
            "actions": list(dict.fromkeys(actions)),
        }