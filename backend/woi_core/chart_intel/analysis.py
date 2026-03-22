from __future__ import annotations

from typing import Dict, Any, List


class ChartIntelligenceEngine:
    def analyze(self, symbol: str, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not candles:
            return {
                "ok": True,
                "symbol": symbol,
                "trendlines": [],
                "support_resistance": [],
                "fibonacci": [],
                "patterns": [],
                "summary": "No candles provided.",
                "confluence_score": 0.0,
            }

        highs = [float(c["high"]) for c in candles]
        lows = [float(c["low"]) for c in candles]
        closes = [float(c["close"]) for c in candles]

        first_close = closes[0]
        last_close = closes[-1]
        trend = "uptrend" if last_close >= first_close else "downtrend"

        recent_high = max(highs[-20:]) if len(highs) >= 20 else max(highs)
        recent_low = min(lows[-20:]) if len(lows) >= 20 else min(lows)
        mid = round((recent_high + recent_low) / 2, 4)

        support_resistance = [
            {"type": "support", "price": round(recent_low, 4)},
            {"type": "pivot", "price": mid},
            {"type": "resistance", "price": round(recent_high, 4)},
        ]

        fibs = self._fibonacci(recent_low, recent_high)
        patterns = self._patterns(closes)
        trendlines = self._trendlines(candles, trend)
        confluence = self._confluence(last_close, support_resistance, fibs, patterns)

        summary = (
            f"📊 {symbol} chart intelligence sees a {trend}. "
            f"Key support is near {round(recent_low, 4)} and resistance is near {round(recent_high, 4)}. "
            f"Confluence score is {confluence}."
        )

        return {
            "ok": True,
            "symbol": symbol,
            "trend": trend,
            "trendlines": trendlines,
            "support_resistance": support_resistance,
            "fibonacci": fibs,
            "patterns": patterns,
            "summary": summary,
            "confluence_score": confluence,
        }

    def _fibonacci(self, low: float, high: float) -> List[Dict[str, Any]]:
        diff = high - low
        levels = [0.236, 0.382, 0.5, 0.618, 0.786]
        return [
            {"level": lvl, "price": round(high - (diff * lvl), 4)}
            for lvl in levels
        ]

    def _patterns(self, closes: List[float]) -> List[Dict[str, Any]]:
        patterns = []
        if len(closes) >= 3 and closes[-1] > closes[-2] > closes[-3]:
            patterns.append({"name": "bullish-momentum-staircase", "bias": "bullish"})
        if len(closes) >= 3 and closes[-1] < closes[-2] < closes[-3]:
            patterns.append({"name": "bearish-momentum-staircase", "bias": "bearish"})
        if len(closes) >= 6:
            recent = closes[-6:]
            spread = max(recent) - min(recent)
            if spread / max(1.0, recent[-1]) < 0.015:
                patterns.append({"name": "tight-range-compression", "bias": "breakout-watch"})
        return patterns

    def _trendlines(self, candles: List[Dict[str, Any]], trend: str) -> List[Dict[str, Any]]:
        first = candles[0]
        last = candles[-1]
        return [
            {
                "name": f"{trend}-primary",
                "start_index": 0,
                "end_index": len(candles) - 1,
                "start_price": float(first["close"]),
                "end_price": float(last["close"]),
            }
        ]

    def _confluence(self, last_close: float, sr: List[Dict[str, Any]], fibs: List[Dict[str, Any]], patterns: List[Dict[str, Any]]) -> float:
        score = 0.35
        for level in sr:
            if abs(last_close - level["price"]) / max(1.0, last_close) < 0.015:
                score += 0.15
        for fib in fibs:
            if abs(last_close - fib["price"]) / max(1.0, last_close) < 0.012:
                score += 0.1
        if patterns:
            score += 0.15
        return round(min(score, 0.98), 3)