from __future__ import annotations
import aiosqlite, os
from typing import Any, Dict, List, Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS woi_sentiment_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL
);
"""

class SentimentQueue:
    def __init__(self, db_path: str, enabled: bool = True):
        self.db_path = db_path
        self.enabled = enabled
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.max_per_cycle = int(os.getenv("SENTIMENT_MAX_PER_CYCLE","5"))

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    async def enqueue(self, ts_utc: str, url: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT INTO woi_sentiment_queue (ts_utc, url, status) VALUES (?, ?, 'queued')", (ts_utc, url))
            await db.commit()

    async def list(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT id, ts_utc, url, status FROM woi_sentiment_queue ORDER BY id DESC LIMIT ?", (limit,))
            rows = await cur.fetchall()
        return [{"id": r[0], "ts_utc": r[1], "url": r[2], "status": r[3]} for r in rows]

    async def sample(self) -> Dict[str, Any]:
        if not self.enabled:
            return {"enabled": False}
        # Return a single queued URL as a stub signal.
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT id, url FROM woi_sentiment_queue WHERE status='queued' ORDER BY id ASC LIMIT 1")
            row = await cur.fetchone()
            if not row:
                return {"enabled": True, "top_url": None}
            rid, url = row
            await db.execute("UPDATE woi_sentiment_queue SET status='used' WHERE id=?", (rid,))
            await db.commit()
        return {"enabled": True, "top_url": url}
