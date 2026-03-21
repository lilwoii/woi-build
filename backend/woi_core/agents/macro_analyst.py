from __future__ import annotations
from .base import Agent, AgentResult

class MacroAnalyst(Agent):
    name = "macro_analyst"
    role = "Pull macro/regime signals (OpenBB) to adjust strategy selection."

    async def run(self, ctx):
        openbb = ctx.signals.get("openbb") or {}
        return AgentResult(self.name, True, {"macro": "scaffold", "openbb_keys": list(openbb.keys())[:10] if isinstance(openbb, dict) else []})
