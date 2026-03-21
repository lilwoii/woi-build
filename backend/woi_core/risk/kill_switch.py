from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, Any, List


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class KillSwitchConfig:
    enabled: bool = True
    max_daily_loss_usd: float = 300.0
    max_consecutive_losses: int = 4
    max_strategy_drawdown_pct: float = 6.0
    max_market_stress: float = 0.92
    stale_quote_seconds: int = 30


class RiskKillSwitch:
    def __init__(self) -> None:
        self.config = KillSwitchConfig()
        self.tripped = False
        self.reason = ""
        self.history: List[Dict[str, Any]] = []

    def evaluate(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        if not self.config.enabled:
            return {"ok": True, "tripped": False, "reason": "", "metrics": metrics}

        checks = [
            (
                float(metrics.get("daily_loss_usd", 0.0)) >= self.config.max_daily_loss_usd,
                f"🛑 Daily loss exceeded ${self.config.max_daily_loss_usd:.2f}",
            ),
            (
                int(metrics.get("consecutive_losses", 0)) >= self.config.max_consecutive_losses,
                f"🛑 Consecutive losses exceeded {self.config.max_consecutive_losses}",
            ),
            (
                float(metrics.get("strategy_drawdown_pct", 0.0)) >= self.config.max_strategy_drawdown_pct,
                f"🛑 Strategy drawdown exceeded {self.config.max_strategy_drawdown_pct:.2f}%",
            ),
            (
                float(metrics.get("market_stress", 0.0)) >= self.config.max_market_stress,
                f"🛑 Market stress exceeded {self.config.max_market_stress:.2f}",
            ),
            (
                int(metrics.get("stale_quote_seconds", 0)) >= self.config.stale_quote_seconds,
                f"🛑 Quote staleness exceeded {self.config.stale_quote_seconds}s",
            ),
        ]

        for condition, reason in checks:
            if condition:
                self.tripped = True
                self.reason = reason
                event = {
                    "ts_utc": utc_now(),
                    "tripped": True,
                    "reason": reason,
                    "metrics": metrics,
                }
                self.history.insert(0, event)
                self.history = self.history[:100]
                return {"ok": True, "tripped": True, "reason": reason, "metrics": metrics}

        return {"ok": True, "tripped": False, "reason": "", "metrics": metrics}

    def reset(self) -> Dict[str, Any]:
        self.tripped = False
        self.reason = ""
        return {"ok": True, "tripped": False}

    def update_config(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        for field_name in asdict(self.config).keys():
            if field_name in payload:
                setattr(self.config, field_name, payload[field_name])
        return {"ok": True, "config": asdict(self.config)}

    def status(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "config": asdict(self.config),
            "tripped": self.tripped,
            "reason": self.reason,
            "history": self.history[:20],
        }