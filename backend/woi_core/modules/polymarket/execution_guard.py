from __future__ import annotations
from typing import Any, Callable, Dict, Optional
from woi_core.modules.polymarket.blotter import append as blotter_append

# Signature:
# executor(order_dict) -> result dict
# risk_governor: provides allow_order / note_fill / note_error hooks

async def place_order_guarded(
    runtime,
    order: Dict[str, Any],
    expected_mid: Optional[float],
    live_enabled: bool,
    shadow_enabled: bool,
    risk_governor,
    executor: Callable[[Dict[str, Any]], Any],
) -> Dict[str, Any]:
    order = order or {}
    tag = str(order.get("tag") or order.get("strategy") or "unknown")
    side = str(order.get("side") or "").lower()
    price = order.get("price", None)
    size = order.get("size", None)
    token = order.get("token_id") or order.get("tokenID") or order.get("outcome")

    # Evaluate risk
    ok, reason, meta = risk_governor.allow_order(order=order, expected_mid=expected_mid)
    executed = False
    result = {"ok": False, "executed": False, "reason": reason, "meta": meta, "mode": {"live": live_enabled, "shadow": shadow_enabled}}

    # Shadow order always logs for validation
    blotter_append({
        "kind": "shadow_attempt",
        "tag": tag, "side": side, "price": price, "size": size, "token": token,
        "expected_mid": expected_mid,
        "allowed": ok, "block_reason": reason,
    })

    if not ok:
        # Blocked by governor
        blotter_append({
            "kind": "blocked",
            "tag": tag, "side": side, "price": price, "size": size, "token": token,
            "expected_mid": expected_mid, "reason": reason,
        })
        return result

    if not live_enabled:
        # Allowed but live disabled (safe)
        blotter_append({
            "kind": "allowed_but_live_off",
            "tag": tag, "side": side, "price": price, "size": size, "token": token,
            "expected_mid": expected_mid,
        })
        return {"ok": True, "executed": False, "reason": "live_disabled", "meta": meta, "mode": {"live": False, "shadow": shadow_enabled}}

    # Place live
    res = await executor(order)
    executed = bool(res.get("ok"))
    fill_price = res.get("fill_price", None)
    # Slippage calc
    slippage = None
    if expected_mid is not None and fill_price is not None:
        try:
            slippage = abs(float(fill_price) - float(expected_mid))
        except Exception:
            slippage = None

    if executed:
        risk_governor.note_fill(fill_price=fill_price, expected_mid=expected_mid)
        blotter_append({
            "kind": "executed",
            "tag": tag, "side": side, "price": price, "size": size, "token": token,
            "expected_mid": expected_mid, "fill_price": fill_price, "slippage": slippage,
            "order_id": res.get("order_id"), "status": res.get("status"),
        })
        return {"ok": True, "executed": True, "fill_price": fill_price, "slippage": slippage, "result": res, "mode": {"live": True, "shadow": shadow_enabled}}

    risk_governor.note_error()
    blotter_append({
        "kind": "error",
        "tag": tag, "side": side, "price": price, "size": size, "token": token,
        "expected_mid": expected_mid,
        "error": res.get("error"), "detail": res.get("detail"),
    })
    return {"ok": False, "executed": True, "reason": res.get("error","executor_error"), "detail": res.get("detail"), "result": res, "mode": {"live": True, "shadow": shadow_enabled}}
