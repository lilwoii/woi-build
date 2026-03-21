from __future__ import annotations
import os
from typing import Any, Dict, List, Optional, Tuple
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

GAMMA = os.getenv("POLY_GAMMA_API", "https://gamma-api.polymarket.com")
CLOB_HOST = os.getenv("POLY_CLOB_HOST", "https://clob.polymarket.com")

class PolyMarketData:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=12.0)

    async def close(self):
        await self.client.aclose()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def events(self, limit: int = 50) -> List[Dict[str, Any]]:
        r = await self.client.get(f"{GAMMA}/events", params={"limit": limit})
        r.raise_for_status()
        return r.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def markets(self, limit: int = 50, active: bool = True) -> List[Dict[str, Any]]:
        r = await self.client.get(f"{GAMMA}/markets", params={"limit": limit, "active": str(active).lower()})
        r.raise_for_status()
        return r.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4))
    async def orderbook(self, token_id: str) -> Dict[str, Any]:
        # CLOB public endpoint (no auth) for orderbook snapshot
        r = await self.client.get(f"{CLOB_HOST}/book", params={"token_id": token_id})
        r.raise_for_status()
        return r.json()

    async def best_bid_ask_mid(self, token_id: str) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        ob = await self.orderbook(token_id)
        bids = ob.get("bids") or []
        asks = ob.get("asks") or []
        best_bid = float(bids[0]["price"]) if bids else None
        best_ask = float(asks[0]["price"]) if asks else None
        mid = None
        if best_bid is not None and best_ask is not None:
            mid = (best_bid + best_ask) / 2.0
        return best_bid, best_ask, mid

    async def depth(self, token_id: str, levels: int = 10) -> Dict[str, float]:
        ob = await self.orderbook(token_id)
        bids = (ob.get("bids") or [])[:levels]
        asks = (ob.get("asks") or [])[:levels]
        bid_notional = sum(float(x.get("price",0))*float(x.get("size",0)) for x in bids)
        ask_notional = sum(float(x.get("price",0))*float(x.get("size",0)) for x in asks)
        return {"bid_notional": bid_notional, "ask_notional": ask_notional, "levels": float(levels)}
