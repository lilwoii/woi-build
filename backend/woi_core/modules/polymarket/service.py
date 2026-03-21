from __future__ import annotations
import asyncio
from dataclasses import dataclass
from typing import Optional
from ...config import WOIConfig
from ...events import EventBus, WoiEvent
from .executor import PolymarketExecutor

@dataclass
class PolyState:
    running_5m: bool = False
    last_tick: int = 0
    trades_last_hour: int = 0

class PolymarketModule:
    def __init__(self, cfg: WOIConfig, bus: EventBus):
        self.cfg = cfg
        self.bus = bus
        self.state = PolyState()
        self.exec = PolymarketExecutor(cfg, bus)
        self._task_5m: Optional[asyncio.Task] = None

    async def init(self):
        await self.bus.emit(WoiEvent("POLY_INIT", "Polymarket module initialized", {
            "enabled": self.cfg.polymarket_enabled,
            "dry_run": self.cfg.polymarket_dry_run,
            "max_usd_per_trade": self.cfg.polymarket_max_usd_per_trade,
            "max_trades_per_hour": self.cfg.polymarket_max_trades_per_hour
        }))

    async def stop(self):
        await self.stop_5m()

    async def start_5m(self):
        if self._task_5m is None or self._task_5m.done():
            self.state.running_5m = True
            self._task_5m = asyncio.create_task(self._loop_5m(), name="poly_5m_strategy")
            await self.bus.emit(WoiEvent("POLY_5M_START", "5-minute strategy started", {"dry_run": self.cfg.polymarket_dry_run}))

    async def stop_5m(self):
        self.state.running_5m = False
        if self._task_5m and not self._task_5m.done():
            self._task_5m.cancel()
            try:
                await self._task_5m
            except Exception:
                pass
            await self.bus.emit(WoiEvent("POLY_5M_STOP", "5-minute strategy stopped", {}))

    async def tick(self, tick: int, strategy_state):
        self.state.last_tick = tick
        await self.bus.emit(WoiEvent("POLY_SCAN_TICK", "Polymarket scan tick", {
            "tick": tick,
            "mode": strategy_state.mode,
            "manual_rule": (strategy_state.manual_rule or "")[:200],
            "dry_run": self.cfg.polymarket_dry_run
        }))

    async def _loop_5m(self):
        i = 0
        while self.state.running_5m:
            i += 1
            # This loop will be upgraded to real scanning + marketable limit orders.
            await self.bus.emit(WoiEvent("POLY_5M_TICK", "5-minute strategy tick (scaffold)", {
                "iteration": i,
                "dry_run": self.cfg.polymarket_dry_run
            }))
            await asyncio.sleep(5.0)
