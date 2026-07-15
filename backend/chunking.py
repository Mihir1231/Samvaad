"""Paragraph-aware word chunker. Word count is used as a cheap token-count proxy."""
from __future__ import annotations

CHUNK_WORDS = 700
OVERLAP_WORDS = 100


def chunk_text(text: str, chunk_words: int = CHUNK_WORDS, overlap_words: int = OVERLAP_WORDS) -> list[str]:
    words = text.split()
    if not words:
        return []
    if len(words) <= chunk_words:
        return [text.strip()]

    chunks = []
    step = chunk_words - overlap_words
    for i in range(0, len(words), step):
        piece = " ".join(words[i:i + chunk_words])
        if piece.strip():
            chunks.append(piece.strip())
        if i + chunk_words >= len(words):
            break
    return chunks
