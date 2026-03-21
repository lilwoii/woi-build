from __future__ import annotations
from .base import PolyStrategy, PolyDecision, DecisionType

class SpreadCaptureStrategy(PolyStrategy):
    name = "spread_capture"

    async def decide(self, ctx, polymarket) -> PolyDecision:
        token = (ctx.signals.get("candidate_token_id") or "").strip()
        if not token:
            # fallback: try a token_id passed from UI/manual
            token = (ctx.signals.get("token_id") or "").strip()
        if not token:
            return PolyDecision(kind=DecisionType.NOOP, note="no candidate token")

        md = getattr(polymarket, "market_data", None)
        if not md:
            return PolyDecision(kind=DecisionType.NOOP, note="no market_data module")

        bid, ask, mid = await md.best_bid_ask_mid(token)
        if bid is None or ask is None:
            return PolyDecision(kind=DecisionType.NOOP, note="no book")

        spread = ask - bid
        # If spread is wide enough, place a passive order slightly better than bid
        if spread >= 0.02:
            price = min(ask - 0.01, bid + 0.01)
            return PolyDecision(kind=DecisionType.ORDER, token_id=token, side="buy", price=float(price), size=1.0, note=f"spread {spread:.3f} passive buy")
        return PolyDecision(kind=DecisionType.NOOP, note=f"spread {spread:.3f} too tight")
