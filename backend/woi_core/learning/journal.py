from __future__ import annotations
import aiosqlite, os, json
from typing import Any, Dict, Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS woi_trade_journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,
  venue TEXT NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  price REAL NOT NULL,
  size REAL NOT NULL,
  result_json TEXT NOT NULL
);
"""

class TradeJournal:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    async def record(self, ts_utc: str, venue: str, strategy: str, symbol: str, side: str, price: float, size: float, result: Dict[str, Any]):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO woi_trade_journal (ts_utc, venue, strategy, symbol, side, price, size, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (ts_utc, venue, strategy, symbol, side, price, size, json.dumps(result, ensure_ascii=False)),
            )
            await db.commit()
