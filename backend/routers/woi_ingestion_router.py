from __future__ import annotations

from fastapi import APIRouter, Body

from woi_core.intel.ingestion_hub import IngestionHub

router = APIRouter(prefix="/api/woi/ingestion", tags=["WOI Ingestion"])

HUB = IngestionHub()


@router.get("/recent")
def ingestion_recent():
    return HUB.recent()


@router.post("/event")
def ingestion_event(payload: dict = Body(...)):
    return HUB.ingest_one(payload)


@router.post("/batch")
def ingestion_batch(payload: dict = Body(...)):
    return HUB.ingest_many(list(payload.get("items") or []))


@router.get("/watchlists")
def ingestion_watchlists():
    return HUB.watchlists.get_all()


@router.get("/strategy-candidates")
def ingestion_strategy_candidates():
    return HUB.candidates.list()