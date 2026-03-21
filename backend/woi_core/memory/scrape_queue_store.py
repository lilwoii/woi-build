from __future__ import annotations
import aiosqlite, os, json
from typing import Any, Dict, List, Optional

SCHEMA_SCRAPE = """
CREATE TABLE IF NOT EXISTS woi_scrape_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  meta_json TEXT NOT NULL
);
"""

class ScrapeQueueStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA_SCRAPE)
            await db.commit()

    async def enqueue(self, ts_utc: str, url: str, meta: Dict[str, Any] | None = None):
        meta = meta or {}
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO woi_scrape_queue (ts_utc, url, status, meta_json) VALUES (?, ?, 'queued', ?)",
                (ts_utc, url, json.dumps(meta, ensure_ascii=False)),
            )
            await db.commit()

    async def list(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT id, ts_utc, url, status, meta_json FROM woi_scrape_queue ORDER BY id DESC LIMIT ?", (limit,))
            rows = await cur.fetchall()
        out = []
        for rid, ts_utc, url, status, meta_json in rows:
            try:
                meta = json.loads(meta_json)
            except Exception:
                meta = {}
            out.append({"id": rid, "ts_utc": ts_utc, "url": url, "status": status, "meta": meta})
        return out

    async def next_batch(self, n: int = 3) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT id, ts_utc, url, status, meta_json FROM woi_scrape_queue WHERE status='queued' ORDER BY id ASC LIMIT ?", (n,))
            rows = await cur.fetchall()
        out = []
        for rid, ts_utc, url, status, meta_json in rows:
            try:
                meta = json.loads(meta_json)
            except Exception:
                meta = {}
            out.append({"id": rid, "ts_utc": ts_utc, "url": url, "status": status, "meta": meta})
        return out

    async def mark_done(self, rid: int):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE woi_scrape_queue SET status='done' WHERE id=?", (rid,))
            await db.commit()

    async def mark_failed(self, rid: int, reason: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE woi_scrape_queue SET status='failed', meta_json=? WHERE id=?", (json.dumps({"error": reason}, ensure_ascii=False), rid))
            await db.commit()
