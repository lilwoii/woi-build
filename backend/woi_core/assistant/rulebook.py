from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Dict, Any, List


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class WOIRule:
    rule_id: str
    title: str
    body: str
    category: str = "general"
    symbol: str = ""
    priority: int = 5
    active: bool = True
    created_at: str = field(default_factory=utc_now)


class WOIRuleBook:
    def __init__(self) -> None:
        self.rules: List[WOIRule] = [
            WOIRule(
                rule_id="core-risk-1",
                title="Respect kill switch",
                body="Never continue live execution after the risk auto-kill switch trips.",
                category="risk",
                priority=10,
            ),
            WOIRule(
                rule_id="core-shadow-1",
                title="Shadow first for new ideas",
                body="New discretionary strategy ideas should begin in shadow mode before guarded live promotion.",
                category="strategy",
                priority=9,
            ),
        ]

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": [asdict(x) for x in self.rules]}

    def add(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        item = WOIRule(
            rule_id=str(payload.get("rule_id") or f"rule-{len(self.rules)+1}"),
            title=str(payload.get("title") or "WOI rule"),
            body=str(payload.get("body") or "").strip(),
            category=str(payload.get("category") or "general"),
            symbol=str(payload.get("symbol") or "").upper(),
            priority=int(payload.get("priority") or 5),
            active=bool(payload.get("active", True)),
        )
        if not item.body:
            raise ValueError("body is required")
        self.rules.insert(0, item)
        self.rules = self.rules[:300]
        return {"ok": True, "item": asdict(item)}