from __future__ import annotations

from typing import Dict, Any


class ExecutionControls:
    def __init__(self) -> None:
        self.state = {
            "paper_enabled": True,
            "live_enabled": False,
            "shadow_enabled": True,
            "require_guard_approval": True,
            "max_position_notional_usd": 1000.0,
            "max_daily_notional_usd": 5000.0,
            "max_open_positions": 5,
            "stocks_enabled": True,
            "crypto_enabled": True,
            "polymarket_enabled": True,
        }

    def get(self) -> Dict[str, Any]:
        return {"ok": True, "controls": self.state}

    def update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        for key in self.state.keys():
            if key in payload:
                self.state[key] = payload[key]
        return {"ok": True, "controls": self.state}