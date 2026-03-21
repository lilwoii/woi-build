from __future__ import annotations
import os
import time
import base64
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Callable, Awaitable

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

def _emo(x: float) -> str:
    return "🟩" if x > 0 else "🟥" if x < 0 else "🟨"

def _render_pnl_chart_png(timeseries: List[Dict[str, Any]], max_points: int = 120) -> bytes:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    rows = list(timeseries)[-max_points:]
    xs = list(range(len(rows)))
    ys = [_total_pnl(r) for r in rows]

    fig = plt.figure(figsize=(8, 3))
    ax = fig.add_subplot(111)
    ax.plot(xs, ys, linewidth=2)
    ax.axhline(0, linewidth=1)
    ax.set_title("WOI Polymarket Total PnL (Realized + Unrealized)")
    ax.set_xlabel("snapshots")
    ax.set_ylabel("PnL")
    ax.grid(True, alpha=0.2)

    import io
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format="png", dpi=160)
    plt.close(fig)
    return buf.getvalue()

@dataclass
class VisualAlertConfig:
    enabled: bool
    every_sec: int
    pnl_swing: float
    err_window_sec: int
    err_count: int
    trade_keywords: List[str]
    chart_points: int

    @staticmethod
    def from_env() -> "VisualAlertConfig":
        return VisualAlertConfig(
            enabled=_env_bool("WOI_VISUAL_ALERTS_ENABLED", True),
            every_sec=int(os.getenv("WOI_VISUAL_ALERTS_EVERY_SEC", "45")),
            pnl_swing=float(os.getenv("WOI_VISUAL_ALERT_PNL_SWING", "1.0")),
            err_window_sec=int(os.getenv("WOI_VISUAL_ALERT_ERROR_WINDOW_SEC", "180")),
            err_count=int(os.getenv("WOI_VISUAL_ALERT_ERROR_COUNT", "4")),
            trade_keywords=[s.strip().upper() for s in os.getenv("WOI_VISUAL_ALERT_TRADE_KEYWORDS", "ORDER,EXEC,TRADE,FILL").split(",") if s.strip()],
            chart_points=int(os.getenv("WOI_VISUAL_CHART_POINTS", "120")),
        )

class VisualAlertEngine:
    def __init__(
        self,
        *,
        runtime,
        get_events: Callable[[], List[Dict[str, Any]]],
        get_timeseries: Callable[[], Awaitable[List[Dict[str, Any]]]],
    ):
        self.runtime = runtime
        self.get_events = get_events
        self.get_timeseries = get_timeseries
        self.cfg = VisualAlertConfig.from_env()
        self._enabled = self.cfg.enabled
        self._last_sent_ts = 0.0
        self._last_pnl_value: Optional[float] = None
        self._last_seen_event_idx = 0

    def set_enabled(self, enabled: bool):
        self._enabled = bool(enabled)

    def enabled(self) -> bool:
        return self._enabled

    async def force_send(self, reason: str = "manual"):
        await self._send_chart(reason=reason, include_recent_events=True)

    async def tick(self):
        self.cfg = VisualAlertConfig.from_env()
        if not self._enabled:
            return
        if _now() - self._last_sent_ts < max(10, self.cfg.every_sec):
            return

        events = self.get_events()
        timeseries = await self.get_timeseries()

        pnl_now = _total_pnl(timeseries[-1]) if timeseries else 0.0
        swing_hit = False
        if self._last_pnl_value is None:
            self._last_pnl_value = pnl_now
        else:
            if abs(pnl_now - self._last_pnl_value) >= max(0.0001, self.cfg.pnl_swing):
                swing_hit = True

        trade_hit = False
        new_events = events[self._last_seen_event_idx:]
        self._last_seen_event_idx = len(events)
        for e in new_events[-60:]:
            tag = str(e.get("tag","")).upper()
            if any(k in tag for k in self.cfg.trade_keywords):
                trade_hit = True
                break

        err_hit = False
        err_count = 0
        for e in events[-400:]:
            msg = (str(e.get("message","")) + " " + str(e.get("tag",""))).lower()
            if any(w in msg for w in ("error","exception","traceback","failed")):
                err_count += 1
        if err_count >= self.cfg.err_count:
            err_hit = True

        if swing_hit or trade_hit or err_hit:
            reason = "pnl_swing" if swing_hit else "trade_event" if trade_hit else "error_spike"
            await self._send_chart(reason=reason, include_recent_events=True, pnl_value=pnl_now)
            self._last_pnl_value = pnl_now

    async def _send_chart(self, *, reason: str, include_recent_events: bool, pnl_value: Optional[float]=None):
        timeseries = await self.get_timeseries()
        if pnl_value is None:
            pnl_value = _total_pnl(timeseries[-1]) if timeseries else 0.0

        png_bytes = _render_pnl_chart_png(timeseries, max_points=self.cfg.chart_points)
        b64 = base64.b64encode(png_bytes).decode("utf-8")
        data_url = "data:image/png;base64," + b64

        title = f"📈 {_emo(pnl_value)} WOI Visual Alert — {reason}"
        meta: Dict[str, Any] = {"reason": reason, "total_pnl": f"{pnl_value:.4f}"}

        if include_recent_events:
            ev = self.get_events()[-10:]
            meta["recent_tags"] = "; ".join([str(x.get("tag","")) for x in ev][-6:])

        from woi_core.ops.discord_media import send_discord_png
        res = send_discord_png(title=title, png_base64=data_url, meta=meta, filename="woi_pnl_chart.png")

        await self.runtime.bus.emit(self.runtime.event_cls("📸📈 VISUAL_ALERT", "Visual alert sent", {"reason": reason, "ok": res.get("ok"), "total_pnl": pnl_value, "skipped": res.get("skipped")}))
        self._last_sent_ts = _now()
