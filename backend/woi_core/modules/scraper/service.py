from __future__ import annotations
from typing import Any, Dict, List
from ...config import WOIConfig
from ...events import EventBus, WoiEvent, utc_now
from ...memory.scrape_queue_store import ScrapeQueueStore

class ScraperModule:
    def __init__(self, cfg: WOIConfig, bus: EventBus, structured=None, vector=None):
        self.cfg = cfg
        self.bus = bus
        self.queue = ScrapeQueueStore(cfg.memory_db_path)
        self.structured = structured
        self.vector = vector

    async def init(self):
        await self.queue.init()
        await self.bus.emit(WoiEvent("🕸️ SCRAPER_INIT", "Scraper module initialized", {"enabled": self.cfg.scraper_enabled}))

    async def stop(self):
        return

    async def enqueue(self, url: str, meta: Dict[str, Any] | None = None):
        await self.queue.enqueue(ts_utc=utc_now(), url=url, meta=meta or {})
        await self.bus.emit(WoiEvent("📥 SCRAPER_ENQUEUE", "URL enqueued", {"url": url}))

    async def list_queue(self, limit: int = 50) -> List[Dict[str, Any]]:
        return await self.queue.list(limit=limit)

    async def next_batch(self, n: int):
        return await self.queue.next_batch(n=n)
