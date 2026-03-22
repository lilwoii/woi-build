from __future__ import annotations

from fastapi import APIRouter, Body, Query

from woi_core.agents.council_engine import AgentCouncilEngine
from woi_core.agents.agent_registry import AgentRegistry
from woi_core.alerts.preferences import AlertPreferencesStore
from woi_core.integrations.discord_broadcasts import DiscordBroadcasts

router = APIRouter(prefix="/api/woi/agents", tags=["WOI Agents"])

REGISTRY = AgentRegistry()
COUNCIL = AgentCouncilEngine()
ALERTS = AlertPreferencesStore()
DISCORD = DiscordBroadcasts()


@router.get("/registry")
def agents_registry():
    return REGISTRY.list()


@router.post("/deliberate")
def agents_deliberate(payload: dict = Body(...), mode: str = Query(default="fast")):
    REGISTRY.set_train_mode(mode)
result = COUNCIL.evaluate(payload=payload)
result["mode"] = REGISTRY.train_mode

    prefs = ALERTS.get()["prefs"]
    if prefs.get("discord_enabled") and result["avg_urgency"] >= 0.75:
        DISCORD.emit(
            title=f"🧠 WOI Council Alert ({result['mode']})",
            body=result["summary"],
            level="warn" if result["avg_urgency"] < 0.9 else "error",
            fields=[
                {"name": "confidence", "value": str(result["avg_confidence"])},
                {"name": "urgency", "value": str(result["avg_urgency"])},
                {"name": "symbols", "value": ", ".join(result["linked_symbols"][:6]) or "-"},
            ],
        )

    return result


@router.get("/alert-prefs")
def alert_prefs():
    return ALERTS.get()


@router.post("/alert-prefs")
def update_alert_prefs(payload: dict = Body(...)):
    return ALERTS.update(payload)