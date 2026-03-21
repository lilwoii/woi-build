from __future__ import annotations
from .base import Agent, AgentResult

class RiskManager(Agent):
    name = "risk_manager"
    role = "Enforce risk, caps, cooldowns, and stop conditions."

    async def run(self, ctx):
        # Scaffold: set per-tick risk budget and veto flags
        return AgentResult(self.name, True, {"risk_budget_usd": 10, "veto": False})
