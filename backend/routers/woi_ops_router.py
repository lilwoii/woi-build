from __future__ import annotations

from fastapi import APIRouter, Body, Query

from intel.source_adapters import SourceAdapterRegistry
from intel.event_matcher import EventMatcher
from woi_core.ops.strategy_router import StrategyOpsRouter
from woi_core.desktop.command_palette import DesktopCommandPalette

router = APIRouter(prefix="/api/woi/ops", tags=["WOI Ops"])

ADAPTERS = SourceAdapterRegistry()
MATCHER = EventMatcher()
ROUTER = StrategyOpsRouter()
PALETTE = DesktopCommandPalette()


@router.get("/adapters")
def ops_adapters():
    return ADAPTERS.list()


@router.post("/match")
def ops_match(payload: dict = Body(...)):
    text = str(payload.get("text") or payload.get("title") or "").strip()
    if not text:
        return {"ok": False, "error": "text is required"}
    return MATCHER.match(text)


@router.post("/route")
def ops_route(payload: dict = Body(...)):
    return ROUTER.route_event(payload)


@router.get("/palette")
def ops_palette(q: str = Query(default="")):
    return PALETTE.search(q=q)