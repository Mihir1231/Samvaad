"""Single client for all three NVIDIA NIM-hosted models: bge-m3 (embed), a reranker, and Qwen3-32B (chat)."""
from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
NIM_RERANK_URL = "https://ai.api.nvidia.com/v1/retrieval/nvidia/reranking"

EMBED_MODEL = os.getenv("NIM_EMBED_MODEL", "nvidia/nv-embedqa-e5-v5")
EMBED_MODEL_FALLBACK = "baai/bge-m3"
RERANK_MODEL = os.getenv("NIM_RERANK_MODEL", "nvidia/rerank-qa-mistral-4b")
LLM_MODEL = os.getenv("NIM_LLM_MODEL", "meta/llama-3.1-8b-instruct")


class NIMClient:
    def __init__(self, api_key: str | None):
        self.api_key = api_key
        self._client: httpx.AsyncClient | None = None

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))
        return self._client

    async def embed(self, texts: list[str], input_type: str = "passage") -> list[list[float]]:
        """input_type: 'passage' for document chunks, 'query' for search queries.
        Falls back to a second model if the primary embedding model errors (NVIDIA-hosted
        functions have intermittent per-model outages independent of the API key/account)."""
        if not texts:
            return []
        client = await self._get_client()
        last_error: Exception | None = None
        for model in (EMBED_MODEL, EMBED_MODEL_FALLBACK):
            payload = {"model": model, "input": texts, "input_type": input_type, "truncate": "END"}
            try:
                resp = await client.post(f"{NIM_BASE_URL}/embeddings", json=payload, headers=self._headers())
                resp.raise_for_status()
                data = resp.json()["data"]
                data.sort(key=lambda item: item["index"])
                return [item["embedding"] for item in data]
            except Exception as e:
                logger.warning(f"NIM embed with model {model} failed: {e}")
                last_error = e
        raise last_error

    async def rerank(self, query: str, passages: list[str], top_n: int) -> list[int]:
        """Indices into `passages`, best-first. Falls back to input order (vector-score order) on failure."""
        if not passages:
            return []
        fallback = list(range(min(top_n, len(passages))))
        try:
            client = await self._get_client()
            payload = {
                "model": RERANK_MODEL,
                "query": {"text": query},
                "passages": [{"text": p} for p in passages],
                "truncate": "END",
            }
            resp = await client.post(NIM_RERANK_URL, json=payload, headers=self._headers())
            resp.raise_for_status()
            rankings = resp.json().get("rankings", [])
            if not rankings:
                return fallback
            ordered = [r["index"] for r in sorted(rankings, key=lambda r: r.get("logit", 0), reverse=True)]
            return ordered[:top_n]
        except Exception as e:
            logger.warning(f"NIM rerank unavailable, using vector-similarity order: {e}")
            return fallback

    async def chat(self, messages: list[dict], temperature: float = 0.3, max_tokens: int = 800) -> str:
        client = await self._get_client()
        payload = {
            "model": LLM_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        resp = await client.post(f"{NIM_BASE_URL}/chat/completions", json=payload, headers=self._headers())
        if resp.status_code >= 400:
            logger.error(f"NIM chat error {resp.status_code}: {resp.text}")
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
