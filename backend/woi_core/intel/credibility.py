from __future__ import annotations

from typing import Dict, Any


class SourceCredibility:
    SOURCE_SCORES = {
        "reuters": 0.95,
        "ap": 0.95,
        "bloomberg": 0.94,
        "wsj": 0.92,
        "ft": 0.92,
        "official": 0.96,
        "polymarket": 0.84,
        "x": 0.55,
        "telegram": 0.45,
        "unknown": 0.50,
    }

    def score(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        source = str(payload.get("source") or "unknown").strip().lower()
        urgency = str(payload.get("urgency") or "medium").strip().lower()

        source_score = float(self.SOURCE_SCORES.get(source, 0.50))
        urgency_bonus = {
            "low": 0.00,
            "medium": 0.03,
            "high": 0.06,
            "critical": 0.08,
        }.get(urgency, 0.03)

        final_score = max(0.0, min(1.0, source_score + urgency_bonus))
        return {
            "ok": True,
            "source": source,
            "credibility_score": round(final_score, 3),
        }