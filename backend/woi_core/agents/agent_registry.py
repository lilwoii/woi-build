from __future__ import annotations

from typing import Dict, Any, List
from woi_core.agents.agent_profiles import default_agent_profiles


class AgentRegistry:
    def __init__(self) -> None:
        self.agents = {a.agent_id: a for a in default_agent_profiles()}
        self.train_mode = "fast"

    def list(self) -> Dict[str, Any]:
        return {
            "ok": True,
            "train_mode": self.train_mode,
            "items": [agent.to_dict() for agent in self.agents.values()],
        }

    def set_train_mode(self, mode: str) -> Dict[str, Any]:
        mode = (mode or "fast").lower().strip()
        if mode not in {"fast", "deep", "master"}:
            raise ValueError("mode must be fast, deep, or master")
        self.train_mode = mode
        return {"ok": True, "train_mode": self.train_mode}

    def set_enabled(self, agent_id: str, enabled: bool) -> Dict[str, Any]:
        if agent_id not in self.agents:
            raise KeyError(f"Unknown agent_id: {agent_id}")
        self.agents[agent_id].enabled = bool(enabled)
        return {"ok": True, "item": self.agents[agent_id].to_dict()}

    def active_agents(self) -> List[Dict[str, Any]]:
        out = []
        for agent in self.agents.values():
            if not agent.enabled:
                continue
            supported = agent.train_mode_support or ["fast", "deep", "master"]
            if self.train_mode in supported:
                out.append(agent.to_dict())
        return out