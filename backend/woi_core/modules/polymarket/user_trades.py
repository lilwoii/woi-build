from __future__ import annotations
import os, time, hmac, hashlib, base64
from typing import Any, Dict, List
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

CLOB_HOST = os.getenv("POLY_CLOB_HOST", "https://clob.polymarket.com")
TRADES_PATH = os.getenv("POLY_USER_TRADES_PATH", "/trades")

class PolyUserTrades:
    def __init__(self):
        self.enabled = os.getenv("POLY_USER_TRADES_ENABLED","true").lower() == "true"
        self.api_key = os.getenv("POLYMARKET_API_KEY","").strip()
        self.api_secret = os.getenv("POLYMARKET_API_SECRET","").strip()
        self.passphrase = os.getenv("POLYMARKET_API_PASSPHRASE","").strip()
        self.client = httpx.AsyncClient(timeout=12.0)

    def configured(self) -> bool:
        return self.enabled and bool(self.api_key and self.api_secret and self.passphrase)

    def _sign(self, ts: str, method: str, path: str, body: str = "") -> str:
        msg = f"{ts}{method.upper()}{path}{body}".encode()
        secret = self.api_secret.encode()
        sig = hmac.new(secret, msg, hashlib.sha256).digest()
        return base64.b64encode(sig).decode()

    def _headers(self, method: str, path: str, body: str = "") -> Dict[str,str]:
        ts = str(int(time.time()))
        sig = self._sign(ts, method, path, body)
        return {
            "POLYMARKET-API-KEY": self.api_key,
            "POLYMARKET-API-SIGNATURE": sig,
            "POLYMARKET-API-TIMESTAMP": ts,
            "POLYMARKET-API-PASSPHRASE": self.passphrase,
        }

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, min=0.5, max=2))
    async def trades(self, limit: int = 200) -> List[Dict[str, Any]]:
        if not self.configured():
            raise RuntimeError("User trade pull not configured")
        path = f"{TRADES_PATH}"
        url = f"{CLOB_HOST}{path}"
        r = await self.client.get(url, params={"limit": limit}, headers=self._headers("GET", path))
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict) and "items" in data:
            return data["items"]
        if isinstance(data, list):
            return data
        return []

    async def close(self):
        await self.client.aclose()
