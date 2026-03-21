from __future__ import annotations
import os, time
from typing import Any, Dict, List, Optional, Tuple

_MAX = int(os.getenv("WOI_GLOBE_RING_MAX", "1500"))
_RING: List[Dict[str, Any]] = []

def now_utc() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def _parse_ts(ts: str) -> float:
    # ts_utc: YYYY-MM-DDTHH:MM:SSZ
    try:
        # very small parser to epoch
        import datetime as _dt
        return _dt.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=_dt.timezone.utc).timestamp()
    except Exception:
        return time.time()

def push(evt: Dict[str, Any]) -> Dict[str, Any]:
    evt = evt or {}
    evt.setdefault("ts_utc", now_utc())
    _RING.append(evt)
    if len(_RING) > _MAX:
        del _RING[: max(1, len(_RING) - _MAX)]
    return evt

def list_events(limit: int=300, type: Optional[str]=None) -> List[Dict[str, Any]]:
    items = _RING
    if type:
        t = str(type).lower().strip()
        items = [e for e in items if str(e.get("type","")).lower().strip()==t]
    return items[-limit:]

def clear() -> None:
    _RING.clear()

def tension_24h() -> Dict[str, Any]:
    # Rolling 24h tension index based on severity weights
    now = time.time()
    cutoff = now - 24*3600
    weights = {"low": 1.0, "high": 3.0, "critical": 6.0}
    counts = {"low": 0, "high": 0, "critical": 0}
    score = 0.0
    for e in _RING:
        ts = _parse_ts(str(e.get("ts_utc","")))
        if ts < cutoff:
            continue
        sev = str(e.get("severity","low")).lower().strip()
        if sev not in counts: 
            sev = "low"
        counts[sev] += 1
        score += weights.get(sev, 1.0)
    # Normalize to 0-100-ish with a soft cap
    norm = min(100.0, score)
    label = "low" if norm < 25 else "elevated" if norm < 50 else "high" if norm < 75 else "severe"
    return {"score": round(norm, 1), "label": label, "counts": counts}

def volume_rollup(limit: int=800) -> Dict[str, Any]:
    # Best-effort: group by country/state label in event.meta.region or event.location
    out = {}
    items = _RING[-limit:]
    for e in items:
        meta = e.get("meta") or {}
        vol = meta.get("volume") or meta.get("usd") or meta.get("notional") or 1
        try:
            vol = float(vol)
        except Exception:
            vol = 1.0
        region = meta.get("region") or e.get("location") or meta.get("country") or meta.get("state")
        if not region:
            continue
        key = str(region).strip()
        out[key] = out.get(key, 0.0) + vol
    return {"by_region": out}
