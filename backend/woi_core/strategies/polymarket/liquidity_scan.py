from __future__ import annotations
from .base import PolyStrategy, PolyDecision, DecisionType

class LiquidityDetectionStrategy(PolyStrategy):
    name = "liquidity_detection"

    async def decide(self, ctx, polymarket) -> PolyDecision:
        # Scaffold:
        # - scan markets list
        # - compute depth + volume proxies
        # - select tokens suitable for spread/market-making
        # For now: NOOP but writes signal for future strategies.
        ctx.signals["liquidity_scan"] = {"status": "scaffold"}
        return PolyDecision(kind=DecisionType.NOOP, note="scaffold liquidity scan")
