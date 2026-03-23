from __future__ import annotations

from typing import Dict, Any


class DesktopPreferences:
    def __init__(self) -> None:
        self.state = {
            "desktop_notifications_enabled": False,
            "desktop_notifications_critical_only": False,
            "sound_enabled": False,
            "voice_reply_enabled": False,
            "compact_sidebar": False,
            "dense_cards": False,
            "show_emoji_labels": True,
            "auto_open_alert_center_on_critical": True,
            "global_hotkeys_enabled": False,
            "tray_mode_enabled": False,
        }

    def get(self) -> Dict[str, Any]:
        return {"ok": True, "prefs": self.state}

    def update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        for key in self.state.keys():
            if key in payload:
                self.state[key] = bool(payload[key])
        return {"ok": True, "prefs": self.state}