from __future__ import annotations

from fastapi import APIRouter, Body, Query

from woi_core.brain.state import WOIBrainState
from woi_core.memory.promotion import MemoryPromotionEngine
from woi_core.modules.globe_intel.service import GlobeIntelService
from woi_core.risk.kill_switch import RiskKillSwitch
from woi_core.strategy.lifecycle import StrategyLifecycleStore
from woi_core.strategy.shadow_book import ShadowBook

router = APIRouter(prefix="/api/woi/mega", tags=["WOI Mega"])

BRAIN = WOIBrainState()
MEMORY = MemoryPromotionEngine()
GLOBE = GlobeIntelService()
RISK = RiskKillSwitch()
LIFECYCLE = StrategyLifecycleStore()
SHADOW = ShadowBook()


@router.get("/brain/state")
def brain_state():
    BRAIN.refresh(
        summary="🧠 WOI is monitoring macro, geopolitics, prediction markets, and strategy promotion.",
        top_priorities=[
            "🌍 Track high-urgency world events",
            "🎯 Link events to tradable symbols and Polymarket themes",
            "🧪 Advance shadow strategies that keep scoring well",
        ],
    )
    return {"ok": True, "brain": BRAIN.to_dict()}


@router.post("/brain/personality")
def set_brain_personality(payload: dict = Body(...)):
    market_stress = float(payload.get("market_stress", BRAIN.market_stress))
    opportunity_score = float(payload.get("opportunity_score", BRAIN.opportunity_score))
    market_regime = str(payload.get("market_regime", BRAIN.market_regime))
    summary = str(payload.get("summary", BRAIN.last_summary))
    BRAIN.refresh(
        market_stress=market_stress,
        opportunity_score=opportunity_score,
        market_regime=market_regime,
        summary=summary,
    )
    return {"ok": True, "brain": BRAIN.to_dict()}


@router.get("/globe/events")
def globe_events():
    events = GLOBE.list_events()
    BRAIN.bump("events_processed", len(events["items"]))
    return events


@router.post("/globe/event")
def add_globe_event(payload: dict = Body(...)):
    item = GLOBE.add_event(payload)
    BRAIN.bump("events_processed", 1)
    return item


@router.get("/globe/channels")
def globe_channels():
    return GLOBE.channels()


@router.get("/globe/map")
def globe_map():
    return GLOBE.map_points()


@router.get("/globe/watch-panels")
def globe_watch_panels():
    return GLOBE.watch_panels()


@router.get("/strategy/lifecycle")
def strategy_lifecycle():
    return {
        "ok": True,
        "board": LIFECYCLE.list(),
        "summary": LIFECYCLE.summary(),
    }


@router.post("/strategy/register")
def strategy_register(payload: dict = Body(...)):
    result = LIFECYCLE.upsert(payload)
    BRAIN.counters["strategies_active"] = len(LIFECYCLE.items)
    return result


@router.post("/strategy/advance")
def strategy_advance(payload: dict = Body(...)):
    strategy_id = str(payload.get("strategy_id") or "").strip()
    stage = str(payload.get("stage") or "").strip()
    note = str(payload.get("note") or "")
    return LIFECYCLE.advance(strategy_id=strategy_id, stage=stage, note=note)


@router.get("/shadow/book")
def shadow_book():
    return {
        "ok": True,
        "book": SHADOW.list(),
        "summary": SHADOW.summary(),
    }


@router.post("/shadow/record")
def shadow_record(payload: dict = Body(...)):
    BRAIN.bump("shadow_trades", 1)
    return SHADOW.record(payload)


@router.post("/shadow/update")
def shadow_update(payload: dict = Body(...)):
    trade_id = str(payload.get("trade_id") or "").strip()
    return SHADOW.update(trade_id, payload)


@router.get("/risk/status")
def risk_status():
    return RISK.status()


@router.post("/risk/config")
def risk_config(payload: dict = Body(...)):
    return RISK.update_config(payload)


@router.post("/risk/evaluate")
def risk_evaluate(payload: dict = Body(...)):
    result = RISK.evaluate(payload)
    if result.get("tripped"):
        BRAIN.bump("kill_switch_trips", 1)
        BRAIN.refresh(
            market_stress=max(BRAIN.market_stress, float(payload.get("market_stress", 0.9))),
            summary=f"🚨 Risk kill switch tripped: {result['reason']}",
        )
    return result


@router.post("/risk/reset")
def risk_reset():
    return RISK.reset()


@router.get("/memory/digest")
def memory_digest():
    return MEMORY.digest()


@router.post("/memory/raw")
def memory_raw(payload: dict = Body(...)):
    return MEMORY.add_raw(payload)


@router.post("/memory/promote")
def memory_promote(payload: dict = Body(...)):
    BRAIN.bump("promoted_lessons", 1)
    return MEMORY.promote(payload)


@router.get("/memory/similar")
def memory_similar(
    symbol: str = Query(default=""),
    regime: str = Query(default=""),
    tags: str = Query(default=""),
):
    tag_list = [x.strip() for x in tags.split(",") if x.strip()]
    return MEMORY.similar(symbol=symbol, regime=regime, tags=tag_list)