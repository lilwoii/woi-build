from __future__ import annotations
from typing import Any, Dict, List, Optional

async def find_related(runtime, query: str, limit: int = 8) -> List[Dict[str, Any]]:
    q = (query or "").strip()
    if not q:
        return []
    pm = getattr(getattr(runtime.modules, "polymarket", None), "market_data", None)
    # Try a market search method if present
    if pm and hasattr(pm, "search_markets"):
        try:
            res = await pm.search_markets(q, limit=limit)  # type: ignore
            if isinstance(res, list):
                return res[:limit]
        except Exception:
            pass
    # Fallback demo
    return [
        {"market_id":"demo_1","title":f"Related: {q[:30]}?","token_id":"demo_token_yes","yes":"demo_token_yes","no":"demo_token_no"},
    ][:limit]
