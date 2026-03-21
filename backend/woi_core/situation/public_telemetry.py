from __future__ import annotations

from typing import Dict, Any, List

from .models import TelemetryItem


class PublicTelemetryMonitor:
    def __init__(self) -> None:
        self.items: List[TelemetryItem] = [
            TelemetryItem(
                telemetry_id="tele-flight-001",
                kind="flight",
                region="Europe",
                zone="Berlin corridor",
                signal="Unusual concentration",
                urgency="medium",
                score=0.58,
                summary="✈️ Public aviation telemetry shows elevated concentration in a monitored corridor.",
                linked_symbols=["BA", "LMT"],
                linked_prediction_markets=["Escalation odds this week?"],
            ),
            TelemetryItem(
                telemetry_id="tele-maritime-001",
                kind="maritime",
                region="Middle East",
                zone="Shipping route overlap",
                signal="Routing shift",
                urgency="high",
                score=0.82,
                summary="🚢 Public shipping-route changes may front-run energy and logistics sensitivity.",
                linked_symbols=["USO", "XLE", "LNG"],
                linked_prediction_markets=["Oil above threshold this month?"],
            ),
            TelemetryItem(
                telemetry_id="tele-disaster-001",
                kind="disaster",
                region="Pacific Rim",
                zone="Quake alert band",
                signal="Seismic activity cluster",
                urgency="medium",
                score=0.51,
                summary="🌋 Natural-disaster watch active; monitor infrastructure and insurance spillover if escalation continues.",
                linked_symbols=["CAT", "URI"],
                linked_prediction_markets=[],
            ),
            TelemetryItem(
                telemetry_id="tele-infra-001",
                kind="infrastructure",
                region="North America",
                zone="Grid / logistics watch",
                signal="Operational disruption chatter",
                urgency="medium",
                score=0.55,
                summary="🏗️ Infrastructure pulse elevated from public reporting and incident chatter.",
                linked_symbols=["XLI", "UNP", "FDX"],
                linked_prediction_markets=[],
            ),
            TelemetryItem(
                telemetry_id="tele-defense-001",
                kind="emergency",
                region="Eastern Europe",
                zone="Public operations watch",
                signal="Movement / alert chatter",
                urgency="high",
                score=0.77,
                summary="🛰️ Public operations watch elevated from open reporting, route anomalies, and news convergence.",
                linked_symbols=["LMT", "NOC", "RTX"],
                linked_prediction_markets=["Escalation odds this week?"],
            ),
        ]

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": [x.to_dict() for x in self.items]}

    def by_kind(self) -> Dict[str, Any]:
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for item in self.items:
            grouped.setdefault(item.kind, []).append(item.to_dict())
        return {"ok": True, "groups": grouped}