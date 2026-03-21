from __future__ import annotations
from typing import Dict, Literal
from ..config import WOIConfig
from ..identity import WOIIdentity
from ..memory.retrieval import MemoryRetriever
from ..events import EventBus, WoiEvent
from .ollama_client import OllamaClient
from .prompts import compose_prompt

AITier = Literal["light", "deep"]

class WOIRouter:
    def __init__(self, cfg: WOIConfig, bus: EventBus, retriever: MemoryRetriever):
        self.cfg = cfg
        self.bus = bus
        self.retriever = retriever
        self.identity = WOIIdentity()
        self.ollama = OllamaClient(cfg.ollama_base_url, timeout_sec=cfg.ollama_timeout_sec)

    def choose_model(self, tier: AITier) -> str:
        return self.cfg.model_deep if tier == "deep" else self.cfg.model_light

    async def chat(self, user_message: str, tier: AITier = "deep", mode: str = "assistant") -> Dict[str, str]:
        identity = self.identity.as_dict()
        mem = await self.retriever.retrieve_snippets(user_message, k=6)
        prompt = compose_prompt(identity=identity, memory_snippets=mem, user_message=user_message, mode=mode)
        model = self.choose_model(tier)

        await self.bus.emit(WoiEvent("AI_CHAT_REQUEST", f"Routed to {model}", {"tier": tier, "model": model, "mode": mode}))
        resp = await self.ollama.generate(model=model, prompt=prompt, json_mode=False)
        text = OllamaClient.extract_text(resp)
        await self.bus.emit(WoiEvent("AI_CHAT_RESPONSE", "Generated", {"tier": tier, "model": model, "chars": len(text)}))
        return {"model": model, "tier": tier, "mode": mode, "text": text}
