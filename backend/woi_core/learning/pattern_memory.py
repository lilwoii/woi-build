from __future__ import annotations

from typing import Dict, Any, List


class PatternMemory:
    def __init__(self) -> None:
        self.patterns: List[Dict[str, Any]] = []

    def observe(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pattern = {
            "pattern_id": payload.get("pattern_id") or f"pattern-{len(self.patterns)+1}",
            "name": str(payload.get("name") or "unnamed-pattern"),
            "symbol": str(payload.get("symbol") or "").upper(),
            "regime": str(payload.get("regime") or ""),
            "outcome": str(payload.get("outcome") or ""),
            "score": float(payload.get("score") or 0.5),
            "notes": str(payload.get("notes") or ""),
            "count": int(payload.get("count") or 1),
        }
        self.patterns.insert(0, pattern)
        self.patterns = self.patterns[:500]
        return {"ok": True, "item": pattern}

    def recurring(self) -> Dict[str, Any]:
        tally: Dict[str, int] = {}
        for item in self.patterns:
            tally[item["name"]] = tally.get(item["name"], 0) + 1
        ranked = sorted(tally.items(), key=lambda x: x[1], reverse=True)
        return {
            "ok": True,
            "items": [{"name": name, "count": count} for name, count in ranked[:20]],
        }