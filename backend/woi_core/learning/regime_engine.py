from __future__ import annotations

from typing import Dict, Any, List


class RegimeEngine:
    def detect(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        market_stress = float(payload.get("market_stress") or 0.35)
        inflation = bool(payload.get("inflation_pressure", False))
        trend = str(payload.get("trend") or "mixed").lower()
        volatility = float(payload.get("volatility_score") or 0.4)

        regime = "mixed"
        if market_stress >= 0.8:
            regime = "high-stress"
        elif inflation and volatility >= 0.65:
            regime = "inflation-volatility"
        elif trend == "uptrend" and volatility < 0.5:
            regime = "risk-on-trend"
        elif trend == "downtrend":
            regime = "risk-off"

        return {
            "ok": True,
            "regime": regime,
            "market_stress": market_stress,
            "volatility_score": volatility,
        }

    def similar_conditions(self, regime: str, lessons: List[Dict[str, Any]]) -> Dict[str, Any]:
        items = [x for x in lessons if str(x.get("regime") or "") == regime]
        return {"ok": True, "items": items[:20]}