from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, Optional
from ...config import WOIConfig
from ...events import EventBus, WoiEvent
from .real_client import PolymarketRealClient
from py_clob_client.clob_types import ApiCreds

@dataclass
class PolyExecState:
    enabled: bool = False
    dry_run: bool = True

class PolymarketExecutor:
    def __init__(self, cfg: WOIConfig, bus: EventBus):
        self.cfg = cfg
        self.bus = bus
        self.state = PolyExecState(enabled=cfg.polymarket_enabled, dry_run=cfg.polymarket_dry_run)
        self._client: Optional[PolymarketRealClient] = None

    def set_mode(self, enabled: bool, dry_run: bool):
        self.state.enabled = enabled
        self.state.dry_run = dry_run

    def _ensure_client(self):
        if self._client is not None:
            return

        host = __import__("os").getenv("POLY_CLOB_HOST", "https://clob.polymarket.com")
        chain_id = int(__import__("os").getenv("POLY_CHAIN_ID", "137"))
        pk = (__import__("os").getenv("POLYMARKET_PRIVATE_KEY") or "").strip()
        if not pk:
            raise RuntimeError("POLYMARKET_PRIVATE_KEY is required for server-side automation.")
        api_key = (__import__("os").getenv("POLY_API_KEY") or "").strip()
        api_secret = (__import__("os").getenv("POLY_API_SECRET") or "").strip()
        api_pass = (__import__("os").getenv("POLY_API_PASSPHRASE") or "").strip()

        creds = None
        if api_key and api_secret and api_pass:
            creds = ApiCreds(api_key=api_key, api_secret=api_secret, passphrase=api_pass)

        self._client = PolymarketRealClient(host=host, chain_id=chain_id, private_key=pk, api_creds=creds)

    async def connect_or_derive_api(self) -> Dict[str, Any]:
        self._ensure_client()
        creds = self._client.derive_api_creds()
        await self.bus.emit(WoiEvent("🔑 POLY_API_DERIVED", "Derived/loaded Polymarket API creds", {"api_key_prefix": creds.api_key[:6]}))
        return {"api_key": creds.api_key, "api_secret": creds.api_secret, "passphrase": creds.passphrase}

    async def place_order(self, token_id: str, side: str, price: float, size: float) -> Dict[str, Any]:
        # Mode gates
        if not self.state.enabled:
            raise RuntimeError("Polymarket is OFF (disabled). Toggle to DRY_RUN or LIVE.")
        if price <= 0 or size <= 0:
            raise RuntimeError("Invalid price/size.")

        # Guardrails
        est = float(price) * float(size)
        if self.cfg.polymarket_max_usd_per_trade is not None and est > float(self.cfg.polymarket_max_usd_per_trade):
            raise RuntimeError(f"Trade blocked: est_usd={est:.2f} > max_usd_per_trade={self.cfg.polymarket_max_usd_per_trade}")

        await self.bus.emit(WoiEvent("🧾 POLY_ORDER_INTENT", "Order intent", {"token_id": token_id, "side": side, "price": price, "size": size, "dry_run": self.state.dry_run}))

        if self.state.dry_run:
            await self.bus.emit(WoiEvent("🧪 POLY_DRYRUN", "Dry-run: no real order sent", {"token_id": token_id}))
            return {"ok": True, "dry_run": True, "token_id": token_id, "side": side, "price": price, "size": size}

        # LIVE
        self._ensure_client()
        res = self._client.place_order(token_id=token_id, side=side, price=price, size=size)
        await self.bus.emit(WoiEvent("✅ POLY_ORDER_SENT", "Order submitted", {"token_id": token_id, "side": side, "price": price, "size": size}))
        return {"ok": True, "dry_run": False, "result": res}
