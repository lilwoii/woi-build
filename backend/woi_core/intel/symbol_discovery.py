from __future__ import annotations

from typing import Dict, Any, List


class SymbolDiscoveryEngine:
    def discover(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        text = f"{payload.get('title', '')} {payload.get('summary', '')}".lower()
        stocks: List[str] = []
        crypto: List[str] = []
        polymarket: List[str] = list(payload.get("linked_prediction_markets") or [])

        mapping = {
            "oil": ("stocks", ["USO", "XLE", "LNG"]),
            "shipping": ("stocks", ["ZIM", "XLE"]),
            "flight": ("stocks", ["BA", "LMT", "RTX"]),
            "fed": ("stocks", ["TLT", "SPY", "QQQ", "DXY"]),
            "cpi": ("stocks", ["TLT", "QQQ", "SPY"]),
            "bitcoin": ("crypto", ["BTC"]),
            "btc": ("crypto", ["BTC"]),
            "ethereum": ("crypto", ["ETH"]),
            "eth": ("crypto", ["ETH"]),
            "crypto": ("crypto", ["BTC", "ETH", "SOL"]),
            "earnings": ("stocks", ["QQQ", "NVDA", "AMD"]),
            "nvda": ("stocks", ["NVDA"]),
            "amd": ("stocks", ["AMD"]),
            "election": ("polymarket", ["Election outcome market"]),
            "rate cut": ("polymarket", ["Fed cut next meeting?"]),
        }

        for keyword, (kind, values) in mapping.items():
            if keyword in text:
                if kind == "stocks":
                    stocks.extend(values)
                elif kind == "crypto":
                    crypto.extend(values)
                else:
                    polymarket.extend(values)

        return {
            "ok": True,
            "stocks": list(dict.fromkeys(stocks)),
            "crypto": list(dict.fromkeys(crypto)),
            "polymarket": list(dict.fromkeys(polymarket)),
        }