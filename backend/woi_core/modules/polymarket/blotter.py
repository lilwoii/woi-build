from __future__ import annotations
import os, json, time
from typing import Any, Dict, List

def _path() -> str:
    return os.getenv("WOI_POLY_BLOTTER_PATH", "./_woi_state/poly_blotter.jsonl")

def append(item: Dict[str, Any]) -> None:
    p = _path()
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    item.setdefault("ts_utc", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    with open(p, "a", encoding="utf-8") as f:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")

def read(limit: int = 200) -> List[Dict[str, Any]]:
    p = _path()
    if not os.path.exists(p):
        return []
    out = []
    with open(p, "r", encoding="utf-8") as f:
        for line in f:
            line=line.strip()
            if not line: 
                continue
            try:
                out.append(json.loads(line))
            except Exception:
                continue
    return out[-limit:]

def clear() -> None:
    p = _path()
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write("")
