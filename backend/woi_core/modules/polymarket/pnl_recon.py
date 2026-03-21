from __future__ import annotations
import json
from typing import Any, Dict, List, Optional, Tuple
import aiosqlite

def _normalize_user_trade(t: Dict[str, Any]) -> Dict[str, Any]:
    token = t.get("token_id") or t.get("tokenId") or t.get("asset_id") or ""
    side = (t.get("side") or t.get("taker_side") or t.get("direction") or "").lower()
    side = "buy" if "buy" in side else "sell" if "sell" in side else side
    price = float(t.get("price") or t.get("avg_price") or 0.0)
    size = float(t.get("size") or t.get("amount") or t.get("quantity") or 0.0)
    fee = float(t.get("fee") or t.get("fees") or 0.0) if (t.get("fee") is not None or t.get("fees") is not None) else 0.0
    ts = t.get("timestamp") or t.get("created_at") or t.get("time") or ""
    return {"token_id": str(token), "side": side, "price": price, "size": size, "fee": fee, "ts_utc": str(ts), "source": "clob"}

async def _fetch_journal(db_path: str, limit: int = 1000) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(db_path) as db:
        cur = await db.execute(
            "SELECT ts_utc, strategy, symbol, side, price, size, result_json FROM woi_trade_journal ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = await cur.fetchall()
    out = []
    for ts, strat, sym, side, price, size, resj in rows:
        r = json.loads(resj) if resj else {}
        out.append({
            "ts_utc": ts,
            "strategy": strat,
            "token_id": sym,
            "side": side,
            "price": float(price),
            "size": float(size),
            "fee": float(r.get("fee", 0.0)) if isinstance(r, dict) else 0.0,
            "source": "journal",
            "result": r
        })
    return out

def _fifo(trades: List[Dict[str, Any]], mid_prices: Dict[str, float], settlement: Dict[str, Optional[float]]) -> Dict[str, Any]:
    lots: Dict[str, List[Tuple[float, float]]] = {}
    realized = 0.0
    fees = 0.0

    for t in reversed(trades):
        token = t["token_id"]
        side = (t["side"] or "").lower()
        qty = float(t["size"] or 0.0)
        px = float(t["price"] or 0.0)
        fee = float(t.get("fee", 0.0) or 0.0)
        fees += fee
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

    unreal = 0.0
    positions = []
    for token, token_lots in lots.items():
        inv = sum(q for q,_ in token_lots)
        if inv <= 1e-9:
            continue
        avg_cost = sum(q*px for q,px in token_lots) / inv
        settle_px = settlement.get(token)
        mark = settle_px if settle_px is not None else mid_prices.get(token)
        if mark is not None:
            unreal += (float(mark) - avg_cost) * inv
        positions.append({"token_id": token, "qty": inv, "avg_cost": avg_cost, "mark": mark, "settlement": settle_px})
    return {"realized_pnl_est": realized - fees, "unrealized_pnl_est": unreal, "fees_est": fees, "positions": positions}

def _rollup_by_key(trades: List[Dict[str, Any]], key: str) -> Dict[str, Dict[str, float]]:
    out: Dict[str, Dict[str, float]] = {}
    for t in trades:
        k = str(t.get(key) or "UNKNOWN")
        out.setdefault(k, {"trades": 0, "buy_notional": 0.0, "sell_notional": 0.0, "fees": 0.0})
        out[k]["trades"] += 1
        notional = float(t.get("price", 0.0)) * float(t.get("size", 0.0))
        if (t.get("side") or "").lower() == "buy":
            out[k]["buy_notional"] += notional
        else:
            out[k]["sell_notional"] += notional
        out[k]["fees"] += float(t.get("fee", 0.0) or 0.0)
    return out

async def compute_reconciled(db_path: str, market_data, settlement_resolver, user_trades_client=None, limit: int = 1000) -> Dict[str, Any]:
    journal = await _fetch_journal(db_path, limit=limit)

    remote: List[Dict[str, Any]] = []
    if user_trades_client is not None and getattr(user_trades_client, "configured", lambda: False)():
        try:
            raw = await user_trades_client.trades(limit=200)
            remote = [_normalize_user_trade(t) for t in raw]
        except Exception:
            remote = []

    trades = remote if remote else journal
    source = "clob" if remote else "journal"

    tokens = sorted({t["token_id"] for t in trades if t.get("token_id")})[:150]
    mid_prices: Dict[str, float] = {}
    settlement: Dict[str, Optional[float]] = {}
    for tok in tokens:
        try:
            settlement[tok] = await settlement_resolver.resolve_token_settlement_price(tok)
        except Exception:
            settlement[tok] = None
        try:
            _, _, mid = await market_data.best_bid_ask_mid(tok)
            if mid is not None:
                mid_prices[tok] = float(mid)
        except Exception:
            continue

    pnl = _fifo(trades, mid_prices, settlement)
    by_token = _rollup_by_key(trades, "token_id")
    by_strategy = _rollup_by_key(journal, "strategy")  # strategy only known in journal

    return {"source": source, "trades": trades, "mid_prices": mid_prices, "settlement": settlement, "by_token": by_token, "by_strategy": by_strategy, **pnl}
