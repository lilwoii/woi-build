from __future__ import annotations

from fastapi import APIRouter, Body

from woi_core.execution.execution_hub import ExecutionHub

router = APIRouter(prefix="/api/woi/execution", tags=["WOI Execution"])

HUB = ExecutionHub()


@router.get("/controls")
def execution_controls():
    return HUB.controls.get()


@router.post("/controls")
def execution_controls_update(payload: dict = Body(...)):
    return HUB.controls.update(payload)


@router.post("/preview")
def execution_preview(payload: dict = Body(...)):
    return HUB.preview(payload)


@router.post("/submit")
def execution_submit(payload: dict = Body(...)):
    return HUB.submit(payload)


@router.get("/paper/orders")
def execution_paper_orders():
    return HUB.paper.list_orders()


@router.get("/paper/positions")
def execution_paper_positions():
    return HUB.paper.list_positions()


@router.get("/live/queued")
def execution_live_queued():
    return HUB.live.queued()


@router.get("/live/history")
def execution_live_history():
    return HUB.live.history()


@router.post("/live/approve")
def execution_live_approve(payload: dict = Body(...)):
    return HUB.live.approve(str(payload.get("queue_id") or ""))