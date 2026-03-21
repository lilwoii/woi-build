from __future__ import annotations
import os
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

RING_SIZE = int(os.getenv("WOI_LOG_RING_SIZE", "1500"))
SNAP_LIMIT = int(os.getenv("WOI_LOG_SNAPSHOT_LIMIT", "250"))

def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def _extract_emoji(tag: str) -> str:
    if not tag:
        return "•"
    return tag.split()[0]

def digest(events: List[Dict[str, Any]], *, include_pnl: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    ev = list(events)[-SNAP_LIMIT:]
    groups: Dict[str, List[Dict[str, Any]]] = {}
    errors = 0
    for e in ev:
        tag = str(e.get("tag",""))
        em = _extract_emoji(tag)
        groups.setdefault(em, []).append(e)
        msg = (str(e.get("message","")) + " " + tag).lower()
        if "error" in msg or "exception" in msg or "traceback" in msg or "failed" in msg:
            errors += 1

    summary = []
    for em, items in sorted(groups.items(), key=lambda kv: len(kv[1]), reverse=True):
        last_ts = items[-1].get("ts_utc")
        summary.append({"emoji": em, "count": len(items), "last_ts_utc": last_ts})

    lines = []
    lines.append(f"📦 **WOI LOG DIGEST**  ({_now_utc()})")
    lines.append(f"• Events captured: **{len(ev)}**  | Groups: **{len(summary)}**  | Errors flagged: **{errors}**")
    lines.append("")
    lines.append("**Top groups**")
    for s in summary[:12]:
        lines.append(f"{s['emoji']}  **{s['count']}**  (last: {s['last_ts_utc']})")

    if include_pnl:
        try:
            o = include_pnl.get("overall") or {}
            rp = float(o.get("realized_pnl", 0.0))
            up = float(o.get("unrealized_pnl", 0.0))
            fees = float(o.get("fees", 0.0))
            emo = "🟩" if (rp+up) > 0 else "🟥" if (rp+up) < 0 else "🟨"
            lines.append("")
            lines.append("**Polymarket PnL (latest)**")
            lines.append(f"{emo} Total: **{(rp+up):.4f}**  | Realized: **{rp:.4f}**  | Unrealized: **{up:.4f}**  | Fees: **{fees:.4f}**")
        except Exception:
            pass

    lines.append("")
    lines.append("**Most recent events**")
    for e in ev[-20:]:
        ts = e.get("ts_utc","")
        tag = e.get("tag","")
        msg = e.get("message","")
        lines.append(f"`{ts}` {tag} — {msg}")

    return {
        "ts_utc": _now_utc(),
        "count": len(ev),
        "groups": summary,
        "errors_flagged": errors,
        "text": "\n".join(lines),
        "items": ev,
    }
