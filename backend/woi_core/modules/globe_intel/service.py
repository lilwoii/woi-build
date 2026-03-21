from __future__ import annotations

from typing import Dict, Any, List
from collections import defaultdict
from uuid import uuid4

from .models import GlobeEvent


CHANNEL_MAP = {
    "macro": "📈 Markets Live",
    "geopolitics": "🌍 Geopolitics Live",
    "economy": "🏦 Economy Live",
    "crypto": "🪙 Crypto Live",
    "prediction": "🎯 Prediction Live",
    "earnings": "💼 Earnings Live",
    "ai_signal": "🧠 WOI AI Signal Feed",
    "transport": "✈️ Transport / Flight Watch",
}


def _urgency_rank(value: str) -> int:
    return {"low": 1, "medium": 2, "high": 3, "critical": 4}.get((value or "").lower(), 1)


class GlobeIntelService:
    def __init__(self) -> None:
        self.events: List[GlobeEvent] = []
        self.seed()

    def seed(self) -> None:
        if self.events:
            return

        self.events = [
            GlobeEvent(
                event_id="evt-fed-watch",
                title="Fed path repricing after hotter inflation chatter",
                category="economy",
                region="North America",
                country="USA",
                lat=38.9072,
                lon=-77.0369,
                urgency="high",
                source_count=7,
                market_impact_score=0.84,
                summary="🏦 Rates sensitivity is elevated; watch TLT, DXY, QQQ, BTC.",
                linked_symbols=["TLT", "DXY", "QQQ", "BTC"],
                linked_sectors=["Rates", "Tech"],
                linked_prediction_markets=["Fed cut next meeting?"],
            ),
            GlobeEvent(
                event_id="evt-strait-risk",
                title="Shipping route tension raises energy and logistics sensitivity",
                category="geopolitics",
                region="Middle East",
                country="Saudi Arabia",
                lat=24.7136,
                lon=46.6753,
                urgency="critical",
                source_count=11,
                market_impact_score=0.91,
                summary="🌍 Elevated geopolitical risk may pressure freight and lift crude volatility.",
                linked_symbols=["USO", "XLE", "LNG"],
                linked_sectors=["Energy", "Shipping"],
                linked_prediction_markets=["Oil above threshold this month?"],
            ),
            GlobeEvent(
                event_id="evt-btc-etf-flow",
                title="ETF and whale flow accelerate crypto risk appetite",
                category="crypto",
                region="North America",
                country="USA",
                lat=40.7128,
                lon=-74.0060,
                urgency="medium",
                source_count=8,
                market_impact_score=0.72,
                summary="🪙 Flow supports BTC beta names and prediction markets tied to crypto milestones.",
                linked_symbols=["BTC", "ETH", "COIN", "MSTR"],
                linked_sectors=["Crypto", "Fintech"],
                linked_prediction_markets=["BTC above 100k by year-end?"],
            ),
            GlobeEvent(
                event_id="evt-earnings-ai",
                title="AI infrastructure earnings cluster could swing semis",
                category="earnings",
                region="North America",
                country="USA",
                lat=37.7749,
                lon=-122.4194,
                urgency="medium",
                source_count=5,
                market_impact_score=0.67,
                summary="💼 Earnings tone could rotate capital between megacap AI and lagging semis.",
                linked_symbols=["NVDA", "AMD", "SMH"],
                linked_sectors=["Semis", "AI"],
                linked_prediction_markets=["Company beats estimates?"],
            ),
            GlobeEvent(
                event_id="evt-flight-cluster",
                title="Unusual flight concentration near event zone",
                category="transport",
                region="Europe",
                country="Germany",
                lat=52.5200,
                lon=13.4050,
                urgency="medium",
                source_count=4,
                market_impact_score=0.49,
                summary="✈️ Transport anomalies can front-run supply chain, defense, or diplomatic shifts.",
                linked_symbols=["LMT", "BA"],
                linked_sectors=["Defense", "Transport"],
                linked_prediction_markets=["Escalation odds this week?"],
            ),
        ]

    def add_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        item = GlobeEvent(
            event_id=str(payload.get("event_id") or f"evt-{uuid4().hex[:10]}"),
            title=str(payload.get("title") or "WOI Event"),
            category=str(payload.get("category") or "ai_signal"),
            region=str(payload.get("region") or "Unknown"),
            country=str(payload.get("country") or "Unknown"),
            lat=float(payload.get("lat") or 0.0),
            lon=float(payload.get("lon") or 0.0),
            urgency=str(payload.get("urgency") or "medium"),
            source_count=int(payload.get("source_count") or 1),
            market_impact_score=float(payload.get("market_impact_score") or 0.50),
            summary=str(payload.get("summary") or "🧠 WOI ingested a new live event."),
            linked_symbols=list(payload.get("linked_symbols") or []),
            linked_sectors=list(payload.get("linked_sectors") or []),
            linked_prediction_markets=list(payload.get("linked_prediction_markets") or []),
        )
        self.events.insert(0, item)
        self.events = sorted(
            self.events,
            key=lambda x: (x.market_impact_score, _urgency_rank(x.urgency)),
            reverse=True,
        )[:300]
        return {"ok": True, "item": item.to_dict()}

    def list_events(self) -> Dict[str, Any]:
        return {"ok": True, "items": [x.to_dict() for x in self.events]}

    def channels(self) -> Dict[str, Any]:
        grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for item in self.events:
            channel_name = CHANNEL_MAP.get(item.category, "🧠 WOI AI Signal Feed")
            grouped[channel_name].append(item.to_dict())

        out = []
        for channel_name, items in grouped.items():
            items = sorted(
                items,
                key=lambda x: (x["market_impact_score"], _urgency_rank(x["urgency"])),
                reverse=True,
            )
            channel_summary = self._channel_summary(channel_name, items)
            out.append({
                "channel": channel_name,
                "count": len(items),
                "items": items[:15],
                "summary": channel_summary,
            })

        out.sort(key=lambda x: x["count"], reverse=True)
        return {"ok": True, "channels": out}

    def map_points(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "points": [
                {
                    "id": x.event_id,
                    "title": x.title,
                    "lat": x.lat,
                    "lon": x.lon,
                    "urgency": x.urgency,
                    "impact": x.market_impact_score,
                    "region": x.region,
                    "category": x.category,
                }
                for x in self.events
            ],
        }

    def watch_panels(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "panels": [
                {"label": "📈 Markets Watch", "symbols": ["SPY", "QQQ", "TLT", "DXY", "BTC"]},
                {"label": "🌍 Geopolitical Watch", "symbols": ["USO", "XLE", "LMT", "BA"]},
                {"label": "🪙 Crypto Watch", "symbols": ["BTC", "ETH", "COIN", "MSTR"]},
                {"label": "🎯 Prediction Watch", "symbols": ["Election", "Fed", "Oil", "BTC"]},
            ],
        }

    def _channel_summary(self, channel_name: str, items: List[Dict[str, Any]]) -> str:
        if not items:
            return f"{channel_name} is quiet."

        top = items[0]
        return (
            f"{channel_name}: top event is '{top['title']}' with "
            f"impact {round(float(top['market_impact_score']) * 100)} "
            f"and urgency {top['urgency']}."
        )