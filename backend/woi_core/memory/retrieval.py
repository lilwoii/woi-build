from __future__ import annotations

from typing import Any

from .structured_store import StructuredMemoryStore

try:
    from .vector_store import VectorMemoryStore
except Exception:
    VectorMemoryStore = None


class MemoryRetriever:
    def __init__(self, structured: StructuredMemoryStore, vector: Any = None):
        self.structured = structured
        self.vector = vector

    async def retrieve(self, query: str, limit: int = 10):
        structured_results = []
        vector_results = []

        # structured lookup
        if hasattr(self.structured, "search"):
            try:
                structured_results = await self.structured.search(query, limit=limit)
            except Exception:
                structured_results = []

        # vector lookup only if available
        if self.vector is not None and hasattr(self.vector, "search"):
            try:
                vector_results = await self.vector.search(query, limit=limit)
            except Exception:
                vector_results = []

        return {
            "ok": True,
            "query": query,
            "structured": structured_results,
            "vector": vector_results,
            "results": structured_results + vector_results,
        }