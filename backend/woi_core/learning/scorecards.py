from __future__ import annotations
import aiosqlite, os
from typing import Any, Dict, List

SCHEMA = """
CREATE TABLE IF NOT EXISTS woi_strategy_scorecards (
  strategy TEXT PRIMARY KEY,
  trades INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  pnl_est REAL NOT NULL,
  ucb_value REAL NOT NULL
);
"""

class StrategyScorecards:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    async def _ensure(self, strategy: str):
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT strategy FROM woi_strategy_scorecards WHERE strategy=?", (strategy,))
            row = await cur.fetchone()
            if not row:
                await db.execute(
                    "INSERT INTO woi_strategy_scorecards (strategy, trades, wins, losses, pnl_est, ucb_value) VALUES (?, 0, 0, 0, 0.0, 0.0)",
                    (strategy,),
                )
                await db.commit()

    async def record_trade(self, strategy: str, ok: bool, pnl_est: float):
        await self._ensure(strategy)
        async with aiosqlite.connect(self.db_path) as db:
            if ok:
                await db.execute("UPDATE woi_strategy_scorecards SET trades=trades+1, wins=wins+1, pnl_est=pnl_est+? WHERE strategy=?", (pnl_est, strategy))
            else:
                await db.execute("UPDATE woi_strategy_scorecards SET trades=trades+1, losses=losses+1, pnl_est=pnl_est+? WHERE strategy=?", (pnl_est, strategy))
            await db.commit()

    async def list(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT strategy, trades, wins, losses, pnl_est, ucb_value FROM woi_strategy_scorecards ORDER BY pnl_est DESC LIMIT ?", (limit,))
            rows = await cur.fetchall()
        out = []
        for s, t, w, l, pnl, ucb in rows:
            out.append({"strategy": s, "trades": t, "wins": w, "losses": l, "pnl_est": pnl, "ucb_value": ucb})
        return out

    async def set_ucb(self, strategy: str, ucb_value: float):
        await self._ensure(strategy)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE woi_strategy_scorecards SET ucb_value=? WHERE strategy=?", (ucb_value, strategy))
            await db.commit()

    async def get(self, strategy: str) -> Dict[str, Any] | None:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT strategy, trades, wins, losses, pnl_est, ucb_value FROM woi_strategy_scorecards WHERE strategy=?", (strategy,))
            row = await cur.fetchone()
        if not row:
            return None
        s, t, w, l, pnl, ucb = row
        return {"strategy": s, "trades": t, "wins": w, "losses": l, "pnl_est": pnl, "ucb_value": ucb}
