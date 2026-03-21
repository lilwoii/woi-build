from __future__ import annotations
import os, json
from typing import Any, Dict
import aiosqlite

SCHEMA_SQL = 'PRAGMA journal_mode=WAL;\nCREATE TABLE IF NOT EXISTS woi_events (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  ts_utc TEXT NOT NULL,\n  type TEXT NOT NULL,\n  level TEXT NOT NULL,\n  message TEXT NOT NULL,\n  payload_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS woi_notes (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  ts_utc TEXT NOT NULL,\n  kind TEXT NOT NULL,\n  text TEXT NOT NULL,\n  meta_json TEXT NOT NULL\n);\n'

class StructuredMemoryStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA_SQL)
            await db.commit()

    async def add_event(self, ts_utc: str, type: str, level: str, message: str, payload: Dict[str, Any]):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO woi_events (ts_utc, type, level, message, payload_json) VALUES (?, ?, ?, ?, ?)",
                (ts_utc, type, level, message, json.dumps(payload, ensure_ascii=False)),
            )
            await db.commit()

    async def add_note(self, ts_utc: str, kind: str, text: str, meta: Dict[str, Any] | None = None):
        meta = meta or {}
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO woi_notes (ts_utc, kind, text, meta_json) VALUES (?, ?, ?, ?)",
                (ts_utc, kind, text, json.dumps(meta, ensure_ascii=False)),
            )
            await db.commit()
