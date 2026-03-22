from __future__ import annotations

from typing import Dict, Any, List


class PromotionRouter:
    def classify(self, item: Dict[str, Any]) -> Dict[str, Any]:
        text = f"{item.get('title', '')} {item.get('summary', '')}".lower()
        category = str(item.get("category") or "").lower()
        urgency = str(item.get("urgency") or "").lower()
        credibility = float(item.get("credibility_score") or 0.0)

        promote_memory = credibility >= 0.62
        promote_strategy = False
        route_discord = urgency in {"high", "critical"}

        if any(k in text for k in ["setup", "breakout", "entry", "trade", "long", "short"]):
            promote_strategy = True

        if category in {"economy", "macro", "geopolitics", "crypto", "earnings"} and credibility >= 0.72:
            promote_memory = True

        return {
            "ok": True,
            "promote_memory": promote_memory,
            "promote_strategy": promote_strategy,
            "route_discord": route_discord,
            "promotion_tags": self._tags(item),
        }

    def _tags(self, item: Dict[str, Any]) -> List[str]:
        tags = [str(item.get("category") or "general")]
        if item.get("region"):
            tags.append(str(item["region"]).lower().replace(" ", "-"))
        for sym in (item.get("linked_symbols") or [])[:4]:
            tags.append(str(sym).lower())
        return list(dict.fromkeys(tags))