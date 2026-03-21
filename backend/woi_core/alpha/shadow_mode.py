from __future__ import annotations
import os, json, time
from typing import Any, Dict, Optional

def _env_bool(k: str, default: bool) -> bool:
    v = os.getenv(k, "true" if default else "false").strip().lower()
    return v in ("1","true","yes","y","on")

def get_mode() -> Dict[str, bool]:
    return {
        "live_enabled": _env_bool("WOI_POLY_LIVE_ENABLED", False),
        "shadow_enabled": _env_bool("WOI_POLY_SHADOW_ENABLED", True),
    }

def set_mode(*, live_enabled: Optional[bool]=None, shadow_enabled: Optional[bool]=None) -> Dict[str, Any]:
    path = os.getenv("WOI_MODE_STATE_PATH", "./_woi_state/mode.json")
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    cur = {}
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                cur = json.load(f) or {}
        except Exception:
            cur = {}
    if live_enabled is not None:
        cur["live_enabled"] = bool(live_enabled)
    if shadow_enabled is not None:
        cur["shadow_enabled"] = bool(shadow_enabled)
    cur["updated_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cur, f, indent=2)
    return {"ok": True, "mode": {"live_enabled": bool(cur.get("live_enabled", False)), "shadow_enabled": bool(cur.get("shadow_enabled", True))}}

def load_runtime_mode() -> Dict[str, bool]:
    path = os.getenv("WOI_MODE_STATE_PATH", "./_woi_state/mode.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                cur = json.load(f) or {}
            return {"live_enabled": bool(cur.get("live_enabled", False)), "shadow_enabled": bool(cur.get("shadow_enabled", True))}
        except Exception:
            pass
    return get_mode()
