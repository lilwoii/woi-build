from __future__ import annotations
import json
from typing import Any, Dict, List, Optional, Tuple
import aiosqlite

# We compute PnL from the WOI trade journal and current mid prices:
# - realized_pnl (estimated): when we have both buy and sell legs for same token_id
# - unrealized_pnl: mark to mid for open inventory

async def _fetch_journal(db_path: str, limit: int = 500) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(db_path) as db:
        cur = await db.execute(
            "SELECT ts_utc, strategy, symbol, side, price, size, result_json FROM woi_trade_journal ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = await cur.fetchall()
    out = []
    for ts, strat, sym, side, price, size, resj in rows:
        out.append({
            "ts_utc": ts, "strategy": strat, "token_id": sym,
            "side": side, "price": float(price), "size": float(size),
            "result": json.loads(resj) if resj else {}
        })
    return out

def _fifo_pnl(trades: List[Dict[str, Any]], mid_prices: Dict[str, float]) -> Dict[str, Any]:
    # FIFO inventory lots per token
    lots: Dict[str, List[Tuple[float, float]]] = {}  # token -> list of (qty, cost_price)
    realized = 0.0
    for t in reversed(trades):  # oldest->newest for fifo
        token = t["token_id"]
        side = t["side"].lower()
        qty = float(t["size"])
        px = float(t["price"])
        lots.setdefault(token, [])
        if side == "buy":
            lots[token].append((qty, px))
        elif side == "sell":
            sell_qty = qty
            while sell_qty > 1e-9 and lots[token]:
                lot_qty, lot_px = lots[token][0]
                take = min(lot_qty, sell_qty)
                realized += (px - lot_px) * take
                lot_qty -= take
                sell_qty -= take
                if lot_qty <= 1e-9:
                    lots[token].pop(0)
                else:
                    lots[token][0] = (lot_qty, lot_px)
            # if selling more than inventory, ignore remainder (short not modeled here)
    unreal = 0.0
    positions = []
    for token, token_lots in lots.items():
        inv = sum(q for q,_ in token_lots)
        if inv <= 1e-9:
            continue
        avg_cost = sum(q*px for q,px in token_lots) / inv
        mid = mid_prices.get(token)
        if mid is not None:
            unreal += (mid - avg_cost) * inv
        positions.append({"token_id": token, "qty": inv, "avg_cost": avg_cost, "mid": mid})
    return {"realized_pnl_est": realized, "unrealized_pnl_est": unreal, "positions": positions}

async def compute_pnl(db_path: str, market_data, limit: int = 500) -> Dict[str, Any]:
    trades = await _fetch_journal(db_path, limit=limit)
    # build mid prices for tokens present
    tokens = sorted({t["token_id"] for t in trades if t.get("token_id")})
    mid_prices: Dict[str, float] = {}
    for tok in tokens[:50]:  # cap for performance; UI can filter
        try:
            _, _, mid = await market_data.best_bid_ask_mid(tok)
            if mid is not None:
                mid_prices[tok] = float(mid)
        except Exception:
            continue
    pnl = _fifo_pnl(trades, mid_prices)
    return {"trades": trades, "mid_prices": mid_prices, **pnl}
