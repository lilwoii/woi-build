from __future__ import annotations

from typing import Dict, Any, List


class EventMatcher:
    def __init__(self) -> None:
        self.keyword_map = {
            "oil": {
                "symbols": ["USO", "XLE", "LNG"],
                "sectors": ["Energy"],
                "prediction_markets": ["Oil above threshold this month?"],
                "strategies": ["energy-breakout", "shipping-risk-spike"],
            },
            "fed": {
                "symbols": ["TLT", "DXY", "QQQ", "SPY"],
                "sectors": ["Rates", "Macro"],
                "prediction_markets": ["Fed cut next meeting?"],
                "strategies": ["macro-rates-repricing"],
            },
            "cpi": {
                "symbols": ["TLT", "QQQ", "SPY", "BTC"],
                "sectors": ["Macro", "Tech"],
                "prediction_markets": ["Fed cut next meeting?"],
                "strategies": ["inflation-fade-reclaim"],
            },
            "election": {
                "symbols": ["SPY", "TLT", "DXY"],
                "sectors": ["Policy", "Macro"],
                "prediction_markets": ["Election outcome market"],
                "strategies": ["election-volatility-watch"],
            },
            "flight": {
                "symbols": ["BA", "LMT", "NOC", "RTX"],
                "sectors": ["Defense", "Transport"],
                "prediction_markets": ["Escalation odds this week?"],
                "strategies": ["defense-alert-breakout"],
            },
            "shipping": {
                "symbols": ["USO", "XLE", "ZIM"],
                "sectors": ["Shipping", "Energy"],
                "prediction_markets": ["Oil above threshold this month?"],
                "strategies": ["route-disruption-momentum"],
            },
            "crypto": {
                "symbols": ["BTC", "ETH", "COIN", "MSTR"],
                "sectors": ["Crypto", "Fintech"],
                "prediction_markets": ["BTC above 100k by year-end?"],
                "strategies": ["crypto-flow-follow"],
            },
        }

    def match(self, text: str) -> Dict[str, Any]:
        lowered = (text or "").lower()
        linked_symbols: List[str] = []
        linked_sectors: List[str] = []
        linked_prediction_markets: List[str] = []
        strategy_candidates: List[str] = []

        for keyword, payload in self.keyword_map.items():
            if keyword in lowered:
                linked_symbols.extend(payload["symbols"])
                linked_sectors.extend(payload["sectors"])
                linked_prediction_markets.extend(payload["prediction_markets"])
                strategy_candidates.extend(payload["strategies"])

        def dedupe(seq: List[str]) -> List[str]:
            return list(dict.fromkeys(seq))

        return {
            "ok": True,
            "linked_symbols": dedupe(linked_symbols),
            "linked_sectors": dedupe(linked_sectors),
            "linked_prediction_markets": dedupe(linked_prediction_markets),
            "strategy_candidates": dedupe(strategy_candidates),
        }