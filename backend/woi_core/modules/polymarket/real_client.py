from __future__ import annotations
import os
from typing import Any, Dict, Optional

# py-clob-client
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, OrderArgs
from py_clob_client.constants import POLYGON

class PolymarketRealClient:
    """Thin wrapper around Polymarket's official Python CLOB client.

    This is designed for server-side automation (24/7).
    Auth model:
      - L1: EVM private key signs EIP-712 messages
      - L2: API key headers for trading endpoints

    Docs: https://docs.polymarket.com/trading/overview
    """

    def __init__(self, host: str, chain_id: int, private_key: str, api_creds: Optional[ApiCreds] = None):
        self.host = host
        self.chain_id = chain_id
        self.private_key = private_key
        self.client = ClobClient(host, chain_id, private_key=private_key, creds=api_creds)

    def derive_api_creds(self) -> ApiCreds:
        return self.client.create_or_derive_api_key()

    def set_api_creds(self, creds: ApiCreds):
        self.client = ClobClient(self.host, self.chain_id, private_key=self.private_key, creds=creds)

    def get_markets(self, limit: int = 50) -> Dict[str, Any]:
        return self.client.get_markets(next_cursor="", limit=limit)

    def get_orderbook(self, token_id: str) -> Dict[str, Any]:
        return self.client.get_order_book(token_id)

    def place_order(self, token_id: str, side: str, price: float, size: float) -> Dict[str, Any]:
        # OrderArgs expects size in shares; price in probability units depending on token format.
        args = OrderArgs(
            token_id=token_id,
            price=price,
            size=size,
            side=side,
        )
        signed = self.client.create_order(args)
        return self.client.post_order(signed, order_type="GTC")
