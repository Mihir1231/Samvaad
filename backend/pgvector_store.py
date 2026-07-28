"""Postgres/pgvector-backed vector store (replaces Qdrant Cloud, which was hitting
free-tier RAM/quota limits). One row per chunk, cosine distance via pgvector's <=> operator."""
from __future__ import annotations

import uuid

import asyncpg

VECTOR_SIZE = 1024  # bge-m3 output dim
FILTER_FIELDS = ("batch", "branch", "semester", "document_type")


class PGVectorStore:
    def __init__(self, database_url: str):
        self._database_url = database_url
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self._database_url, min_size=1, max_size=5)
            async with self._pool.acquire() as conn:
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
                await conn.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id UUID PRIMARY KEY,
                        file_hash TEXT NOT NULL,
                        batch TEXT,
                        branch TEXT,
                        semester TEXT,
                        document_type TEXT,
                        filename TEXT,
                        text TEXT,
                        embedding vector({VECTOR_SIZE}) NOT NULL
                    )
                    """
                )
                await conn.execute(
                    "CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx "
                    "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
                )
                await conn.execute(
                    "CREATE INDEX IF NOT EXISTS document_chunks_file_hash_idx ON document_chunks (file_hash)"
                )
        return self._pool

    async def upsert_chunks(self, file_hash: str, vectors: list[list[float]], payloads: list[dict]):
        pool = await self._get_pool()
        rows = [
            (
                uuid.uuid5(uuid.NAMESPACE_URL, f"{file_hash}::chunk_{i}"),
                file_hash,
                payload.get("batch"),
                payload.get("branch"),
                payload.get("semester"),
                payload.get("document_type"),
                payload.get("filename"),
                payload.get("text"),
                str(vector),
            )
            for i, (vector, payload) in enumerate(zip(vectors, payloads))
        ]
        async with pool.acquire() as conn:
            await conn.executemany(
                """
                INSERT INTO document_chunks (id, file_hash, batch, branch, semester, document_type, filename, text, embedding)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
                ON CONFLICT (id) DO UPDATE SET
                    file_hash = EXCLUDED.file_hash, batch = EXCLUDED.batch, branch = EXCLUDED.branch,
                    semester = EXCLUDED.semester, document_type = EXCLUDED.document_type,
                    filename = EXCLUDED.filename, text = EXCLUDED.text, embedding = EXCLUDED.embedding
                """,
                rows,
            )

    async def exists_by_hash(self, file_hash: str) -> bool:
        pool = await self._get_pool()
        row = await pool.fetchrow("SELECT 1 FROM document_chunks WHERE file_hash = $1 LIMIT 1", file_hash)
        return row is not None

    async def search(self, vector: list[float], filters: dict, limit: int = 5):
        pool = await self._get_pool()
        conditions = []
        args: list = [str(vector)]
        for field in FILTER_FIELDS:
            value = filters.get(field)
            if value:
                args.append(value)
                conditions.append(f"{field} = ${len(args)}")
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        args.append(limit)
        query = f"""
            SELECT id, file_hash, batch, branch, semester, document_type, filename, text,
                   embedding <=> $1::vector AS distance
            FROM document_chunks
            {where}
            ORDER BY embedding <=> $1::vector
            LIMIT ${len(args)}
        """
        rows = await pool.fetch(query, *args)
        return [_Hit(row) for row in rows]


class _Hit:
    """Mimics the qdrant_client hit shape (`.payload`) so main.py doesn't need to change."""

    def __init__(self, row: asyncpg.Record):
        self.payload = {
            "file_hash": row["file_hash"], "batch": row["batch"], "branch": row["branch"],
            "semester": row["semester"], "document_type": row["document_type"],
            "filename": row["filename"], "text": row["text"],
        }
        self.score = 1 - row["distance"]
