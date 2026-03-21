from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
from .ledger import LedgerRow

def _fifo(trades: List[LedgerRow], mark: Dict[str, Optional[float]]) -> Dict[str, Any]:
    lots: Dict[str, List[Tuple[float, float]]] = {}
    realized = 0.0
    fees = 0.0

    for t in trades:
        token = t.token_id
        side = t.side
        qty = float(t.size or 0.0)
        px = float(t.price or 0.0)
        fees += float(t.fee or 0.0)

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
    for token, token_lots in lots.items():
        inv = sum(q for q,_ in token_lots)
        if inv <= 1e-9:
            continue
        avg_cost = sum(q*px for q,px in token_lots) / inv
        m = mark.get(token)
        if m is not None:
            unreal += (float(m) - avg_cost) * inv

    return {"realized": realized - fees, "unrealized": unreal, "fees": fees}

def grouped_pnl(ledger: List[LedgerRow], mark: Dict[str, Optional[float]]) -> Dict[str, Any]:
    by_strategy: Dict[str, List[LedgerRow]] = {}
    by_token: Dict[str, List[LedgerRow]] = {}
    by_st_token: Dict[Tuple[str,str], List[LedgerRow]] = {}

    for r in ledger:
        st = r.strategy or "UNKNOWN"
        tok = r.token_id
        by_strategy.setdefault(st, []).append(r)
        by_token.setdefault(tok, []).append(r)
        by_st_token.setdefault((st, tok), []).append(r)

    def pack(group: List[LedgerRow]) -> Dict[str, Any]:
        p = _fifo(group, mark)
        return {"realized_pnl": p["realized"], "unrealized_pnl": p["unrealized"], "fees": p["fees"], "trades": len(group)}

    out_strategy = {k: pack(v) for k,v in by_strategy.items()}
    out_token = {k: pack(v) for k,v in by_token.items()}
    out_st_tok = {f"{k[0]}::{k[1]}": pack(v) for k,v in by_st_token.items()}

    overall = _fifo(ledger, mark)
    return {
        "overall": {"realized_pnl": overall["realized"], "unrealized_pnl": overall["unrealized"], "fees": overall["fees"], "trades": len(ledger)},
        "by_strategy": out_strategy,
        "by_token": out_token,
        "by_strategy_token": out_st_tok,
    }
