from __future__ import annotations

from typing import Dict, Any, List


def build_ops_actions(event: Dict[str, Any]) -> Dict[str, Any]:
    symbols = event.get("linked_symbols") or []
    markets = event.get("linked_prediction_markets") or []
    category = (event.get("category") or "").lower()
    urgency = (event.get("urgency") or "").lower()
    impact = float(event.get("market_impact_score") or 0.0)

    actions: List[str] = []
    if impact >= 0.8:
        actions.append("raise_priority")
    if urgency in {"high", "critical"}:
        actions.append("discord_broadcast")
    if symbols:
        actions.append("attach_symbols")
    if markets:
        actions.append("attach_prediction_markets")
    if category in {"geopolitics", "economy", "macro"}:
        actions.append("route_macro_watch")
    if category in {"transport"}:
        actions.append("route_transport_watch")

    return {
        "ok": True,
        "ops_actions": actions,
        "summary": f"Ops routing generated {len(actions)} actions for this event.",
    }