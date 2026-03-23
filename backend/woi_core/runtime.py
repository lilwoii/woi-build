from __future__ import annotations
import os
from .config import WOIConfig
from .events import EventBus, WoiEvent
from .memory import StructuredMemoryStore, MemoryRetriever, VectorMemoryStore
from .memory.watchlist_store import WatchlistStore
from .memory.rules_store import RulesStore
from .memory.settings_store import SettingsStore
from .llm.router import WOIRouter
from .modules_registry import ModuleRegistry
from .strategy.engine import StrategyEngine

class WOIRuntime:
    def __init__(self, cfg: WOIConfig):
        self.cfg = cfg
        os.makedirs(cfg.data_dir, exist_ok=True)
        os.makedirs(cfg.log_dir, exist_ok=True)

        self.bus = EventBus(
            log_dir=cfg.log_dir,
            discord_webhook_url=cfg.discord_webhook_url,
            discord_level=cfg.discord_log_level,
        )

        self.structured = StructuredMemoryStore(cfg.memory_db_path)

        self.vector = None
        if VectorMemoryStore is not None:
            try:
                self.vector = VectorMemoryStore(cfg.vector_db_path)
            except Exception:
                self.vector = None

        self.retriever = MemoryRetriever(self.structured, self.vector)

        self.watchlist = WatchlistStore(cfg.memory_db_path)
        self.rules = RulesStore(cfg.memory_db_path)
        self.settings = SettingsStore(cfg.memory_db_path)

        self.router = WOIRouter(cfg, self.bus, self.retriever)
        self.modules = ModuleRegistry(cfg, self.bus)

        self.strategy_engine = StrategyEngine(
            cfg=cfg,
            bus=self.bus,
            modules=self.modules,
            structured=self.structured,
            watchlist=self.watchlist,
            rules=self.rules,
            vector=self.vector,
        )

        self._started = False
        self.polymarket_override = {"enabled": None, "dry_run": None}

    async def start(self):
        if self._started:
            return

        await self.structured.init()
        await self.watchlist.init()
        await self.rules.init()
        await self.settings.init()

        # Load persisted overrides

        # Load persisted overrides
        o = await self.settings.get("polymarket_mode")
        if o:
            self.polymarket_override = {"enabled": o.get("enabled"), "dry_run": o.get("dry_run")}

        self.bus.start()
        await self.bus.emit(WoiEvent("🚀 WOI_STARTUP", "WOI runtime starting", {"mode": self.cfg.mode, "focus": self.cfg.focus}))
        await self.modules.init()
        self.strategy_engine.start()
        self._started = True

    async def stop(self):
        if not self._started:
            return
        await self.bus.emit(WoiEvent("🛑 WOI_SHUTDOWN", "WOI runtime stopping", {}))
        await self.modules.stop()
        await self.strategy_engine.stop()
        await self.bus.stop()
        self._started = False

    def effective_polymarket_enabled(self) -> bool:
        o = self.polymarket_override.get("enabled")
        return bool(self.cfg.polymarket_enabled if o is None else o)

    def effective_polymarket_dry_run(self) -> bool:
        o = self.polymarket_override.get("dry_run")
        return bool(self.cfg.polymarket_dry_run if o is None else o)

    async def set_polymarket_mode(self, enabled: bool, dry_run: bool):
        self.polymarket_override = {"enabled": enabled, "dry_run": dry_run}
        await self.settings.set("polymarket_mode", {"enabled": enabled, "dry_run": dry_run})
        await self.bus.emit(WoiEvent("⚙️ POLY_MODE_SET", "Polymarket mode updated", {"enabled": enabled, "dry_run": dry_run}))
