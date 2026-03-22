from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any, List
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class FeedNormalizer:
    def normalize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        title = str(payload.get("title") or payload.get("headline") or "Untitled Event").strip()
        summary = str(payload.get("summary") or payload.get("body") or title).strip()
        source = str(payload.get("source") or "unknown").strip()
        category = str(payload.get("category") or "macro").strip().lower()
        urgency = str(payload.get("urgency") or "medium").strip().lower()
        region = str(payload.get("region") or "Global").strip()
        country = str(payload.get("country") or "").strip()
        lat = float(payload.get("lat") or 0.0)
        lon = float(payload.get("lon") or 0.0)

        linked_symbols = list(payload.get("linked_symbols") or [])
        linked_prediction_markets = list(payload.get("linked_prediction_markets") or [])

        return {
            "event_id": str(payload.get("event_id") or f"ingest-{uuid4().hex[:10]}"),
            "title": title,
            "summary": summary,
            "source": source,
            "category": category,
            "urgency": urgency,
            "region": region,
            "country": country,
            "lat": lat,
            "lon": lon,
            "linked_symbols": linked_symbols,
            "linked_prediction_markets": linked_prediction_markets,
            "ts_utc": str(payload.get("ts_utc") or utc_now()),
        }

    def normalize_many(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self.normalize(x) for x in items]