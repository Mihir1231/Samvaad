"""Postgres-backed auth stores (Neon) for admin and faculty accounts."""
from __future__ import annotations

import asyncpg
import bcrypt


class PostgresUserStore:
    def __init__(self, database_url: str, table_name: str):
        self._database_url = database_url
        self._table_name = table_name
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self._database_url, min_size=1, max_size=5)
            async with self._pool.acquire() as conn:
                await conn.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {self._table_name} (
                        id SERIAL PRIMARY KEY,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """
                )
        return self._pool

    async def validate_credentials(self, email: str, password: str) -> bool:
        pool = await self._get_pool()
        row = await pool.fetchrow(f"SELECT password_hash FROM {self._table_name} WHERE email = $1", email)
        if row is None:
            return False
        return bcrypt.checkpw(password.encode(), row["password_hash"].encode())

    async def email_exists(self, email: str) -> bool:
        pool = await self._get_pool()
        row = await pool.fetchrow(f"SELECT 1 FROM {self._table_name} WHERE email = $1", email)
        return row is not None


class AdminStore(PostgresUserStore):
    def __init__(self, database_url: str):
        super().__init__(database_url, "admins")


class FacultyStore(PostgresUserStore):
    def __init__(self, database_url: str):
        super().__init__(database_url, "faculty")
