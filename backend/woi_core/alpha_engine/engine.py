from __future__ import annotations
import asyncio, os, time
from typing import Any, Dict, List, Optional

from ..events import EventBus, WoiEvent, utc_now
from ..learning.journal import TradeJournal
from ..learning.scorecards import StrategyScorecards
from ..learning.evolution import StrategyEvolution
from ..strategies.polymarket.base import PolyStrategy, PolyDecision, DecisionType
from ..intel.openbb_bridge import OpenBBBridge
from ..intel.sentiment import SentimentQueue
from ..intel.whale import WhaleWatcher
from ..modules.polymarket.allocator import PortfolioAllocator
from .state import AlphaStatus, AlphaContext

class AlphaEngine:
    def __init__(self, bus: EventBus, polymarket_module, memory_structured, memory_vector):
        self.bus = bus
        self.polymarket = polymarket_module
        self.mem_struct = memory_structured
        self.mem_vec = memory_vector

        self.status = AlphaStatus()
        self._task: Optional[asyncio.Task] = None

        self.tick_sec = int(os.getenv("ALPHA_ENGINE_TICK_SEC", "15"))
        self.max_decisions_per_hour = int(os.getenv("ALPHA_ENGINE_MAX_DECISIONS_PER_HOUR", "120"))
        self._decisions_window: List[float] = []

        self.journal = TradeJournal(self.mem_struct.db_path)
        self.scorecards = StrategyScorecards(self.mem_struct.db_path)
        self.evolution = StrategyEvolution(self.scorecards)

        self.openbb = OpenBBBridge(enabled=os.getenv("OPENBB_ENABLED","false").lower()=="true")
        self.sentiment = SentimentQueue(self.mem_struct.db_path, enabled=os.getenv("SENTIMENT_ENABLED","true").lower()=="true")
        self.whales = WhaleWatcher(enabled=os.getenv("WHALE_ENABLED","false").lower()=="true")
        self.allocator = PortfolioAllocator()

        self.strategies: List[PolyStrategy] = []
        self._load_strategies()

    def _load_strategies(self):
        from ..strategies.polymarket.spread_capture import SpreadCaptureStrategy
        from ..strategies.polymarket.liquidity_scan import LiquidityDetectionStrategy
        from ..strategies.polymarket.market_maker import MarketMakingStrategy
        from ..strategies.polymarket.event_baskets import EventBasketStrategy
        from ..strategies.polymarket.arbitrage_stub import ArbitrageStubStrategy

        self.strategies = [SpreadCaptureStrategy(), LiquidityDetectionStrategy(), MarketMakingStrategy(), EventBasketStrategy(), ArbitrageStubStrategy()]

    async def init(self):
        await self.journal.init()
        await self.scorecards.init()
        await self.sentiment.init()
        await self.bus.emit(WoiEvent("🧠 ALPHA_INIT", "Alpha Engine initialized", {
            "tick_sec": self.tick_sec,
            "strategies": [s.name for s in self.strategies],
            "allocator_enabled": self.allocator.enabled,
        }))

    def _mode(self) -> str:
        if not self.polymarket.exec.state.enabled:
            return "OFF"
        return "DRY_RUN" if self.polymarket.exec.state.dry_run else "LIVE"

    async def start(self):
        if self._task and not self._task.done():
            return
        self.status.running = True
        self._task = asyncio.create_task(self._loop(), name="woi_alpha_engine")
        await self.bus.emit(WoiEvent("▶️ ALPHA_START", "Alpha Engine started", {"mode": self._mode()}))

    async def stop(self):
        self.status.running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except Exception:
                pass
        await self.bus.emit(WoiEvent("🛑 ALPHA_STOP", "Alpha Engine stopped", {}))

    def _throttle_ok(self) -> bool:
        now = time.time()
        self._decisions_window = [t for t in self._decisions_window if now - t < 3600]
        return len(self._decisions_window) < self.max_decisions_per_hour

    async def _loop(self):
        await self.init()
        t = 0
        while self.status.running:
            t += 1
            self.status.tick = t
            self.status.mode = self._mode()
            ctx = AlphaContext()

            try:
                await self.bus.emit(WoiEvent("🔎 ALPHA_TICK", "Alpha tick", {"tick": t, "mode": self.status.mode}, level="DEBUG"))
                chosen = self.evolution.choose(self.strategies)
                decision = await chosen.decide(ctx=ctx, polymarket=self.polymarket)

                if decision and decision.kind != DecisionType.NOOP:
                    if not self._throttle_ok():
                        await self.bus.emit(WoiEvent("🧯 ALPHA_THROTTLE", "Decision throttled (hourly cap)", {"cap": self.max_decisions_per_hour}, level="WARN"))
                    else:
                        self._decisions_window.append(time.time())
                        await self._execute(decision, chosen.name, ctx)

                if t % 10 == 0:
                    self.evolution.maybe_prune_or_mutate(self.strategies)

            except Exception as e:
                await self.bus.emit(WoiEvent("💥 ALPHA_ERROR", "Alpha loop error", {"error": str(e)[:4000]}, level="ERROR"))

            await asyncio.sleep(self.tick_sec)

    async def _execute(self, decision: PolyDecision, strategy_name: str, ctx: AlphaContext):
        edge = float(ctx.signals.get("edge", 0.01))
        open_positions = int(ctx.signals.get("open_positions_count", 0))
        token_exposure = float(ctx.signals.get("token_exposure_usd", 0.0))

        alloc = self.allocator.approve(decision.token_id, decision.side, decision.price, decision.size, edge, open_positions, token_exposure)

        await self.bus.emit(WoiEvent("🧮 ALLOC", "Allocation decision", {
            "strategy": strategy_name,
            "token_id": decision.token_id,
            "edge": edge,
            "requested_size": decision.size,
            "approved": alloc.approved,
            "approved_size": alloc.approved_size,
            "reason": alloc.reason,
            **alloc.meta
        }, level="INFO" if alloc.approved else "WARN"))

        if not alloc.approved or alloc.approved_size <= 0:
            return

        await self.bus.emit(WoiEvent("🧾 ALPHA_DECISION", "Decision generated", {
            "strategy": strategy_name,
            "token_id": decision.token_id,
            "side": decision.side,
            "price": decision.price,
            "size": alloc.approved_size,
            "note": decision.note,
            "mode": self._mode()
        }))

        res = await self.polymarket.exec.place_order(decision.token_id, decision.side, decision.price, alloc.approved_size)

        await self.journal.record(
            ts_utc=utc_now(),
            venue="polymarket",
            strategy=strategy_name,
            symbol=decision.token_id,
            side=decision.side,
            price=decision.price,
            size=alloc.approved_size,
            result=res
        )
        await self.scorecards.record_trade(strategy=strategy_name, ok=True, pnl_est=0.0)
        self.evolution.update_after_trade(strategy_name, reward=0.01 if res.get("dry_run") else 0.02)

        await self.bus.emit(WoiEvent("✅ ALPHA_EXEC", "Decision executed/journaled", {"strategy": strategy_name, "dry_run": res.get("dry_run", True)}))
