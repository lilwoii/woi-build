from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class AgentResult:
    name: str
    ok: bool
    output: Dict[str, Any]

class Agent:
    name: str = "agent"
    role: str = ""

    async def run(self, ctx) -> AgentResult:
        return AgentResult(name=self.name, ok=True, output={})
