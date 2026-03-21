from __future__ import annotations
from .base import PolyStrategy, PolyDecision, DecisionType

class ArbitrageStubStrategy(PolyStrategy):
    name = "arbitrage_stub"

    async def decide(self, ctx, polymarket) -> PolyDecision:
        # Bundle 7: we now have orderbook mid prices.
        # True arbitrage needs an external reference probability (news model / other venue / OpenBB-sourced proxy).
        token = (ctx.signals.get("candidate_token_id") or "").strip()
        if not token:
            return PolyDecision(kind=DecisionType.NOOP, note="no token")
        md = getattr(polymarket, "market_data", None)
        if not md:
            return PolyDecision(kind=DecisionType.NOOP, note="no market_data")
        _, _, mid = await md.best_bid_ask_mid(token)
        if mid is None:
            return PolyDecision(kind=DecisionType.NOOP, note="no mid")
        # placeholder: no external ref yet
        return PolyDecision(kind=DecisionType.NOOP, note=f"needs external ref vs mid={mid:.3f}")
