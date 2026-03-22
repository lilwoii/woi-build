from __future__ import annotations

from fastapi import APIRouter, Body

from woi_core.watchlists.manager import WatchlistManager

router = APIRouter(prefix="/api/woi/watchlists", tags=["WOI Watchlists"])

WATCH = WatchlistManager()


@router.get("/")
def watchlists_all():
    return WATCH.get_all()


@router.post("/add")
def watchlists_add(payload: dict = Body(...)):
    return WATCH.add_manual(str(payload.get("kind") or ""), str(payload.get("value") or ""))


@router.post("/remove")
def watchlists_remove(payload: dict = Body(...)):
    return WATCH.remove_manual(str(payload.get("kind") or ""), str(payload.get("value") or ""))