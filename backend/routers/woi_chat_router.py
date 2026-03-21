from __future__ import annotations

from fastapi import APIRouter, Body

from woi_core.assistant.chat_engine import WOIChatEngine
from woi_core.memory.promotion import MemoryPromotionEngine
from woi_core.strategy.lifecycle import StrategyLifecycleStore
from woi_core.strategy.shadow_book import ShadowBook

router = APIRouter(prefix="/api/woi/chat", tags=["WOI Chat"])

CHAT = WOIChatEngine()
MEMORY = MemoryPromotionEngine()
LIFECYCLE = StrategyLifecycleStore()
SHADOW = ShadowBook()


@router.post("/message")
def chat_message(payload: dict = Body(...)):
    text = str(payload.get("text") or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}

    result = CHAT.reply(text)

    structured = result.get("structured") or {}
    actions = set(result.get("actions_taken") or [])

    if "memory_flagged" in actions:
        MEMORY.add_raw({
            "text": text,
            "tags": ["chat", "user-directive"],
            "symbol": structured.get("strategy", {}).get("symbol", ""),
            "regime": "conversation",
            "outcome": "",
            "confidence": 0.63,
        })

    if "strategy_extracted" in actions:
        strategy = structured["strategy"]
        strategy_id = strategy["name"].lower().replace(" ", "-")
        LIFECYCLE.upsert({
            "strategy_id": strategy_id,
            "name": strategy["name"],
            "symbol": strategy["symbol"],
            "thesis": strategy["thesis"],
            "score": strategy["confidence"],
            "confidence": strategy["confidence"],
        })

        if "shadow_requested" in actions:
            LIFECYCLE.advance(strategy_id, "shadow-live", "Routed from conversational WOI command")
            SHADOW.record({
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

    return {
        "ok": True,
        "chat": result,
        "memory_digest": MEMORY.digest(),
        "lifecycle": LIFECYCLE.summary(),
        "shadow": SHADOW.summary(),
    }


@router.get("/rules")
def chat_rules():
    return CHAT.rulebook.list()


@router.get("/history")
def chat_history():
    return {"ok": True, "items": CHAT.chat_log[:50]}