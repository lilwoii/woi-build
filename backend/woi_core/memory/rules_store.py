from __future__ import annotations
import aiosqlite, os, json
from typing import Any, Dict, Optional, List

SCHEMA_RULES = """
CREATE TABLE IF NOT EXISTS woi_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,
  rule TEXT NOT NULL,
  status TEXT NOT NULL,
  meta_json TEXT NOT NULL
);
"""

class RulesStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA_RULES)
            await db.commit()

    async def set_rule(self, ts_utc: str, rule: str, status: str = "active", meta: Dict[str, Any] | None = None):
        meta = meta or {}
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO woi_rules (ts_utc, rule, status, meta_json) VALUES (?, ?, ?, ?)",
                (ts_utc, rule, status, json.dumps(meta, ensure_ascii=False)),
            )
            await db.commit()

    async def clear_active(self, ts_utc: str):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE woi_rules SET status='inactive' WHERE status='active'")
            await db.commit()

    async def get_active(self) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT id, ts_utc, rule, status, meta_json FROM woi_rules WHERE status='active' ORDER BY id DESC LIMIT 1")
            row = await cur.fetchone()
        if not row:
            return None
        rid, ts_utc, rule, status, meta_json = row
        try:
            meta = json.loads(meta_json)
        except Exception:
            meta = {}
        return {"id": rid, "ts_utc": ts_utc, "rule": rule, "status": status, "meta": meta}

    async def list_recent(self, limit: int = 25) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT id, ts_utc, rule, status, meta_json FROM woi_rules ORDER BY id DESC LIMIT ?", (limit,))
            rows = await cur.fetchall()
        out = []
        for rid, ts_utc, rule, status, meta_json in rows:
            try:
                meta = json.loads(meta_json)
            except Exception:
                meta = {}
            out.append({"id": rid, "ts_utc": ts_utc, "rule": rule, "status": status, "meta": meta})
        return out
