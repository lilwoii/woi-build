from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from dateutil import parser as dtparser

TOL_PRICE = float(os.getenv("LEDGER_RECON_TOL_PRICE", "0.002"))
TOL_SIZE = float(os.getenv("LEDGER_RECON_TOL_SIZE", "0.002"))
TIME_WINDOW = int(os.getenv("LEDGER_RECON_TIME_WINDOW_SEC", "120"))
MAX_ROWS = int(os.getenv("LEDGER_MAX_ROWS", "2500"))

def _ts_to_epoch(ts: str) -> Optional[float]:
    if not ts:
        return None
    try:
        return dtparser.parse(ts).timestamp()
    except Exception:
        return None

@dataclass
class LedgerRow:
    ts_utc: str
    token_id: str
    side: str
    price: float
    size: float
    fee: float
    source: str
    strategy: str
    raw: Dict[str, Any]

def _as_row(t: Dict[str, Any]) -> LedgerRow:
    return LedgerRow(
        ts_utc=str(t.get("ts_utc","")),
        token_id=str(t.get("token_id","")),
        side=str(t.get("side","")).lower(),
        price=float(t.get("price",0.0) or 0.0),
        size=float(t.get("size",0.0) or 0.0),
        fee=float(t.get("fee",0.0) or 0.0),
        source=str(t.get("source","")),
        strategy=str(t.get("strategy","UNKNOWN") or "UNKNOWN"),
        raw=t,
    )

def reconcile(journal: List[Dict[str, Any]], remote: List[Dict[str, Any]]) -> List[LedgerRow]:
    if not remote:
        rows = [_as_row(t) for t in journal[:MAX_ROWS]]
        rows.sort(key=lambda r: (_ts_to_epoch(r.ts_utc) or 0.0, r.token_id))
        return rows

    jrows = [_as_row(t) for t in journal[:MAX_ROWS]]
    jidx: Dict[Tuple[str,str], List[Tuple[LedgerRow, Optional[float]]]] = {}
    for jr in jrows:
        key = (jr.token_id, jr.side)
        jidx.setdefault(key, []).append((jr, _ts_to_epoch(jr.ts_utc)))

    out: List[LedgerRow] = []
    for rt in remote[:MAX_ROWS]:
        rr = _as_row(rt)
        rr.strategy = "UNKNOWN"
        rr.source = "clob"

        key = (rr.token_id, rr.side)
        candidates = jidx.get(key, [])
        rts = _ts_to_epoch(rr.ts_utc)
        best = None
        best_score = 1e18

        for jr, jts in candidates:
            if rts is not None and jts is not None:
                if abs(rts - jts) > TIME_WINDOW:
                    continue
                tscore = abs(rts - jts)
            else:
                tscore = 30.0

            if abs(rr.price - jr.price) > TOL_PRICE:
                continue
            if abs(rr.size - jr.size) > TOL_SIZE:
                continue

            pscore = abs(rr.price - jr.price) / max(1e-9, TOL_PRICE)
            ssize = abs(rr.size - jr.size) / max(1e-9, TOL_SIZE)
            score = tscore + 5.0*pscore + 5.0*ssize
            if score < best_score:
                best_score = score
                best = jr

        if best is not None and best.strategy:
            rr.strategy = best.strategy
        out.append(rr)

    out.sort(key=lambda r: (_ts_to_epoch(r.ts_utc) or 0.0, r.token_id))
    return out
