from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any, List


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class StrategyCandidateStore:
    def __init__(self) -> None:
        self.items: List[Dict[str, Any]] = []

    def add(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        item = {
            "candidate_id": payload.get("candidate_id") or f"candidate-{len(self.items)+1}",
            "title": str(payload.get("title") or "WOI Strategy Candidate"),
            "summary": str(payload.get("summary") or ""),
            "category": str(payload.get("category") or "general"),
            "linked_symbols": list(payload.get("linked_symbols") or []),
            "linked_prediction_markets": list(payload.get("linked_prediction_markets") or []),
            "confidence": float(payload.get("confidence") or 0.55),
            "source": str(payload.get("source") or "ingestion"),
            "ts_utc": payload.get("ts_utc") or utc_now(),
            "status": str(payload.get("status") or "candidate"),
        }
        self.items.insert(0, item)
        self.items = self.items[:300]
        return {"ok": True, "item": item}

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.items[:100]}