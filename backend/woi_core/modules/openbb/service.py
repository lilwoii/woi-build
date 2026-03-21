from __future__ import annotations
from ...config import WOIConfig
from ...events import EventBus, WoiEvent

class OpenBBModule:
    def __init__(self, cfg: WOIConfig, bus: EventBus):
        self.cfg = cfg
        self.bus = bus

    async def init(self):
        await self.bus.emit(WoiEvent("OPENBB_INIT", "OpenBB module initialized", {}))

    async def stop(self):
        return
