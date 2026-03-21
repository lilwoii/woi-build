from __future__ import annotations
import json
import os
from typing import Any, Dict, List
from datetime import datetime, timezone
import aiosqlite

SNAP_MAX = int(os.getenv("POLY_PNL_SNAPSHOT_MAX_ROWS", "3000"))
STRAT_MAX = int(os.getenv("POLY_PNL_STRATEGY_MAX", "50"))

TABLE_SQL = """CREATE TABLE IF NOT EXISTS woi_poly_pnl_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,
  source TEXT NOT NULL,
  realized REAL NOT NULL,
  unrealized REAL NOT NULL,
  fees REAL NOT NULL,
  by_strategy_json TEXT NOT NULL
);
"""

INSERT_SQL = """INSERT INTO woi_poly_pnl_snapshots (ts_utc, source, realized, unrealized, fees, by_strategy_json)
VALUES (?, ?, ?, ?, ?, ?);
"""

async def ensure(db_path: str) -> None:
    async with aiosqlite.connect(db_path) as db:
        await db.execute(TABLE_SQL)
        await db.commit()

def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def _top_strategies(by_strategy: Dict[str, Any]) -> Dict[str, Any]:
    items = []
    for k, v in (by_strategy or {}).items():
        r = float(v.get("realized_pnl", 0.0))
        u = float(v.get("unrealized_pnl", 0.0))
        f = float(v.get("fees", 0.0))
        t = int(v.get("trades", 0))
        score = abs(r + u) + abs(r) * 0.2
        items.append((score, k, {"realized_pnl": r, "unrealized_pnl": u, "fees": f, "trades": t}))
    items.sort(key=lambda x: x[0], reverse=True)
    return {k: d for _, k, d in items[:STRAT_MAX]}

async def write_snapshot(db_path: str, *, source: str, overall: Dict[str, Any], by_strategy: Dict[str, Any]) -> Dict[str, Any]:
    await ensure(db_path)
    ts = _now_utc()
    realized = float(overall.get("realized_pnl", 0.0))
    unreal = float(overall.get("unrealized_pnl", 0.0))
    fees = float(overall.get("fees", 0.0))
    bys = _top_strategies(by_strategy)
    blob = json.dumps(bys, ensure_ascii=False)

    async with aiosqlite.connect(db_path) as db:
        await db.execute(INSERT_SQL, (ts, source, realized, unreal, fees, blob))
        await db.execute(
            "DELETE FROM woi_poly_pnl_snapshots WHERE id NOT IN (SELECT id FROM woi_poly_pnl_snapshots ORDER BY id DESC LIMIT ?)",
            (SNAP_MAX,),
        )
        await db.commit()

    return {"ts_utc": ts, "source": source, "realized": realized, "unrealized": unreal, "fees": fees, "by_strategy": bys}

async def fetch_timeseries(db_path: str, limit: int = 500) -> List[Dict[str, Any]]:
    await ensure(db_path)
    lim = max(10, min(2000, int(limit)))
    async with aiosqlite.connect(db_path) as db:
        cur = await db.execute(
            "SELECT ts_utc, source, realized, unrealized, fees, by_strategy_json FROM woi_poly_pnl_snapshots ORDER BY id DESC LIMIT ?",
            (lim,),
        )
        rows = await cur.fetchall()
    out = []
    for ts, src, r, u, f, blob in reversed(rows):
        out.append({"ts_utc": ts, "source": src, "realized": float(r), "unrealized": float(u), "fees": float(f), "by_strategy": json.loads(blob or "{}")})
    return out

async def fetch_strategy_curve(db_path: str, strategy: str, limit: int = 500) -> List[Dict[str, Any]]:
    series = await fetch_timeseries(db_path, limit=limit)
    s = (strategy or "").strip()
    out = []
    for row in series:
        bys = row.get("by_strategy") or {}
        v = bys.get(s) or {}
        out.append({
            "ts_utc": row["ts_utc"],
            "realized": float(v.get("realized_pnl", 0.0)),
            "unrealized": float(v.get("unrealized_pnl", 0.0)),
            "fees": float(v.get("fees", 0.0)),
            "trades": int(v.get("trades", 0)),
        })
    return out
