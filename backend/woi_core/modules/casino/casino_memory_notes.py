from __future__ import annotations
import os, json, time
from typing import Any, Dict

def _path() -> str:
    return os.getenv("WOI_MEMORY_NOTES_PATH", "./_woi_state/memory_notes.jsonl")

def append_note(tag: str, summary: str, payload: Dict[str, Any]) -> None:
    p = _path()
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    note = {
        "ts_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "type": "casino_behavior_note",
        "tag": tag,
        "summary": summary,
        "payload": payload or {},
    }
    with open(p, "a", encoding="utf-8") as f:
        f.write(json.dumps(note, ensure_ascii=False) + "\n")
