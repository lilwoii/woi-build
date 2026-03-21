from __future__ import annotations

from typing import Dict, Any, List


class SourceAdapterRegistry:
    def __init__(self) -> None:
        self.adapters: List[Dict[str, Any]] = [
            {
                "adapter_id": "news-global",
                "label": "📰 Global News Adapter",
                "kind": "news",
                "status": "online",
                "coverage": ["macro", "geopolitics", "economy", "earnings"],
                "refresh_sec": 30,
            },
            {
                "adapter_id": "telemetry-flight",
                "label": "✈️ Flight Telemetry Adapter",
                "kind": "telemetry",
                "status": "online",
                "coverage": ["flight", "route anomalies", "public operations watch"],
                "refresh_sec": 20,
            },
            {
                "adapter_id": "telemetry-maritime",
                "label": "🚢 Maritime Telemetry Adapter",
                "kind": "telemetry",
                "status": "online",
                "coverage": ["shipping", "energy routes", "logistics"],
                "refresh_sec": 25,
            },
            {
                "adapter_id": "prediction-linker",
                "label": "🎯 Prediction Market Linker",
                "kind": "market-linker",
                "status": "online",
                "coverage": ["polymarket", "event linkage", "probability framing"],
                "refresh_sec": 15,
            },
            {
                "adapter_id": "strategy-router",
                "label": "🧪 Strategy Router",
                "kind": "ops",
                "status": "online",
                "coverage": ["shadow routing", "strategy candidate tagging"],
                "refresh_sec": 10,
            },
        ]

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.adapters}