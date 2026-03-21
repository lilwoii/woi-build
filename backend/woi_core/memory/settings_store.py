from __future__ import annotations
import aiosqlite, os, json
from typing import Any, Dict, Optional

SCHEMA_SETTINGS = """
CREATE TABLE IF NOT EXISTS woi_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
"""

class SettingsStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA_SETTINGS)
            await db.commit()

    async def set(self, key: str, value: Dict[str, Any]):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT OR REPLACE INTO woi_settings (key, value_json) VALUES (?, ?)", (key, json.dumps(value, ensure_ascii=False)))
            await db.commit()

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute("SELECT value_json FROM woi_settings WHERE key=?", (key,))
            row = await cur.fetchone()
        if not row:
            return None
        try:
            return json.loads(row[0])
        except Exception:
            return None
