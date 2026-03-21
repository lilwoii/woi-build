from __future__ import annotations
from typing import List
from .structured_store import StructuredMemoryStore
from .vector_store import VectorMemoryStore

class MemoryRetriever:
    def __init__(self, structured: StructuredMemoryStore, vector: VectorMemoryStore):
        self.structured = structured
        self.vector = vector

    async def retrieve_snippets(self, query: str, k: int = 6) -> List[str]:
        try:
            return self.vector.query(query_text=query, n_results=k)
        except Exception:
            return []
