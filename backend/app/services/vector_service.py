from pinecone import Pinecone, ServerlessSpec
from functools import lru_cache
from typing import List, Dict, Any, Optional
import os
import asyncio

from app.services.logger_service import get_logger

class VectorStoreService:

    def __init__(self, index):
        self.logger = get_logger("vector_store")
        self.index = index  # ✅ Use injected index only

    # ✅ Upsert
    async def upsert(self, vectors: List[Dict], namespace: str = "default"):
        try:
            if not vectors:
                self.logger.warning("No vectors to upsert")
                return

            await asyncio.to_thread(
                self.index.upsert,
                vectors=vectors,
                namespace=namespace
            )

            self.logger.info(f"Upserted {len(vectors)} vectors")

        except Exception as e:
            self.logger.error(f"Upsert failed: {e}")
            raise

    # ✅ Query
    async def query(self, embedding: List[float], top_k: int = 5, namespace: str = "default", filters: Optional[Dict] = None):
        try:
            results = await asyncio.to_thread(
                self.index.query,
                vector=embedding,
                top_k=top_k,
                namespace=namespace,
                filter=filters,
                include_metadata=True
            )
            return results

        except Exception as e:
            self.logger.error(f"Query failed: {e}")
            raise

    # ✅ Delete
    async def delete(self, ids: List[str], namespace: str = "default"):
        try:
            await asyncio.to_thread(
                self.index.delete,
                ids=ids,
                namespace=namespace
            )
            self.logger.info(f"Deleted {len(ids)} vectors")

        except Exception as e:
            self.logger.error(f"Delete failed: {e}")
            raise