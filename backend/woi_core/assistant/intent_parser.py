from __future__ import annotations

import re
from typing import Dict, Any, List


STRATEGY_HINTS = [
    "strategy", "setup", "entry", "exit", "buy", "sell", "long", "short",
    "shadow", "paper", "trade this", "thesis", "stop loss", "take profit"
]

RULE_HINTS = [
    "rule", "always", "never", "only if", "must", "do not", "dont", "avoid"
]

MEMORY_HINTS = [
    "remember", "note this", "save this", "learn this", "keep this in mind"
]


def _contains_any(text: str, words: List[str]) -> bool:
    t = text.lower()
    return any(w in t for w in words)


def infer_symbol(text: str) -> str:
    candidates = re.findall(r"\b[A-Z]{2,5}\b", text)
    if candidates:
        return candidates[0]
    lowered = text.lower()
    mapping = {
        "bitcoin": "BTC",
        "ethereum": "ETH",
        "nasdaq": "QQQ",
        "spy": "SPY",
        "tesla": "TSLA",
        "nvidia": "NVDA",
        "amd": "AMD",
    }
    for k, v in mapping.items():
        if k in lowered:
            return v
    return ""


def parse_user_message(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()
    lowered = raw.lower()

    intent = "chat"
    actions: List[str] = []

    if _contains_any(lowered, STRATEGY_HINTS):
        intent = "strategy"
        actions.append("extract_strategy")

    if _contains_any(lowered, RULE_HINTS):
        if intent == "chat":
            intent = "rule"
        actions.append("save_rule")

    if _contains_any(lowered, MEMORY_HINTS):
        actions.append("save_memory")

    if "shadow" in lowered:
        actions.append("route_shadow")

    if "promote" in lowered:
        actions.append("promote_strategy")

    if "pause" in lowered:
        actions.append("pause_strategy")

    if "kill" in lowered or "stop trading" in lowered:
        actions.append("risk_lockdown")

    if "speak" in lowered or "voice" in lowered or "talk back" in lowered:
        actions.append("voice_response")

    return {
        "intent": intent,
        "actions": list(dict.fromkeys(actions)),
        "symbol": infer_symbol(raw),
        "raw_text": raw,
    }