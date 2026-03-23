from __future__ import annotations

from typing import Dict, Any, List


class LessonLoop:
    def __init__(self) -> None:
        self.lessons: List[Dict[str, Any]] = []

    def promote(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        lesson = {
            "lesson_id": payload.get("lesson_id") or f"lesson-{len(self.lessons)+1}",
            "title": str(payload.get("title") or "WOI lesson"),
            "rule": str(payload.get("rule") or ""),
            "symbol": str(payload.get("symbol") or "").upper(),
            "regime": str(payload.get("regime") or ""),
            "confidence": float(payload.get("confidence") or 0.6),
            "win_rate_hint": float(payload.get("win_rate_hint") or 0.0),
            "decay_score": float(payload.get("decay_score") or 0.0),
        }
        self.lessons.insert(0, lesson)
        self.lessons = self.lessons[:300]
        return {"ok": True, "item": lesson}

    def decay(self) -> Dict[str, Any]:
        for lesson in self.lessons:
            lesson["decay_score"] = round(min(1.0, float(lesson.get("decay_score", 0.0)) + 0.05), 3)
            lesson["confidence"] = round(max(0.0, float(lesson.get("confidence", 0.0)) - 0.01), 3)
        return {"ok": True, "items": self.lessons[:100]}

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.lessons[:100]}