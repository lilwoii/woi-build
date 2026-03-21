from __future__ import annotations
from .base import PolyStrategy, PolyDecision, DecisionType

class MarketMakingStrategy(PolyStrategy):
    name = "market_making"

    async def decide(self, ctx, polymarket) -> PolyDecision:
        token = (ctx.signals.get("candidate_token_id") or "").strip()
        if not token:
            return PolyDecision(kind=DecisionType.NOOP, note="no candidate token")

        md = getattr(polymarket, "market_data", None)
        if not md:
            return PolyDecision(kind=DecisionType.NOOP, note="no market_data module")

        bid, ask, mid = await md.best_bid_ask_mid(token)
        if mid is None:
            return PolyDecision(kind=DecisionType.NOOP, note="no mid")

        # Scaffold: quote a small bid just below mid in DRY_RUN; real MM will place two-sided orders + cancel/replace.
        price = max(0.01, float(mid) - 0.01)
        return PolyDecision(kind=DecisionType.ORDER, token_id=token, side="buy", price=price, size=1.0, note="mm scaffold bid near mid")
