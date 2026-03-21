from __future__ import annotations
from .config import WOIConfig
from .events import EventBus
from .modules.polymarket.service import PolymarketModule
from .modules.scraper.service import ScraperModule
from .modules.openbb.service import OpenBBModule

class ModuleRegistry:
    def __init__(self, cfg: WOIConfig, bus: EventBus):
        self.cfg = cfg
        self.bus = bus
        self.polymarket = PolymarketModule(cfg, bus)
        self.scraper = ScraperModule(cfg, bus)
        self.openbb = OpenBBModule(cfg, bus)

    async def init(self):
        await self.polymarket.init()
        await self.scraper.init()
        await self.openbb.init()

    async def stop(self):
        await self.polymarket.stop()
        await self.scraper.stop()
        await self.openbb.stop()
