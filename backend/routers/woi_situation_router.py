from __future__ import annotations

from fastapi import APIRouter

from woi_core.situation.country_state_monitor import CountryStateMonitor
from woi_core.situation.public_telemetry import PublicTelemetryMonitor
from woi_core.situation.fusion_engine import SituationFusionEngine

router = APIRouter(prefix="/api/woi/situation", tags=["WOI Situation"])

COUNTRY_STATE = CountryStateMonitor()
TELEMETRY = PublicTelemetryMonitor()
FUSION = SituationFusionEngine()


@router.get("/countries")
def situation_countries():
    return COUNTRY_STATE.countries()


@router.get("/states")
def situation_states():
    return COUNTRY_STATE.states()


@router.get("/heat")
def situation_heat():
    return COUNTRY_STATE.heat()


@router.get("/telemetry")
def situation_telemetry():
    return TELEMETRY.list()


@router.get("/telemetry/groups")
def situation_telemetry_groups():
    return TELEMETRY.by_kind()


@router.get("/summary")
def situation_summary():
    countries = COUNTRY_STATE.countries()["items"]
    states = COUNTRY_STATE.states()["items"]
    telemetry = TELEMETRY.list()["items"]
    return FUSION.summarize(
        country_items=countries,
        state_items=states,
        telemetry_items=telemetry,
    )