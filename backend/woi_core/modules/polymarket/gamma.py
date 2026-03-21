from __future__ import annotations
import os
from typing import Any, Dict, Optional
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from cachetools import TTLCache

GAMMA_HOST = os.getenv("POLY_GAMMA_HOST", "https://gamma-api.polymarket.com")
CACHE_SEC = int(os.getenv("SETTLEMENT_CACHE_SEC", "120"))
_cache = TTLCache(maxsize=2048, ttl=CACHE_SEC)

class GammaClient:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.4, min=0.4, max=2))
    async def market_by_token(self, token_id: str) -> Optional[Dict[str, Any]]:
        cache_key = f"mkt:{token_id}"
        if cache_key in _cache:
            return _cache[cache_key]

        # pragmatic: query /markets with token_id filter (Gamma variants may differ; this is safe fallback)
        url = f"{GAMMA_HOST}/markets"
        r = await self.client.get(url, params={"token_id": token_id})
        if r.status_code == 404:
            return None
        r.raise_for_status()
        data = r.json()
        mkt = None
        if isinstance(data, dict) and "markets" in data and isinstance(data["markets"], list):
            mkt = data["markets"][0] if data["markets"] else None
        elif isinstance(data, list):
            mkt = data[0] if data else None
        elif isinstance(data, dict):
            mkt = data
        _cache[cache_key] = mkt
        return mkt

    async def close(self):
        await self.client.aclose()
