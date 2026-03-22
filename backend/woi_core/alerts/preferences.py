from __future__ import annotations

from typing import Dict, Any


DEFAULT_ALERT_PREFS = {
    "desktop_enabled": False,
    "in_app_enabled": True,
    "discord_enabled": True,
    "critical_only": False,
    "features": {
        "globe_intel": True,
        "strategy": True,
        "risk": True,
        "polymarket": True,
        "crypto": True,
        "shadow": True,
        "ai_signal_feed": True,
        "casino": False,
        "world_pulse": True,
    },
}


class AlertPreferencesStore:
    def __init__(self) -> None:
        self.prefs = DEFAULT_ALERT_PREFS.copy()
        self.prefs["features"] = dict(DEFAULT_ALERT_PREFS["features"])

    def get(self) -> Dict[str, Any]:
        return {"ok": True, "prefs": self.prefs}

    def update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        for key in ["desktop_enabled", "in_app_enabled", "discord_enabled", "critical_only"]:
            if key in payload:
                self.prefs[key] = bool(payload[key])

        if "features" in payload and isinstance(payload["features"], dict):
            for k, v in payload["features"].items():
                self.prefs["features"][k] = bool(v)

        return {"ok": True, "prefs": self.prefs}