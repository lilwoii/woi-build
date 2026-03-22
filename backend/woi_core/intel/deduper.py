from __future__ import annotations

from typing import Dict, Any, List, Set


class EventDeduper:
    def __init__(self) -> None:
        self.seen_keys: Set[str] = set()

    def _key(self, item: Dict[str, Any]) -> str:
        title = str(item.get("title") or "").strip().lower()
        category = str(item.get("category") or "").strip().lower()
        region = str(item.get("region") or "").strip().lower()
        return f"{title}|{category}|{region}"

    def unique(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        out = []
        dropped = 0

        for item in items:
            key = self._key(item)
            if key in self.seen_keys:
                dropped += 1
                continue
            self.seen_keys.add(key)
            out.append(item)

        return {"ok": True, "items": out, "dropped": dropped}