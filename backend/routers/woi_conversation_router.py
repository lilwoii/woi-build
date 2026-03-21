from __future__ import annotations

from fastapi import APIRouter, Body, Query

from woi_core.assistant.conversation_orchestrator import WOIConversationOrchestrator
from woi_core.integrations.discord_broadcasts import DiscordBroadcasts
from woi_core.transport.flight_watch import FlightWatchService
from woi_core.intel.event_ops_router import build_ops_actions

router = APIRouter(prefix="/api/woi/conversation", tags=["WOI Conversation"])

WOI = WOIConversationOrchestrator()
DISCORD = DiscordBroadcasts()
FLIGHTS = FlightWatchService()


@router.post("/message")
def conversation_message(payload: dict = Body(...)):
    text = str(payload.get("text") or "").strip()
    session_id = payload.get("session_id")
    if not text:
        return {"ok": False, "error": "text is required"}

    result = WOI.converse(text=text, session_id=session_id)

    lowered = text.lower()
    if any(x in lowered for x in ["urgent", "broadcast", "send to discord"]):
        DISCORD.emit(
            title="🧠 WOI User Prompt Broadcast",
            body=text[:1800],
            level="info",
            fields=[
                {"name": "session", "value": result["session_id"]},
                {"name": "llm_ok", "value": str(result["llm"]["ok"])},
            ],
        )

    return result


@router.get("/sessions")
def conversation_sessions():
    return WOI.sessions.list_sessions()


@router.get("/session")
def conversation_session(session_id: str = Query(...)):
    return WOI.sessions.get_session(session_id)


@router.get("/rules")
def conversation_rules():
    return WOI.chat_engine.rulebook.list()


@router.get("/flight-watch")
def conversation_flight_watch():
    return FLIGHTS.list()


@router.post("/ops/broadcast")
def ops_broadcast(payload: dict = Body(...)):
    title = str(payload.get("title") or "WOI Broadcast")
    body = str(payload.get("body") or "").strip()
    level = str(payload.get("level") or "info")
    return DISCORD.emit(title=title, body=body, level=level, fields=payload.get("fields") or [])


@router.get("/ops/recent")
def ops_recent():
    return DISCORD.recent()


@router.post("/ops/event-route")
def ops_event_route(payload: dict = Body(...)):
    return build_ops_actions(payload)