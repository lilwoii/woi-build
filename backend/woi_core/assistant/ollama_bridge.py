from __future__ import annotations

import os
import requests
from typing import Dict, Any, List


class OllamaBridge:
    def __init__(self) -> None:
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        self.model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        self.timeout = int(os.getenv("OLLAMA_TIMEOUT_SEC", "90"))

    def chat(
        self,
        *,
        system_prompt: str,
        user_text: str,
        history: List[Dict[str, str]] | None = None,
        temperature: float = 0.4,
    ) -> Dict[str, Any]:
        history = history or []

        messages = [{"role": "system", "content": system_prompt}]
        for item in history[-12:]:
            role = item.get("role", "user")
            content = item.get("content", "")
            if content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_text})

        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }

        try:
            res = requests.post(url, json=payload, timeout=self.timeout)
            res.raise_for_status()
            data = res.json()
            content = (
                data.get("message", {}).get("content")
                or data.get("response")
                or "WOI received an empty response from Ollama."
            )
            return {
                "ok": True,
                "model": self.model,
                "text": content.strip(),
                "raw": data,
            }
        except Exception as e:
            return {
                "ok": False,
                "model": self.model,
                "text": f"⚠️ Ollama bridge error: {e}",
                "raw": {},
            }