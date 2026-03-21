from __future__ import annotations
import asyncio
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()

LEVEL_COLORS = {
    "DEBUG": 0x95A5A6,  # gray
    "INFO":  0x2ECC71,  # green
    "WARN":  0xF1C40F,  # yellow
    "ERROR": 0xE74C3C,  # red
}

LEVEL_EMOJI = {
    "DEBUG": "🟦",
    "INFO": "🟩",
    "WARN": "🟨",
    "ERROR": "🟥",
}

@dataclass
class WoiEvent:
    type: str
    message: str
    data: Dict[str, Any]
    level: str = "INFO"
    ts_utc: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ts_utc": self.ts_utc or utc_now(),
            "level": self.level,
            "type": self.type,
            "message": self.message,
            "data": self.data,
        }

class EventBus:
    def __init__(self, log_dir: str, discord_webhook_url: Optional[str], discord_level: str = "INFO"):
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        self.discord_webhook_url = discord_webhook_url
        self.discord_level = discord_level
        self._q: asyncio.Queue[WoiEvent] = asyncio.Queue()
        self._task: Optional[asyncio.Task] = None
        self._client: Optional[httpx.AsyncClient] = None

    def start(self):
        if self._task and not self._task.done():
            return
        self._client = httpx.AsyncClient(timeout=8.0)
        self._task = asyncio.create_task(self._worker(), name="woi_event_bus")

    async def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except Exception:
                pass
        if self._client:
            await self._client.aclose()
        self._client = None

    def _level_rank(self, lvl: str) -> int:
        order = ["DEBUG", "INFO", "WARN", "ERROR"]
        try:
            return order.index(lvl)
        except ValueError:
            return 1

    async def emit(self, ev: WoiEvent):
        if not ev.ts_utc:
            ev.ts_utc = utc_now()
        await self._q.put(ev)

    async def _worker(self):
        while True:
            ev = await self._q.get()
            try:
                await self._write_jsonl(ev)
                await self._send_discord(ev)
            finally:
                self._q.task_done()

    async def _write_jsonl(self, ev: WoiEvent):
        path = os.path.join(self.log_dir, "woi_events.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ev.to_dict(), ensure_ascii=False) + "\n")

    async def _send_discord(self, ev: WoiEvent):
        if not self.discord_webhook_url:
            return
        # Respect min log level
        if self._level_rank(ev.level) < self._level_rank(self.discord_level):
            return
        if not self._client:
            return

        emoji = LEVEL_EMOJI.get(ev.level, "🟩")
        color = LEVEL_COLORS.get(ev.level, 0x2ECC71)

        # Discord embed (color-coded)
        # Keep fields compact so logs stay readable.
        fields = []
        for k, v in (ev.data or {}).items():
            try:
                s = json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)
            except Exception:
                s = str(v)
            s = s[:900]
            fields.append({"name": k[:256], "value": s or " ", "inline": False})
            if len(fields) >= 8:
                break

        payload = {
            "username": "WOI",
            "embeds": [{
                "title": f"{emoji} {ev.type}",
                "description": ev.message[:1800],
                "color": color,
                "timestamp": ev.ts_utc,
                "fields": fields,
                "footer": {"text": f"level={ev.level}"},
            }]
        }

        try:
            await self._client.post(self.discord_webhook_url, json=payload)
        except Exception:
            # Never crash on webhook issues
            return
