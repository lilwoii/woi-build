from __future__ import annotations

from typing import Dict, Any, List

from woi_core.assistant.intent_parser import parse_user_message
from woi_core.assistant.strategy_extractor import extract_strategy_from_text
from woi_core.assistant.rulebook import WOIRuleBook


class WOIChatEngine:
    def __init__(self, runtime=None) -> None:
        self.runtime = runtime
        self.rulebook = WOIRuleBook()
        self.chat_log: List[Dict[str, Any]] = []

    def reply(self, text: str) -> Dict[str, Any]:
        parsed = parse_user_message(text)
        actions_taken: List[str] = []
        structured: Dict[str, Any] = {}

        response = self._default_reply(text)

        if "save_rule" in parsed["actions"]:
            title = f"Rule from chat"
            saved = self.rulebook.add({
                "title": title,
                "body": text,
                "category": "chat-derived",
                "symbol": parsed.get("symbol") or "",
                "priority": 7,
            })
            actions_taken.append("rule_saved")
            structured["rule"] = saved["item"]
            response = "📘 Got it — I saved that as a WOI rule and will factor it into future decisions."

        if "extract_strategy" in parsed["actions"]:
            strategy = extract_strategy_from_text(text, symbol_hint=parsed.get("symbol") or "")
            structured["strategy"] = strategy
            actions_taken.append("strategy_extracted")
            response = (
                f"🧪 I extracted a strategy idea for {strategy['symbol']} "
                f"and prepared it for lifecycle tracking."
            )

        if "save_memory" in parsed["actions"]:
            actions_taken.append("memory_flagged")
            response += " 🧠 I also flagged this as memory-worthy."

        if "route_shadow" in parsed["actions"]:
            actions_taken.append("shadow_requested")
            response += " 👻 I’ll treat this as a shadow-mode candidate."

        if "voice_response" in parsed["actions"]:
            actions_taken.append("voice_ready")

        chat_item = {
            "user_text": text,
            "parsed": parsed,
            "response_text": response,
            "actions_taken": actions_taken,
            "structured": structured,
        }
        self.chat_log.insert(0, chat_item)
        self.chat_log = self.chat_log[:200]

        return {
            "ok": True,
            "reply_text": response,
            "parsed": parsed,
            "actions_taken": actions_taken,
            "structured": structured,
            "voice": {
                "speakable_text": response,
                "emotion": "focused",
                "voice_style": "confident",
            },
        }

    def _default_reply(self, text: str) -> str:
        lower = (text or "").lower()

        if any(x in lower for x in ["hello", "hey", "what's up", "whats up"]):
            return "🧠 Hey — WOI is online. I’m tracking markets, world events, strategy candidates, and your active rules."

        if any(x in lower for x in ["market", "today", "outlook"]):
            return "📈 I can help with market outlook, event risk, trade ideas, and what matters most right now."

        if any(x in lower for x in ["who are you", "what are you"]):
            return "🧠 I’m WOI — your conversational AI trading and intelligence system, built to think, remember, monitor, and act with guardrails."

        return "🧠 I’m with you. I can talk freely, save rules, extract strategies, route ideas to shadow mode, and remember what matters."