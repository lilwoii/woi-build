from __future__ import annotations

from typing import Dict, Any, List

from woi_core.intel.feed_normalizer import FeedNormalizer
from woi_core.intel.deduper import EventDeduper
from woi_core.intel.credibility import SourceCredibility
from woi_core.intel.symbol_discovery import SymbolDiscoveryEngine
from woi_core.intel.promotion_router import PromotionRouter
from woi_core.integrations.discord_broadcasts import DiscordBroadcasts
from woi_core.memory.promotion import MemoryPromotionEngine
from woi_core.strategy.candidates import StrategyCandidateStore
from woi_core.watchlists.manager import WatchlistManager


class IngestionHub:
    def __init__(self) -> None:
        self.normalizer = FeedNormalizer()
        self.deduper = EventDeduper()
        self.credibility = SourceCredibility()
        self.discovery = SymbolDiscoveryEngine()
        self.promoter = PromotionRouter()
        self.discord = DiscordBroadcasts()
        self.memory = MemoryPromotionEngine()
        self.candidates = StrategyCandidateStore()
        self.watchlists = WatchlistManager()
        self.events: List[Dict[str, Any]] = []

    def ingest_one(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        normalized = self.normalizer.normalize(payload)
        unique = self.deduper.unique([normalized])

        if not unique["items"]:
            return {"ok": True, "duplicate": True, "item": normalized}

        item = unique["items"][0]

        discovered = self.discovery.discover(item)
        auto_stocks = discovered["stocks"]
        auto_crypto = discovered["crypto"]
        auto_poly = discovered["polymarket"]

        merged_symbols = list(dict.fromkeys(list(item.get("linked_symbols") or []) + auto_stocks + auto_crypto))
        merged_markets = list(dict.fromkeys(list(item.get("linked_prediction_markets") or []) + auto_poly))

        item["linked_symbols"] = merged_symbols
        item["linked_prediction_markets"] = merged_markets

        cred = self.credibility.score(item)
        item["credibility_score"] = cred["credibility_score"]

        promo = self.promoter.classify(item)
        item["promotion"] = promo

        if auto_stocks:
            self.watchlists.inject_auto("stocks", auto_stocks)
        if auto_crypto:
            self.watchlists.inject_auto("crypto", auto_crypto)
        if auto_poly:
            self.watchlists.inject_auto("polymarket", auto_poly)

        self.events.insert(0, item)
        self.events = self.events[:500]

        if promo["promote_memory"]:
            self.memory.add_raw({
                "text": f"{item['title']} — {item['summary']}",
                "tags": promo["promotion_tags"],
                "symbol": (item.get("linked_symbols") or [""])[0] if item.get("linked_symbols") else "",
                "regime": item.get("category", ""),
                "outcome": "",
                "confidence": item["credibility_score"],
            })

        if promo["promote_strategy"]:
            self.candidates.add({
                "title": item["title"],
                "summary": item["summary"],
                "category": item["category"],
                "linked_symbols": item["linked_symbols"],
                "linked_prediction_markets": item["linked_prediction_markets"],
                "confidence": item["credibility_score"],
                "source": item["source"],
            })

        if promo["route_discord"]:
            self.discord.emit(
                title=f"🌍 WOI Ingested Event: {item['title'][:120]}",
                body=item["summary"][:1800],
                level="warn" if item["urgency"] != "critical" else "error",
                fields=[
                    {"name": "source", "value": item["source"] or "unknown"},
                    {"name": "credibility", "value": str(item["credibility_score"])},
                    {"name": "symbols", "value": ", ".join(item.get("linked_symbols") or []) or "-"},
                ],
            )

        return {
            "ok": True,
            "duplicate": False,
            "item": item,
            "watchlists": self.watchlists.get_all(),
        }

    def ingest_many(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = [self.ingest_one(x) for x in items]
        return {
            "ok": True,
            "count": len(results),
            "inserted": len([x for x in results if not x.get("duplicate")]),
            "duplicates": len([x for x in results if x.get("duplicate")]),
            "items": results,
        }

    def recent(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.events[:100]}