from __future__ import annotations

from typing import Dict, Any, List


class DesktopCommandPalette:
    def __init__(self) -> None:
        self.commands: List[Dict[str, Any]] = [
            {"id": "open-globe", "label": "🌍 Open Globe Intel", "target_tab": "globe-intel"},
            {"id": "open-situation", "label": "🌐 Open Situation Room", "target_tab": "situation-room"},
            {"id": "open-command-center", "label": "🗣️ Open Command Center", "target_tab": "woi-command-center"},
            {"id": "open-world-pulse", "label": "📡 Open World Pulse", "target_tab": "world-pulse"},
            {"id": "open-risk", "label": "🛡️ Open Risk Center", "target_tab": "risk"},
            {"id": "open-shadow", "label": "👻 Open Shadow Trading", "target_tab": "shadow"},
            {"id": "focus-macro", "label": "📈 Focus Macro Desk", "target_tab": "globe-intel"},
            {"id": "focus-prediction", "label": "🎯 Focus Prediction Desk", "target_tab": "polymarket"},
        ]

    def search(self, q: str = "") -> Dict[str, Any]:
        q = (q or "").strip().lower()
        if not q:
            return {"ok": True, "items": self.commands}
        return {
            "ok": True,
            "items": [
                cmd for cmd in self.commands
                if q in cmd["label"].lower() or q in cmd["id"].lower() or q in cmd["target_tab"].lower()
            ],
        }