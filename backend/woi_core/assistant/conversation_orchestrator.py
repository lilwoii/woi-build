from __future__ import annotations

from typing import Dict, Any, List

from woi_core.assistant.chat_engine import WOIChatEngine
from woi_core.assistant.ollama_bridge import OllamaBridge
from woi_core.assistant.session_store import ConversationSessionStore
from woi_core.memory.promotion import MemoryPromotionEngine
from woi_core.strategy.lifecycle import StrategyLifecycleStore
from woi_core.strategy.shadow_book import ShadowBook


SYSTEM_PROMPT = """
You are WOI, a full conversational AI operating intelligence.
You can discuss any topic naturally, but your specialty is:
- markets
- world events
- strategy design
- prediction markets
- risk and discipline
- memory and learning

Rules:
- be concise, useful, and direct
- when the user gives a trading rule or strategy, acknowledge it clearly
- do not pretend to be truly conscious or sentient
- personality should feel confident, tactical, focused, and emotionally aware
- preserve continuity across the conversation
- if the user asks for strategy routing, mention shadow mode first unless explicitly overridden
""".strip()


class WOIConversationOrchestrator:
    def __init__(self) -> None:
        self.chat_engine = WOIChatEngine()
        self.ollama = OllamaBridge()
        self.sessions = ConversationSessionStore()
        self.memory = MemoryPromotionEngine()
        self.lifecycle = StrategyLifecycleStore()
        self.shadow = ShadowBook()

    def converse(self, text: str, session_id: str | None = None) -> Dict[str, Any]:
        session = self.sessions.ensure(session_id=session_id, title="WOI Conversation")
        parsed = self.chat_engine.reply(text)

        self.sessions.append(session.session_id, "user", text)

        local_reply = parsed.get("reply_text", "")
        actions = set(parsed.get("actions_taken") or [])
        structured = parsed.get("structured") or {}

        history = self.sessions.history_for_model(session.session_id)
        prompt_tail = f"""
WOI local parser findings:
- actions: {list(actions)}
- structured: {structured}
- local_reply_hint: {local_reply}
Respond naturally to the user. Preserve WOI personality.
""".strip()

        llm = self.ollama.chat(
            system_prompt=SYSTEM_PROMPT,
            user_text=f"{text}\n\n{prompt_tail}",
            history=history,
            temperature=0.45,
        )

        reply_text = llm["text"] if llm.get("ok") else local_reply

        if "memory_flagged" in actions:
            self.memory.add_raw({
                "text": text,
                "tags": ["chat", "user-directive", "conversation"],
                "symbol": structured.get("strategy", {}).get("symbol", ""),
                "regime": "conversation",
                "outcome": "",
                "confidence": 0.64,
            })

        if "strategy_extracted" in actions:
            strategy = structured["strategy"]
            strategy_id = strategy["name"].lower().replace(" ", "-")
            self.lifecycle.upsert({
                "strategy_id": strategy_id,
                "name": strategy["name"],
                "symbol": strategy["symbol"],
                "thesis": strategy["thesis"],
                "score": strategy["confidence"],
                "confidence": strategy["confidence"],
            })

            if "shadow_requested" in actions:
                try:
                    self.lifecycle.advance(strategy_id, "shadow-live", "Routed from WOI conversation")
                except Exception:
                    pass

                try:
                    self.shadow.record({
                        "trade_id": f"shadow-{strategy_id}",
                        "symbol": strategy["symbol"],
                        "side": strategy["side_bias"],
                        "strategy_id": strategy_id,
                        "entry_ref": 0.0,
                        "current_ref": 0.0,
                        "pnl_pct": 0.0,
                        "confidence": strategy["confidence"],
                        "thesis": strategy["thesis"],
                        "status": "open",
                    })
                except Exception:
                    pass

        self.sessions.append(session.session_id, "assistant", reply_text)

        return {
            "ok": True,
            "session_id": session.session_id,
            "reply_text": reply_text,
            "voice": {
                "speakable_text": reply_text,
                "voice_style": "confident",
                "emotion": "focused",
            },
            "parsed": parsed.get("parsed"),
            "actions_taken": list(actions),
            "structured": structured,
            "memory_digest": self.memory.digest(),
            "lifecycle": self.lifecycle.summary(),
            "shadow": self.shadow.summary(),
            "llm": {
                "ok": llm.get("ok", False),
                "model": llm.get("model"),
            },
        }