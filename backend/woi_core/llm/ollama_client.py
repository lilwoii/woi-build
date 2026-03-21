from __future__ import annotations
import httpx
from typing import Any, Dict

class OllamaClient:
    def __init__(self, base_url: str, timeout_sec: int = 120):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout_sec

    async def generate(self, model: str, prompt: str, json_mode: bool = False) -> Dict[str, Any]:
        url = f"{self.base_url}/api/generate"
        payload: Dict[str, Any] = {"model": model, "prompt": prompt, "stream": False}
        if json_mode:
            payload["format"] = "json"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            return r.json()

    @staticmethod
    def extract_text(resp: Dict[str, Any]) -> str:
        return (resp.get("response") or "").strip()
