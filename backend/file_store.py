"""Postgres-backed storage for uploaded document bytes (replaces local-disk uploads/, which doesn't
persist across redeploys on most hosts)."""
from __future__ import annotations

import asyncpg


class FileStore:
    def __init__(self, database_url: str):
        self._database_url = database_url
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self._database_url, min_size=1, max_size=5)
            async with self._pool.acquire() as conn:
                await conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS document_files (
                        id SERIAL PRIMARY KEY,
                        filename TEXT NOT NULL,
                        content BYTEA NOT NULL,
                        file_hash TEXT NOT NULL,
                        batch TEXT NOT NULL,
                        branch TEXT NOT NULL,
                        semester TEXT NOT NULL,
                        document_type TEXT NOT NULL,
                        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                        UNIQUE (batch, branch, semester, document_type, filename)
                    )
                    """
                )
        return self._pool

    async def exists(self, batch: str, branch: str, semester: str, document_type: str, filename: str) -> bool:
        pool = await self._get_pool()
        row = await pool.fetchrow(
            "SELECT 1 FROM document_files WHERE batch=$1 AND branch=$2 AND semester=$3 AND document_type=$4 AND filename=$5",
            batch, branch, semester, document_type, filename,
        )
        return row is not None

    async def save(self, filename: str, content: bytes, file_hash: str, batch: str, branch: str, semester: str, document_type: str) -> int:
        pool = await self._get_pool()
        row = await pool.fetchrow(
            """
            INSERT INTO document_files (filename, content, file_hash, batch, branch, semester, document_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
            """,
            filename, content, file_hash, batch, branch, semester, document_type,
        )
        return row["id"]
