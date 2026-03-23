from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

from ..config import WOIConfig
from ..events import EventBus, WoiEvent, utc_now
from ..modules_registry import ModuleRegistry
from ..memory.structured_store import StructuredMemoryStore

try:
    from ..memory import VectorMemoryStore
except Exception:
    VectorMemoryStore = None

from ..memory.watchlist_store import WatchlistStore
from ..memory.rules_store import RulesStore


@dataclass
class StrategyState:
    running: bool = False
    mode: str = "auto"  # auto | manual_overlay
    manual_rule: str | None = None
    manual_failures: int = 0


class StrategyEngine:
    def __init__(
        self,
        cfg: WOIConfig,
        bus: EventBus,
        modules: ModuleRegistry,
        structured: StructuredMemoryStore,
        watchlist: WatchlistStore,
        rules: RulesStore,
        vector: VectorMemoryStore | None = None,
    ):
        self.cfg = cfg
        self.bus = bus
        self.modules = modules
        self.structured = structured
        self.watchlist = watchlist
        self.rules = rules
        self.vector = vector

        self.state = StrategyState()
        self._task: Optional[asyncio.Task] = None

    def start(self):
        if self._task is None or self._task.done():
            self.state.running = True
            self._task = asyncio.create_task(self._loop(), name="woi_strategy_engine")

    async def stop(self):
        self.state.running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except Exception:
                pass

    async def set_manual_rule(self, rule: str):
        self.state.mode = "manual_overlay"
        self.state.manual_rule = rule
        self.state.manual_failures = 0
        await self.rules.clear_active(ts_utc=utc_now())
        await self.rules.set_rule(ts_utc=utc_now(), rule=rule, status="active")
        await self.bus.emit(
            WoiEvent(
                "STRATEGY_MANUAL_SET",
                "Manual strategy rule set",
                {"rule": rule[:1200]},
            )
        )

    async def clear_manual_rule(self):
        self.state.mode = "auto"
        self.state.manual_rule = None
        self.state.manual_failures = 0
        await self.rules.clear_active(ts_utc=utc_now())
        await self.bus.emit(
            WoiEvent(
                "STRATEGY_MANUAL_CLEAR",
                "Manual strategy cleared; reverting to auto",
                {},
            )
        )

    async def record_manual_failure(self, reason: str):
        if self.state.mode != "manual_overlay":
            return

        self.state.manual_failures += 1
        await self.bus.emit(
            WoiEvent(
                "STRATEGY_MANUAL_FAILURE",
                "Manual strategy failure",
                {"count": self.state.manual_failures, "reason": reason},
                level="WARN",
            )
        )

        if self.state.manual_failures >= 3:
            await self.bus.emit(
                WoiEvent(
                    "STRATEGY_REVERT_AUTO",
                    "Manual strategy not working; reverting to pure automation",
                    {"reason": reason, "failures": self.state.manual_failures},
                    level="WARN",
                )
            )
            await self.clear_manual_rule()

    async def _loop(self):
        await self.bus.emit(WoiEvent("STRATEGY_LOOP_START", "Strategy loop started", {}))
        tick = 0

        while self.state.running:
            tick += 1
            try:
                wl = await self.watchlist.list()
                if tick % 10 == 0:
                    await self.bus.emit(
                        WoiEvent(
                            "WATCHLIST_HEARTBEAT",
                            "Current watchlist snapshot",
                            {
                                "count": len(wl),
                                "symbols": [x["symbol"] for x in wl[:25]],
                            },
                        )
                    )

                if self.cfg.polymarket_enabled:
                    await self.modules.polymarket.tick(tick=tick, strategy_state=self.state)

                if self.cfg.scraper_enabled:
                    await self.modules.scraper.tick(tick=tick)

                if tick % 30 == 0:
                    await self.bus.emit(
                        WoiEvent(
                            "HEARTBEAT",
                            "WOI heartbeat",
                            {"tick": tick, "mode": self.state.mode},
                        )
                    )

            except Exception as e:
                await self.bus.emit(
                    WoiEvent(
                        "STRATEGY_LOOP_ERROR",
                        str(e),
                        {"tick": tick},
                        level="ERROR",
                    )
                )
                await self.record_manual_failure(reason=str(e))

            await asyncio.sleep(2.0)