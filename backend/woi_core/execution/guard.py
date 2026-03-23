from __future__ import annotations

from typing import Dict, Any, List


class ExecutionGuard:
    def evaluate(self, controls: Dict[str, Any], order: Dict[str, Any]) -> Dict[str, Any]:
        reasons: List[str] = []

        mode = str(order.get("mode") or "paper").lower()
        asset_class = str(order.get("asset_class") or "stocks").lower()
        notional = float(order.get("notional_usd") or 0.0)
        open_positions = int(order.get("open_positions") or 0)

        if mode == "live" and not controls.get("live_enabled", False):
            reasons.append("Live trading is disabled.")

        if mode == "paper" and not controls.get("paper_enabled", True):
            reasons.append("Paper trading is disabled.")

        if mode == "shadow" and not controls.get("shadow_enabled", True):
            reasons.append("Shadow trading is disabled.")

        if asset_class == "stocks" and not controls.get("stocks_enabled", True):
            reasons.append("Stocks trading is disabled.")

        if asset_class == "crypto" and not controls.get("crypto_enabled", True):
            reasons.append("Crypto trading is disabled.")

        if asset_class == "polymarket" and not controls.get("polymarket_enabled", True):
            reasons.append("Polymarket trading is disabled.")

        if notional > float(controls.get("max_position_notional_usd", 0.0)):
            reasons.append("Order exceeds max position notional.")

        if open_positions >= int(controls.get("max_open_positions", 0)):
            reasons.append("Max open positions reached.")

        approved = len(reasons) == 0
        return {
            "ok": True,
            "approved": approved,
            "reasons": reasons,
            "requires_manual_guard": bool(controls.get("require_guard_approval", True)) and mode == "live",
        }