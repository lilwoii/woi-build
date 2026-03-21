from __future__ import annotations

import re
from typing import Dict, Any


def extract_strategy_from_text(text: str, symbol_hint: str = "") -> Dict[str, Any]:
    raw = (text or "").strip()
    lower = raw.lower()

    symbol = symbol_hint or ""
    if not symbol:
        matches = re.findall(r"\b[A-Z]{2,5}\b", raw)
        symbol = matches[0] if matches else "SPY"

    side = "BUY"
    if "short" in lower or "sell" in lower:
        side = "SELL"

    timeframe = "intraday"
    for tf in ["scalp", "intraday", "swing", "position"]:
        if tf in lower:
            timeframe = tf
            break

    stop_loss = None
    take_profit = None

    sl_match = re.search(r"(stop loss|sl)\s*(at|=)?\s*([0-9]+(?:\.[0-9]+)?)", lower)
    tp_match = re.search(r"(take profit|tp)\s*(at|=)?\s*([0-9]+(?:\.[0-9]+)?)", lower)

    if sl_match:
        stop_loss = float(sl_match.group(3))
    if tp_match:
        take_profit = float(tp_match.group(3))

    thesis = raw
    name = f"{symbol} {timeframe} {side.lower()} strategy"

    return {
        "name": name,
        "symbol": symbol,
        "side_bias": side,
        "timeframe": timeframe,
        "thesis": thesis,
        "stop_loss": stop_loss,
        "take_profit": take_profit,
        "confidence": 0.58,
    }