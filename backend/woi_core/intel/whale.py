from __future__ import annotations
import os
from typing import Any, Dict, List

class WhaleWatcher:
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        raw = os.getenv("WHALE_ADDRESSES","").strip()
        self.addresses = [a.strip() for a in raw.split(",") if a.strip()]

    async def sample(self) -> Dict[str, Any]:
        if not self.enabled:
            return {"enabled": False}
        # Scaffold: integrate a chain indexer (Alchemy/Infura/Covalent) later.
        return {"enabled": True, "watching": len(self.addresses), "note": "whale tracking scaffold (needs indexer key)"}
