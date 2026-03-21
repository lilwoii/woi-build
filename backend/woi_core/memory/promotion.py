from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Dict, List, Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class RawMemory:
    memory_id: str
    text: str
    tags: List[str]
    symbol: str = ""
    regime: str = ""
    outcome: str = ""
    confidence: float = 0.50
    created_at: str = field(default_factory=utc_now)


@dataclass
class PromotedLesson:
    lesson_id: str
    title: str
    rule: str
    tags: List[str]
    symbol: str = ""
    regime: str = ""
    win_rate_hint: float = 0.0
    confidence: float = 0.55
    created_at: str = field(default_factory=utc_now)


class MemoryPromotionEngine:
    def __init__(self) -> None:
        self.raw: List[RawMemory] = []
        self.promoted: List[PromotedLesson] = []

    def add_raw(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        item = RawMemory(
            memory_id=str(payload.get("memory_id") or f"mem-{len(self.raw)+1}"),
            text=str(payload.get("text") or "").strip(),
            tags=list(payload.get("tags") or []),
            symbol=str(payload.get("symbol") or "").upper(),
            regime=str(payload.get("regime") or ""),
            outcome=str(payload.get("outcome") or ""),
            confidence=float(payload.get("confidence") or 0.50),
        )
        if not item.text:
            raise ValueError("text is required")
        self.raw.insert(0, item)
        self.raw = self.raw[:500]
        return {"ok": True, "item": asdict(item)}

    def promote(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        lesson = PromotedLesson(
            lesson_id=str(payload.get("lesson_id") or f"lesson-{len(self.promoted)+1}"),
            title=str(payload.get("title") or "WOI promoted lesson"),
            rule=str(payload.get("rule") or "").strip(),
            tags=list(payload.get("tags") or []),
            symbol=str(payload.get("symbol") or "").upper(),
            regime=str(payload.get("regime") or ""),
            win_rate_hint=float(payload.get("win_rate_hint") or 0.0),
            confidence=float(payload.get("confidence") or 0.60),
        )
        if not lesson.rule:
            raise ValueError("rule is required")
        self.promoted.insert(0, lesson)
        self.promoted = self.promoted[:200]
        return {"ok": True, "item": asdict(lesson)}

    def similar(self, symbol: str = "", regime: str = "", tags: List[str] | None = None) -> Dict[str, Any]:
        tags = tags or []
        scored = []
        for item in self.promoted:
            score = 0
            if symbol and item.symbol == symbol.upper():
                score += 3
            if regime and item.regime == regime:
                score += 2
            if tags:
                score += len(set(tags).intersection(set(item.tags)))
            if score > 0:
                scored.append((score, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return {"ok": True, "items": [asdict(x[1]) for x in scored[:20]]}

    def digest(self) -> Dict[str, Any]:
        top_tags: Dict[str, int] = {}
        for item in self.raw:
            for tag in item.tags:
                top_tags[tag] = top_tags.get(tag, 0) + 1
        top_tags_sorted = sorted(top_tags.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "ok": True,
            "raw_count": len(self.raw),
            "promoted_count": len(self.promoted),
            "top_tags": [{"tag": k, "count": v} for k, v in top_tags_sorted],
            "latest_raw": [asdict(x) for x in self.raw[:10]],
            "latest_promoted": [asdict(x) for x in self.promoted[:10]],
        }