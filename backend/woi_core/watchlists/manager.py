from __future__ import annotations

from typing import Dict, Any, List


class WatchlistManager:
    def __init__(self) -> None:
        self.data = {
            "stocks": ["SPY", "QQQ", "NVDA", "AMD"],
            "crypto": ["BTC", "ETH", "SOL"],
            "polymarket": ["Fed cut next meeting?", "BTC above 100k by year-end?"],
        }
        self.auto_discovered = {
            "stocks": [],
            "crypto": [],
            "polymarket": [],
        }

    def get_all(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "manual": self.data,
            "auto": self.auto_discovered,
            "merged": {
                "stocks": list(dict.fromkeys(self.data["stocks"] + self.auto_discovered["stocks"])),
                "crypto": list(dict.fromkeys(self.data["crypto"] + self.auto_discovered["crypto"])),
                "polymarket": list(dict.fromkeys(self.data["polymarket"] + self.auto_discovered["polymarket"])),
            },
        }

    def add_manual(self, kind: str, value: str) -> Dict[str, Any]:
        kind = kind.strip().lower()
        value = value.strip()
        if kind not in self.data:
            raise ValueError("kind must be stocks, crypto, or polymarket")
        if value and value not in self.data[kind]:
            self.data[kind].append(value)
        return self.get_all()

    def remove_manual(self, kind: str, value: str) -> Dict[str, Any]:
        kind = kind.strip().lower()
        value = value.strip()
        if kind in self.data and value in self.data[kind]:
            self.data[kind].remove(value)
        return self.get_all()

    def inject_auto(self, kind: str, values: List[str]) -> Dict[str, Any]:
        kind = kind.strip().lower()
        if kind not in self.auto_discovered:
            raise ValueError("kind must be stocks, crypto, or polymarket")
        for value in values:
            cleaned = str(value).strip()
            if cleaned and cleaned not in self.auto_discovered[kind]:
                self.auto_discovered[kind].append(cleaned)
        self.auto_discovered[kind] = self.auto_discovered[kind][:200]
        return self.get_all()