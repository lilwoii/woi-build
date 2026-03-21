from __future__ import annotations
import os, time, math
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

def _env_bool(k: str, default: bool) -> bool:
    v = os.getenv(k, "true" if default else "false").strip().lower()
    return v in ("1","true","yes","y","on")

def _now() -> float:
    return time.time()

def _total_pnl(row: Dict[str, Any]) -> float:
    try:
        return float(row.get("realized", 0.0)) + float(row.get("unrealized", 0.0))
    except Exception:
        return 0.0

def _std(vals: List[float]) -> float:
    n = len(vals)
    if n < 2:
        return 0.0
    m = sum(vals) / n
    v = sum((x-m)**2 for x in vals) / (n-1)
    return math.sqrt(max(0.0, v))

def _max_drawdown(vals: List[float]) -> float:
    peak = -1e18
    mdd = 0.0
    for x in vals:
        if x > peak:
            peak = x
        dd = peak - x
        if dd > mdd:
            mdd = dd
    return mdd

@dataclass
class RiskConfig:
    armed: bool
    window_trades: int
    max_slippage: float
    max_pnl_std: float
    max_drawdown: float
    error_spike: int
    cooldown_sec: int

    @staticmethod
    def from_env() -> "RiskConfig":
        return RiskConfig(
            armed=_env_bool("WOI_RISK_GOVERNOR_ARMED", True),
            window_trades=int(os.getenv("WOI_RISK_WINDOW_TRADES", "25")),
            max_slippage=float(os.getenv("WOI_RISK_MAX_SLIPPAGE", "0.015")),
            max_pnl_std=float(os.getenv("WOI_RISK_MAX_PNL_STD", "2.5")),
            max_drawdown=float(os.getenv("WOI_RISK_MAX_DRAWDOWN", "8.0")),
            error_spike=int(os.getenv("WOI_RISK_ERROR_SPIKE", "6")),
            cooldown_sec=int(os.getenv("WOI_RISK_COOLDOWN_SEC", "1800")),
        )

class RiskGovernor:
    def __init__(self):
        self.cfg = RiskConfig.from_env()
        self.last_trip_ts: float = 0.0
        self.last_reason: str = ""
        self._slippage_samples: List[float] = []
        self._errors_recent: List[float] = []

    def set_config(self, **kwargs) -> Dict[str, Any]:
        for k, v in kwargs.items():
            if hasattr(self.cfg, k):
                setattr(self.cfg, k, v)
        return {"ok": True, "config": self.status()["config"]}

    def arm(self, armed: bool) -> Dict[str, Any]:
        self.cfg.armed = bool(armed)
        return {"ok": True, "armed": self.cfg.armed}

    def note_error(self):
        now = _now()
        self._errors_recent.append(now)
        self._errors_recent = [t for t in self._errors_recent if (now - t) < 600]

    def note_slippage(self, slippage: float):
        self._slippage_samples.append(float(slippage))
        if len(self._slippage_samples) > 500:
            self._slippage_samples = self._slippage_samples[-500:]

    def can_trade_live(self) -> Tuple[bool, str]:
        if not self.cfg.armed:
            return True, "not_armed"
        if self.last_trip_ts and (_now() - self.last_trip_ts) < self.cfg.cooldown_sec:
            return False, f"cooldown:{self.last_reason}"
        if len(self._errors_recent) >= self.cfg.error_spike:
            return False, "error_spike"
        win = self._slippage_samples[-self.cfg.window_trades:]
        if win and max(win) > self.cfg.max_slippage:
            return False, f"slippage>{self.cfg.max_slippage}"
        return True, "ok"

    def eval_pnl_timeseries(self, series: List[Dict[str, Any]]) -> Tuple[bool, str, Dict[str, Any]]:
        vals = [_total_pnl(r) for r in series][-250:]
        if not vals:
            return True, "no_series", {}
        std = _std(vals[-min(60, len(vals)):])
        mdd = _max_drawdown(vals)
        stats = {"pnl_std": std, "max_drawdown": mdd, "pnl_last": vals[-1]}
        if not self.cfg.armed:
            return True, "not_armed", stats
        if std > self.cfg.max_pnl_std:
            return False, f"pnl_std>{self.cfg.max_pnl_std}", stats
        if mdd > self.cfg.max_drawdown:
            return False, f"drawdown>{self.cfg.max_drawdown}", stats
        return True, "ok", stats

    def trip(self, reason: str):
        self.last_trip_ts = _now()
        self.last_reason = reason

    def status(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "config": {
                "armed": self.cfg.armed,
                "window_trades": self.cfg.window_trades,
                "max_slippage": self.cfg.max_slippage,
                "max_pnl_std": self.cfg.max_pnl_std,
                "max_drawdown": self.cfg.max_drawdown,
                "error_spike": self.cfg.error_spike,
                "cooldown_sec": self.cfg.cooldown_sec,
            },
            "state": {
                "last_trip_ts": self.last_trip_ts,
                "last_reason": self.last_reason,
                "slippage_samples": len(self._slippage_samples),
                "errors_recent": len(self._errors_recent),
            }
        }
