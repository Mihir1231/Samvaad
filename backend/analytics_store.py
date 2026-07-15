"""Postgres-backed activity log for the admin dashboard (replaces the local-disk JSONL log,
which doesn't persist across redeploys on most hosts)."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

import asyncpg

logger = logging.getLogger(__name__)


class AnalyticsStore:
    def __init__(self, database_url: str):
        self._database_url = database_url
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self._database_url, min_size=1, max_size=5)
            async with self._pool.acquire() as conn:
                await conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS activity_log (
                        id TEXT PRIMARY KEY,
                        email TEXT NOT NULL,
                        activity_type TEXT NOT NULL,
                        file_type TEXT,
                        file_name TEXT,
                        document_type TEXT,
                        batch TEXT,
                        branch TEXT,
                        semester TEXT,
                        file_size INTEGER,
                        title TEXT,
                        description TEXT,
                        prompt TEXT,
                        email_length INTEGER,
                        upload_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """
                )
        return self._pool

    async def log_upload_activity(self, file_data: dict):
        try:
            pool = await self._get_pool()
            record_id = f"upload_{uuid.uuid4().hex[:12]}"
            filename = file_data["filename"]
            file_type = filename[filename.rfind('.'):].lower() if '.' in filename else ''
            await pool.execute(
                """
                INSERT INTO activity_log (id, email, activity_type, file_type, file_name, document_type, batch, branch, semester, file_size, title, description)
                VALUES ($1, $2, 'file_upload', $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """,
                record_id, file_data.get("uploader_email", "user@college.edu"), file_type, filename,
                file_data["document_type"], file_data["batch"], file_data["branch"], file_data["semester"],
                file_data.get("file_size", 0), file_data["title"], file_data.get("description", ""),
            )
        except Exception as e:
            logger.error(f"Failed to log upload activity: {e}")

    async def log_email_activity(self, email_data: dict):
        try:
            pool = await self._get_pool()
            record_id = f"email_{uuid.uuid4().hex[:12]}"
            now = datetime.now()
            await pool.execute(
                """
                INSERT INTO activity_log (id, email, activity_type, file_type, file_name, document_type, batch, branch, semester, prompt, email_length)
                VALUES ($1, $2, 'email_generation', 'email', $3, 'EmailGeneration', 'N/A', 'N/A', 'N/A', $4, $5)
                """,
                record_id, email_data.get("user_email", "user@college.edu"),
                f"email_{now.strftime('%Y%m%d_%H%M%S')}.txt",
                email_data.get("prompt", ""), len(email_data.get("email_body", "")),
            )
        except Exception as e:
            logger.error(f"Failed to log email activity: {e}")

    async def get_dashboard_records(self, limit: int = 500) -> list[dict[str, Any]]:
        pool = await self._get_pool()
        rows = await pool.fetch(
            """
            SELECT id, email, file_type, file_name, document_type, batch, branch, semester, file_size, title, description, upload_timestamp, activity_type
            FROM activity_log WHERE activity_type = 'file_upload'
            ORDER BY upload_timestamp DESC LIMIT $1
            """,
            limit,
        )
        records = []
        for row in rows:
            ts = row["upload_timestamp"]
            records.append({
                "id": row["id"], "email": row["email"], "date": ts.strftime("%Y-%m-%d"), "time": ts.strftime("%H:%M:%S"),
                "file_type": row["file_type"], "file_name": row["file_name"], "document_type": row["document_type"],
                "batch": row["batch"], "branch": row["branch"], "semester": row["semester"],
                "upload_timestamp": ts.isoformat(), "file_size": row["file_size"], "title": row["title"],
                "description": row["description"], "activity_type": row["activity_type"],
            })
        return records

    async def get_dashboard_stats(self) -> dict[str, int]:
        pool = await self._get_pool()
        total_files = await pool.fetchval("SELECT COUNT(*) FROM activity_log WHERE activity_type = 'file_upload'")
        today_uploads = await pool.fetchval(
            "SELECT COUNT(*) FROM activity_log WHERE activity_type = 'file_upload' AND upload_timestamp::date = CURRENT_DATE"
        )
        weekly_uploads = await pool.fetchval(
            "SELECT COUNT(*) FROM activity_log WHERE activity_type = 'file_upload' AND upload_timestamp >= CURRENT_DATE - INTERVAL '7 days'"
        )
        return {
            "total_files": total_files or 0,
            "total_emails": 0,
            "today_uploads": today_uploads or 0,
            "weekly_uploads": weekly_uploads or 0,
        }
