from __future__ import annotations
import aiosqlite, os, json
from typing import Any, Dict, List

SCHEMA_WATCHLIST = """
CREATE TABLE IF NOT EXISTS woi_watchlist (
  symbol TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  added_utc TEXT NOT NULL,
  meta_json TEXT NOT NULL
);
"""

class WatchlistStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA_WATCHLIST)
            await db.commit()

    async def list(self) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT symbol, kind, added_utc, meta_json FROM woi_watchlist ORDER BY added_utc DESC")
            rows = await cur.fetchall()
        out = []
        for symbol, kind, added_utc, meta_json in rows:
            try:
                meta = json.loads(meta_json)
            except Exception:
                meta = {}
            out.append({"symbol": symbol, "kind": kind, "added_utc": added_utc, "meta": meta})
        return out

    async def add(self, symbol: str, kind: str, added_utc: str, meta: Dict[str, Any] | None = None):
        meta = meta or {}
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO woi_watchlist (symbol, kind, added_utc, meta_json) VALUES (?, ?, ?, ?)",
                (symbol.upper().strip(), kind, added_utc, json.dumps(meta, ensure_ascii=False)),
            )
            await db.commit()

    async def remove(self, symbol: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM woi_watchlist WHERE symbol = ?", (symbol.upper().strip(),))
            await db.commit()
