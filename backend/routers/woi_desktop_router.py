from __future__ import annotations

from fastapi import APIRouter, Body

from woi_core.alerts.center import AlertCenter
from woi_core.desktop.preferences import DesktopPreferences
from woi_core.desktop.hotkeys import HotkeyRegistry
from woi_core.desktop.window_state import WindowStateStore

router = APIRouter(prefix="/api/woi/desktop", tags=["WOI Desktop"])

ALERTS = AlertCenter()
PREFS = DesktopPreferences()
HOTKEYS = HotkeyRegistry()
WINDOW = WindowStateStore()


@router.get("/alerts")
def desktop_alerts():
    return ALERTS.list()


@router.get("/alerts/unread")
def desktop_alerts_unread():
    return ALERTS.unread_count()


@router.post("/alerts/push")
def desktop_alerts_push(payload: dict = Body(...)):
    return ALERTS.push(
        title=str(payload.get("title") or "WOI Alert"),
        body=str(payload.get("body") or ""),
        level=str(payload.get("level") or "info"),
        feature=str(payload.get("feature") or "general"),
        desktop_eligible=bool(payload.get("desktop_eligible", False)),
        sticky=bool(payload.get("sticky", False)),
    )


@router.post("/alerts/read")
def desktop_alerts_read(payload: dict = Body(...)):
    return ALERTS.mark_read(str(payload.get("alert_id") or ""))


@router.post("/alerts/clear")
def desktop_alerts_clear():
    return ALERTS.clear_non_sticky()


@router.get("/prefs")
def desktop_prefs():
    return PREFS.get()


@router.post("/prefs")
def desktop_prefs_update(payload: dict = Body(...)):
    return PREFS.update(payload)


@router.get("/hotkeys")
def desktop_hotkeys():
    return HOTKEYS.list()


@router.get("/window-state")
def desktop_window_state():
    return WINDOW.get()


@router.post("/window-state")
def desktop_window_state_update(payload: dict = Body(...)):
    return WINDOW.update(payload)