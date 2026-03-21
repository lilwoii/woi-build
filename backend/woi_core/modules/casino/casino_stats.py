from __future__ import annotations
import os, json, time
from typing import Any, Dict

def _path() -> str:
    return os.getenv("WOI_CASINO_STATS_PATH", "./_woi_state/casino_stats.json")

def _ensure():
    p = _path()
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    if not os.path.exists(p):
        with open(p, "w", encoding="utf-8") as f:
            json.dump({"blackjack": {}, "roulette": {}, "updated_utc": ""}, f, indent=2)

def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def load() -> Dict[str, Any]:
    _ensure()
    try:
        with open(_path(), "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {"blackjack": {}, "roulette": {}, "updated_utc": ""}

def save(data: Dict[str, Any]) -> None:
    _ensure()
    data["updated_utc"] = _now()
    with open(_path(), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def update_blackjack(result: str, bet: float, delta: float) -> Dict[str, Any]:
    data = load()
    bj = data.get("blackjack", {}) or {}
    bj["hands"] = int(bj.get("hands", 0)) + 1
    bj["wins"] = int(bj.get("wins", 0)) + (1 if result == "win" else 0)
    bj["losses"] = int(bj.get("losses", 0)) + (1 if result == "lose" else 0)
    bj["pushes"] = int(bj.get("pushes", 0)) + (1 if result == "push" else 0)
    bj["net"] = float(bj.get("net", 0.0)) + float(delta)
    bj["ev_per_hand"] = (bj["net"] / max(1, bj["hands"]))
    bj["win_rate"] = (bj["wins"] / max(1, (bj["wins"] + bj["losses"])))
    prev = bj.get("streak", {"kind": "", "len": 0}) or {"kind":"", "len":0}
    if prev.get("kind") == result:
        prev["len"] = int(prev.get("len", 0)) + 1
    else:
        prev = {"kind": result, "len": 1}
    bj["streak"] = prev
    data["blackjack"] = bj
    save(data)
    return bj

def update_roulette(win: bool, bet: float, delta: float, bet_type: str) -> Dict[str, Any]:
    data = load()
    ro = data.get("roulette", {}) or {}
    ro["spins"] = int(ro.get("spins", 0)) + 1
    ro["wins"] = int(ro.get("wins", 0)) + (1 if win else 0)
    ro["losses"] = int(ro.get("losses", 0)) + (0 if win else 1)
    ro["net"] = float(ro.get("net", 0.0)) + float(delta)
    ro["ev_per_spin"] = (ro["net"] / max(1, ro["spins"]))
    ro["win_rate"] = (ro["wins"] / max(1, ro["spins"]))
    ro["last_bet_type"] = bet_type
    data["roulette"] = ro
    save(data)
    return ro
