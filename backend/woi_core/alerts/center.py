from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any, List


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AlertCenter:
    def __init__(self) -> None:
        self.items: List[Dict[str, Any]] = []

    def push(
        self,
        *,
        title: str,
        body: str,
        level: str = "info",
        feature: str = "general",
        desktop_eligible: bool = False,
        sticky: bool = False,
    ) -> Dict[str, Any]:
        item = {
            "alert_id": f"alert-{len(self.items)+1}",
            "title": title,
            "body": body,
            "level": level,
            "feature": feature,
            "desktop_eligible": desktop_eligible,
            "sticky": sticky,
            "read": False,
            "ts_utc": utc_now(),
        }
        self.items.insert(0, item)
        self.items = self.items[:500]
        return {"ok": True, "item": item}

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.items[:100]}

    def unread_count(self) -> Dict[str, Any]:
        count = len([x for x in self.items if not x.get("read")])
        return {"ok": True, "count": count}

    def mark_read(self, alert_id: str) -> Dict[str, Any]:
        for item in self.items:
            if item["alert_id"] == alert_id:
                item["read"] = True
                return {"ok": True, "item": item}
        return {"ok": False, "error": "alert_id not found"}

    def clear_non_sticky(self) -> Dict[str, Any]:
        self.items = [x for x in self.items if x.get("sticky")]
        return {"ok": True, "items": self.items[:100]}