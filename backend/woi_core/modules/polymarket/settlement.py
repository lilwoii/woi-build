from __future__ import annotations
import os
from typing import Optional
from .gamma import GammaClient

class SettlementResolver:
    def __init__(self):
        self.enabled = os.getenv("SETTLEMENT_ENABLED","false").lower() == "true"
        self.gamma = GammaClient()

    async def resolve_token_settlement_price(self, token_id: str) -> Optional[float]:
        if not self.enabled:
            return None

        mkt = await self.gamma.market_by_token(token_id)
        if not mkt:
            return None

        status = str(mkt.get("status", "")).lower()
        resolved = bool(mkt.get("resolved") or mkt.get("is_resolved") or status in ("resolved","settled","closed"))
        if not resolved:
            return None

        winner = mkt.get("winning_outcome") or mkt.get("outcome") or mkt.get("winner")
        if winner is None:
            return None

        if str(winner) == str(token_id):
            return 1.0

        token_meta = None
        for t in (mkt.get("tokens") or mkt.get("outcomes") or []):
            if str(t.get("token_id") or t.get("tokenId") or t.get("id")) == str(token_id):
                token_meta = t
                break
        if token_meta:
            label = str(token_meta.get("outcome") or token_meta.get("label") or token_meta.get("name") or "").upper()
            win_label = str(winner).upper()
            if label and win_label and label == win_label:
                return 1.0
            return 0.0

        return None

    async def close(self):
        await self.gamma.close()
