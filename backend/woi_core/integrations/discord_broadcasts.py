from __future__ import annotations

import os
from typing import Dict, Any, List
import requests


class DiscordBroadcasts:
    def __init__(self) -> None:
        self.webhook_url = os.getenv("DISCORD_WEBHOOK_URL", "").strip()
        self.buffer: List[Dict[str, Any]] = []

    def emit(self, title: str, body: str, level: str = "info", fields: List[Dict[str, str]] | None = None) -> Dict[str, Any]:
        event = {
            "title": title,
            "body": body,
            "level": level,
            "fields": fields or [],
        }
        self.buffer.insert(0, event)
        self.buffer = self.buffer[:100]

        if not self.webhook_url:
            return {"ok": True, "sent": False, "reason": "webhook missing", "event": event}

        color_map = {
            "info": 3447003,
            "warn": 16763904,
            "error": 15158332,
            "success": 5763719,
        }

        payload = {
            "embeds": [
                {
                    "title": title,
                    "description": body,
                    "color": color_map.get(level, 3447003),
                    "fields": [{"name": f.get("name", "Field"), "value": f.get("value", "-"), "inline": True} for f in (fields or [])],
                }
            ]
        }

        try:
            res = requests.post(self.webhook_url, json=payload, timeout=12)
            return {"ok": res.ok, "sent": res.ok, "status_code": res.status_code, "event": event}
        except Exception as e:
            return {"ok": False, "sent": False, "reason": str(e), "event": event}

    def recent(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.buffer[:30]}