from __future__ import annotations
from .base import PolyStrategy, PolyDecision, DecisionType

class EventBasketStrategy(PolyStrategy):
    name = "event_baskets"

    async def decide(self, ctx, polymarket) -> PolyDecision:
        # Scaffold uses gamma markets to find related outcomes where sum probs > 1 (mispriced basket).
        md = getattr(polymarket, "market_data", None)
        if not md:
            return PolyDecision(kind=DecisionType.NOOP, note="no market_data module")

        markets = ctx.signals.get("gamma_markets")
        if not markets:
            try:
                markets = await md.markets(limit=50, active=True)
                ctx.signals["gamma_markets"] = markets
            except Exception:
                return PolyDecision(kind=DecisionType.NOOP, note="gamma fetch failed")

        # Very lightweight heuristic: pick first market with a token_id and do nothing (we'll implement basket math in Bundle 8)
        for m in markets[:30]:
            tok = (m.get("tokenId") or m.get("token_id") or "").strip()
            if tok:
                return PolyDecision(kind=DecisionType.NOOP, note="basket scanner scaffold (math in next bundle)")
        return PolyDecision(kind=DecisionType.NOOP, note="no tokens found")
