from __future__ import annotations

from fastapi import APIRouter, Body

from woi_core.chart_intel.analysis import ChartIntelligenceEngine
from woi_core.chart_intel.router import SymbolAnalysisRouter

router = APIRouter(prefix="/api/woi/chart", tags=["WOI Chart"])

ENGINE = ChartIntelligenceEngine()
SYMBOL_ROUTER = SymbolAnalysisRouter()


@router.post("/analyze")
def chart_analyze(payload: dict = Body(...)):
    symbol = str(payload.get("symbol") or "SPY")
    candles = list(payload.get("candles") or [])
    return ENGINE.analyze(symbol=symbol, candles=candles)


@router.post("/route")
def chart_route(payload: dict = Body(...)):
    return SYMBOL_ROUTER.build_targets(payload)