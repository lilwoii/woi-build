from __future__ import annotations

from typing import Dict, Any, List


class HotkeyRegistry:
    def __init__(self) -> None:
        self.items: List[Dict[str, Any]] = [
            {"id": "open-command-center", "combo": "Ctrl+Shift+K", "label": "Open Command Center", "target": "woi-command-center"},
            {"id": "open-alert-center", "combo": "Ctrl+Shift+A", "label": "Open Alert Center", "target": "alert-center"},
            {"id": "open-global-ops", "combo": "Ctrl+Shift+G", "label": "Open Global Ops", "target": "global-ops"},
            {"id": "open-execution", "combo": "Ctrl+Shift+E", "label": "Open Execution Center", "target": "execution-center"},
            {"id": "open-risk", "combo": "Ctrl+Shift+R", "label": "Open Risk Center", "target": "risk"},
        ]

    def list(self) -> Dict[str, Any]:
        return {"ok": True, "items": self.items}