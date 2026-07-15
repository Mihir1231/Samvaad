"""One Qdrant point per chunk (not per document -- the bug this replaces averaged whole-file vectors)."""
from __future__ import annotations

import logging
import uuid

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

logger = logging.getLogger(__name__)

COLLECTION_NAME = "samvaad_documents"
VECTOR_SIZE = 1024  # bge-m3 output dim


class QdrantStore:
    def __init__(self, url: str, api_key: str):
        self.client = AsyncQdrantClient(url=url, api_key=api_key)
        self._ready = False

    async def ensure_collection(self):
        if self._ready:
            return
        collections = await self.client.get_collections()
        names = {c.name for c in collections.collections}
        if COLLECTION_NAME not in names:
            await self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qmodels.VectorParams(size=VECTOR_SIZE, distance=qmodels.Distance.COSINE),
            )
            logger.info(f"Created Qdrant collection: {COLLECTION_NAME}")
            for field_name in ("file_hash", "batch", "branch", "semester", "document_type"):
                await self.client.create_payload_index(
                    collection_name=COLLECTION_NAME,
                    field_name=field_name,
                    field_schema=qmodels.PayloadSchemaType.KEYWORD,
                )
        self._ready = True

    async def upsert_chunks(self, file_hash: str, vectors: list[list[float]], payloads: list[dict]):
        await self.ensure_collection()
        points = [
            qmodels.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{file_hash}::chunk_{i}")),
                vector=vector,
                payload=payload,
            )
            for i, (vector, payload) in enumerate(zip(vectors, payloads))
        ]
        await self.client.upsert(collection_name=COLLECTION_NAME, points=points)

    async def exists_by_hash(self, file_hash: str) -> bool:
        await self.ensure_collection()
        results, _ = await self.client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=qmodels.Filter(
                must=[qmodels.FieldCondition(key="file_hash", match=qmodels.MatchValue(value=file_hash))]
            ),
            limit=1,
        )
        return len(results) > 0

    async def search(self, vector: list[float], filters: dict, limit: int = 5):
        await self.ensure_collection()
        must = [
            qmodels.FieldCondition(key=key, match=qmodels.MatchValue(value=value))
            for key, value in filters.items()
            if value
        ]
        query_filter = qmodels.Filter(must=must) if must else None
        return await self.client.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )
