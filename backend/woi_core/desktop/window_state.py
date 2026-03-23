from __future__ import annotations

from typing import Dict, Any


class WindowStateStore:
    def __init__(self) -> None:
        self.state = {
            "last_tab": "dashboard",
            "sidebar_collapsed": False,
            "alert_center_open": False,
            "command_palette_open": False,
            "theme_mode": "dark",
        }

    def get(self) -> Dict[str, Any]:
        return {"ok": True, "state": self.state}

    def update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        for key in self.state.keys():
            if key in payload:
                self.state[key] = payload[key]
        return {"ok": True, "state": self.state}