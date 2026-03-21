from __future__ import annotations
import os
from typing import Any, Dict, List
import chromadb

class VectorMemoryStore:
    def __init__(self, persist_dir: str, collection_name: str = "woi_memory"):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]] | None = None, ids: List[str] | None = None):
        metadatas = metadatas or [{} for _ in texts]
        self.collection.add(documents=texts, metadatas=metadatas, ids=ids)

    def query(self, query_text: str, n_results: int = 6) -> List[str]:
        res = self.collection.query(query_texts=[query_text], n_results=n_results)
        docs = res.get("documents", [[]])[0] or []
        return [d for d in docs if isinstance(d, str)]
