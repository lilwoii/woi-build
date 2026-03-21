from __future__ import annotations
import os
from typing import Any, Dict

# pmxt: "CCXT for prediction markets"
# NOTE: API surface may evolve; keep adapter minimal.
try:
    import pmxt  # type: ignore
except Exception:
    pmxt = None  # type: ignore

def _client():
    if pmxt is None:
        raise RuntimeError("pmxt_not_installed")
    exchange = os.getenv("PMXT_EXCHANGE", "polymarket")
    pk = os.getenv("PMXT_PRIVATE_KEY", "").strip()
    if not pk:
        raise RuntimeError("PMXT_PRIVATE_KEY_missing")
    network = os.getenv("PMXT_NETWORK", "polygon")
    # Most pmxt examples: exchange = pmxt.polymarket({'privateKey': ...})
    # We support a couple likely shapes.
    if hasattr(pmxt, exchange):
        ctor = getattr(pmxt, exchange)
        return ctor({"privateKey": pk, "network": network})
    # Fallback: pmxt.Exchange(exchange, ...)
    if hasattr(pmxt, "Exchange"):
        return pmxt.Exchange(exchange, {"privateKey": pk, "network": network})
    raise RuntimeError("pmxt_exchange_constructor_not_found")

async def place_live_order(order: Dict[str, Any]) -> Dict[str, Any]:
    """Places a real order via pmxt.

    Expected order shape (normalized by WOI):
    {
      "token_id": "...",  # or outcome id
      "side": "buy"|"sell",
      "type": "limit"|"market",
      "price": 0.52,
      "size": 50,     # shares
      "amount": 100,  # optional spend for market-buy style
      "meta": {...}
    }
    """
    ex = _client()
    # Map fields to pmxt create_order example shown in pmxt repo:
    # exchange.create_order(outcome=..., side='buy', type='limit', price=0.33, amount=100)
    outcome = order.get("outcome") or order.get("token_id") or order.get("tokenID") or order.get("token_id")
    side = (order.get("side") or "").lower()
    otype = (order.get("type") or "limit").lower()
    price = order.get("price", None)
    amount = order.get("amount", None)
    size = order.get("size", None)

    params = {}
    if outcome is not None:
        params["outcome"] = outcome
    params["side"] = side
    params["type"] = otype
    if price is not None:
        params["price"] = float(price)
    # pmxt uses amount; we pass size if amount missing
    if amount is None and size is not None:
        params["amount"] = float(size)
    elif amount is not None:
        params["amount"] = float(amount)

    # Execute (sync call in most libs)
    try:
        res = ex.create_order(**params)
        # Normalize
        order_id = getattr(res, "id", None) or getattr(res, "order_id", None) or (res.get("id") if isinstance(res, dict) else None)
        status = getattr(res, "status", None) or (res.get("status") if isinstance(res, dict) else None)
        fill_price = None
        if isinstance(res, dict):
            fill_price = res.get("fill_price") or res.get("avg_price") or res.get("average")
        return {"ok": True, "order_id": order_id, "status": status, "fill_price": fill_price, "raw": res}
    except Exception as e:
        return {"ok": False, "error": "pmxt_create_order_failed", "detail": str(e)[:240], "order": order}
