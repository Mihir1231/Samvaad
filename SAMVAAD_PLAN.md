# Samvaad: Multilingual Enhancement + Free WhatsApp Deployment

## Context

Samvaad is the RAG chatbot for LDRP-ITR, an engineering college in Gandhinagar, Gujarat. Students pick batch/branch/semester/document-type and ask questions over college documents (timetables, fee notices, circulars); parents and visitors get FAQ buttons plus a general RAG agent. Stack: React/Vite frontend, FastAPI backend (`backend/main.py`) with **Qdrant Cloud** as the vector store, **BAAI/bge-m3 hosted on NVIDIA NIM** for embeddings, a **NIM reranker model** for reranking, **Qwen3-32B via NVIDIA NIM** for the LLM, MongoDB for auth.

Two things are wanted: (1) genuinely multilingual conversation and multilingual text extraction from documents, and (2) the same chatbot reachable by anyone on WhatsApp, at zero cost.

Exploration surfaced three facts that reshape the work:

1. **The chat endpoints do not exist.** `Client/src/components/ChatBot.tsx:318-322` POSTs to `localhost:8000/student_query` and `/rag_query`. Neither route is defined in any backend file, and the RAG brain that would serve them (`backend/rag_system.py`) is never imported by anything. The web chatbot does not currently work end-to-end — so there is no working chat API to "just point WhatsApp at." It has to be finished first. (The only thing that runs today is the Streamlit prototype `backend/server.py`, which needs a local Ollama.)
2. **There is zero language support.** No detection, no translation, no `lang` field on any request model, all system prompts are English-only, and every `pytesseract.image_to_string()` call omits `lang=` — so OCR silently defaults to English and returns garbage on any Indic script. The language dropdown in `ChatBot.tsx:97-106` only picks a browser text-to-speech voice; it is never sent to the backend.
3. **Retrieval is structurally broken.** `main.py:186-191` chunks a document, embeds each chunk, then averages them into one vector (`np.mean`) and stores one Chroma record per whole file (`main.py:614`). A 30-page PDF collapses into a single blurred vector. Worse, `TextExtractor` (`main.py:193-208`) does no OCR at all — images are indexed as the literal string `"Image metadata: PNG, (800, 600), RGB"`, and scanned PDFs yield empty text. Working OCR code already exists at `backend/server.py:41-112`, but only inside the Streamlit prototype.

This plan also moves the vector store off local ChromaDB onto **Qdrant Cloud** (free tier is enough for this document volume — see sizing in the Verification/RAM sections) and moves embedding generation off local compute onto the **NVIDIA NIM-hosted bge-m3 endpoint**, so the whole AI stack (embed, rerank, generate) is one API surface, and the HF Space itself carries almost no local model weight.

The plan therefore is: fix the foundation → make it multilingual → put it on WhatsApp. Multilingual answers are worthless if retrieval returns the wrong document, so the ordering is not negotiable.

---

## Locked decisions

- All 22 scheduled Indic languages + English, split into a high-resource tier (direct) and a low-resource tier (translation fallback) — see Phase 3.
- **Embedding: BAAI/bge-m3, hosted on NVIDIA NIM** (API call, multilingual, no local compute). **Reranking: a NIM-hosted reranker model.** **LLM: Qwen3-32B via NVIDIA NIM API.** All three go through the same NIM API key/client.
- **Vector store: Qdrant Cloud** (free tier: 1 node, 4 GiB disk, 1 GiB RAM — comfortably covers the ~60–120 MB expected for hundreds of college documents).
- Host on Hugging Face Spaces free tier (2 vCPU / 16 GB RAM) — now a thin FastAPI orchestrator, since embedding/rerank/generation all live behind NIM and vectors live in Qdrant Cloud.
- Voice notes in → text answers out (Groq `whisper-large-v3` — kept as the sole remaining Groq dependency; see note below).
- $0 target. WhatsApp Cloud API user-initiated service conversations have been free since Nov 2024, so a reactive chatbot never pays for messages. HF Spaces free tier is free to host. Qdrant Cloud's free tier requires no card and covers this project's storage. NVIDIA NIM has a free API tier sufficient for hackathon/demo traffic; Groq's free tier covers speech-to-text (2,000 transcriptions/day).

> **Note on Groq:** the LLM and embedding roles previously filled by Groq (`llama-3.3-70b-versatile`) and `google/embeddinggemma-300m` are fully replaced below by Qwen3-32B (NIM) and BAAI/bge-m3 (NIM). Groq is retained **only** as the Whisper speech-to-text provider for WhatsApp voice notes (Phase 5) — it is not used anywhere in the text/RAG pipeline.

> **Note on the embedding model change:** the same embedding model must produce both the stored document vectors and every query vector, or Qdrant will silently return nonsense (mismatched vector spaces aren't detected — they just retrieve garbage). Since indexing (Phase 2) and querying (Phase 4) both now call the NIM bge-m3 endpoint exclusively, this is automatically satisfied — but if the NIM-hosted bge-m3 is ever swapped for a different model/version, the full index must be rebuilt via `reindex.py`, not incrementally migrated.

---

## Phase 0 — Stabilize (blocks everything else)

**Secrets.** `backend/.env` is committed to git with live API credentials (the same URI is also hardcoded at `backend/server.js:16`). Rotate all keys (including the NVIDIA NIM key and any Google/Groq keys currently in `.env`), add a root `.gitignore`, and `git rm --cached backend/.env backend/node_modules`.

**Deploy blockers.** These will each break a Linux container build:
- `backend/main.py:759` binds `127.0.0.1` → change to `0.0.0.0`.
- `Client/src/components/layout/Layout.tsx:4` imports `"../weatherStrip"` but the file is `WeatherStrip.tsx`. Works on Windows, fails on Linux/Docker.
- `backend/requirements.txt` is unpinned, lists the stdlib `pathlib` as a pip dep (the PyPI `pathlib` is an abandoned backport that breaks installs), and omits `httpx`, which `main.py:30` imports. Rewrite it, pinned.
- ChromaDB lives in three divergent trees (`chromadb_data/`, `chroma_db/`) because `Config.CHROMADB_DIR` is a relative path, so which one is used depends on the working directory at launch. Since the plan moves the vector store to **Qdrant Cloud** (see Phase 2), this fragmentation is resolved by retiring local ChromaDB entirely rather than consolidating it — the three local trees are dropped once `reindex.py` repopulates Qdrant.

---

## Phase 1 — Multilingual text extraction

New module `backend/extraction.py`, replacing the four competing extractors (`main.py`, `server.py`, `app.py`, `rag_system.py`) with one:

```python
@dataclass
class ExtractedDoc:
    text: str
    pages: list[str]
    detected_langs: list[str]   # ISO codes
    used_ocr: bool

def extract(file_bytes: bytes, filename: str, lang_hint: str | None) -> ExtractedDoc: ...
```

- **PDF** — PyMuPDF (`fitz`) `page.get_text()`; if a page yields near-empty text, render it at 300 DPI and OCR it. This hybrid already exists at `backend/server.py:41-84`; port it and add `lang=`.
- **Images** — Tesseract OCR. This replaces the `"Image metadata: ..."` placeholder — the worst bug in the ingestion path.
- **DOCX** — paragraphs plus `doc.tables`, rendered as pipe-separated rows. Currently tables are skipped entirely (`main.py:202`), which is severe for a college bot: timetables and fee structures are tables.
- **XLSX / CSV** — pandas → markdown rows.

OCR is selected by script, not by language. New `backend/languages.py` holds the mapping; the honest coverage picture for the 22 scheduled languages:

| Script | Tesseract pack(s) | Languages covered |
|---|---|---|
| Devanagari | `hin`, `mar`, `san`, `nep` | Hindi, Marathi, Sanskrit + Konkani, Maithili, Dogri, Bodo, Nepali (script convention) |
| Bengali | `ben`, `asm` | Bengali, Assamese (Bengali-script convention) |
| Gujarati / Gurmukhi / Odia | `guj`, `pan`, `ori` | Gujarati, Punjabi, Odia |
| Tamil / Telugu / Kannada / Malayalam | `tam`, `tel`, `kan`, `mal` | Tamil, Telugu, Kannada, Malayalam |
| Perso-Arabic | `urd` | Urdu |
| Ol Chiki / Meetei Mayek | no official pack | Santali, Manipuri (community fallback, best-effort) |

Say this plainly rather than over-promising: official Tesseract packs cover ~19 of 22 languages via 11 scripts. Santali (Ol Chiki) and Manipuri (Meetei Mayek) have no official pack — the community Indic-OCR projects fill the gap, bundled as a best-effort fallback with a clear "OCR quality may be low" flag. Tesseract accepts stacked scripts (`lang="eng+hin+guj"`), which is what we pass by default since college documents routinely mix English with the local language.

---

## Phase 2 — Fix indexing (the retrieval bug)

New module `backend/indexing.py`, and vector storage moves from local ChromaDB to **Qdrant Cloud**:

- One Qdrant point per chunk, not per document. Delete the `np.mean` averaging at `main.py:188` — this was the core bug, and it's collection-engine-agnostic, so it must go regardless of which vector store is used.
- Chunker: paragraph-aware, **600–800 tokens** with **100-token overlap**; `rag_system.py:101-123` already has a table-preserving splitter worth reusing.
- Point id `{file_id}::chunk_{i}`; Qdrant payload carries the existing fields (batch, branch, semester, document_type, filename, …) plus `chunk_index`, `source_lang`, and the chunk text itself (Qdrant, unlike Chroma, doesn't auto-store documents — the raw text must go in the payload explicitly so it can be returned as a citation).
- Cross-lingual trick: call the NIM-hosted bge-m3 endpoint to embed `native_text`, then `qdrant_client.upsert(collection_name=..., points=[PointStruct(id=..., vector=embedding, payload={...})])`. BAAI/bge-m3 is natively multilingual (100+ languages) with strong dense retrieval quality out of the box, so no separate canonical-English vector space is needed — the same embedding space handles Gujarati, Hindi, and English queries against native-language documents directly. Stored, cited text stays in the document's original language.
- Qdrant collection config: 1024 dims (bge-m3's output size), cosine distance.
- `backend/scripts/reindex.py` — rebuild the Qdrant collection from `uploads/` with the new extractor, chunker, and NIM embedding calls. Required once; the existing local Chroma vectors are unusable and are not migrated.

Rewrite `EmbeddingManager` to call **BAAI/bge-m3 via the NVIDIA NIM API** (not a local `sentence-transformers`/FlagEmbedding load) for both queries and documents — no special prefix scheme is required (unlike EmbeddingGemma's `"result | query: "` / `"title: none | text: "` convention, which is removed entirely). bge-m3 supports long documents (up to 8192 tokens); dense-only output is sufficient here. Because embedding now costs a network round-trip per call, batch chunk embedding requests during indexing (send many chunks per NIM call) rather than looping one-chunk-per-call.

---

## Performance optimizations

- Chunk size: 600–800 tokens, 100-token overlap (see Phase 2).
- Retrieve top-5 chunks from Qdrant Cloud.
- Rerank top-5 → top-3 using the **NIM-hosted reranker model** in a single batched call (not one call per candidate).
- Send only the top-3 chunks to Qwen3-32B to reduce prompt size and latency.
- Cache embeddings for repeated/identical queries — this now also saves a NIM API round-trip, not just local compute.
- Cache repeated responses (e.g. common FAQ questions) at the API layer.
- Keep system/user prompts concise — avoid verbose boilerplate on every call.
- Enable response streaming from Qwen3-32B (NIM supports streaming completions) so the frontend/WhatsApp client can render tokens as they arrive.

**Target latency:** average end-to-end response time of **1.0–1.5 seconds** for Tier-1 (no-translation) languages. Note this budget is tighter now that embedding and reranking are both NIM API calls rather than local compute — each hop adds network latency, so batching and caching (above) matter more than in a fully-local setup.

---

## Phase 3 — Multilingual conversation

New module `backend/multilingual.py`. A two-tier strategy, avoiding a translation dependency on every message:

**Language detection** — `detect_language(text) -> (lang, script)`, resolved deterministically by Unicode block (fast, no model) for the common case. The hard case is romanized Indic ("fees kitni hai", "fee kyare bharvani chhe"), which every off-the-shelf detector misreads as English. Handle it with a single cheap classification call to Qwen3-32B (NIM) that returns `{"lang": "hi", "script": "latin"}` instead of relying purely on Unicode-block detection. This avoids shipping AI4Bharat's IndicLID (another ~1 GB model) just for that. The detected language is forwarded to the LLM on every call.

**Tier 1 — high-resource** (English, Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Urdu). Skip translation entirely:

```
User Query → Language Detection → BAAI/bge-m3 Embedding (NIM) → Qdrant Cloud retrieval → NIM reranker → Qwen3-32B → Answer in same language
```

BAAI/bge-m3 embeds and retrieves natively in all of these languages; Qwen3-32B reasons and answers directly in the detected language. No translation hop — low latency, high quality.

**Tier 2 — low-resource** (e.g. Santali, Bodo, Dogri, Maithili, Konkani, Manipuri, and other scheduled languages genuinely weak in current embedding/LLM training data). Pivot through **IndicTrans2** (Apache-2.0, CPU-friendly, covers all 22 scheduled languages), used strictly as a fallback component for languages Tier 1 can't serve well:

- `ai4bharat/indictrans2-indic-en-dist-200M` — query → English
- `ai4bharat/indictrans2-en-indic-dist-200M` — English answer → user's language

```
Query → IndicTrans2 (indic→en) → English → Retrieve (bge-m3 via NIM + Qdrant Cloud) → NIM reranker → Qwen3-32B answers in English → IndicTrans2 (en→indic) → Original language
```

Lazy-loaded, so Tier-1 traffic never pays the RAM or startup cost.

Honest limit: even with IndicTrans2, answer quality for Tier-2 languages will be noticeably below Tier-1 languages. That is a property of the available models, not of this design. All 22 scheduled languages will function; they will not all be equally good, and the plan should not pretend otherwise.

---

## Phase 4 — Build the missing chat API

Port `rag_system.py`'s `ChiefAgent` into `backend/rag.py`, backed by Qwen3-32B via NVIDIA NIM instead of Ollama/Groq:

- `rag_system.py:91` does `eval()` on raw LLM output — a code-execution hole. Replace with `json.loads`.
- Reranking is currently one LLM call per candidate chunk, sequentially — slow and rate-limit-prone at scale. Replace it with a single batched call to the **NIM-hosted reranker model** (e.g. `nvidia/nv-rerankqa-mistral-4b-v3`) over all top-5 candidates at once, returning relevance scores, keeping the top-3 (see Performance optimizations above). This is a dedicated reranker call, not the LLM repurposed for scoring.
- Return sources as a real array (`[{filename, document_type, ...}]`), not appended to the answer string. `ChatBot.tsx:335` already reads `data.sources`.

Then add to `backend/main.py` the two endpoints the frontend has been calling all along — matching the existing contract exactly, plus an optional `lang`:

```
POST /student_query  {batch, branch, semester, doc_type, question, lang?}  ->  {answer, sources[], detected_lang}
POST /rag_query       {question, lang?}                                    ->  {answer, sources[], detected_lang}
```

Keep the graceful filter-widening from `rag_system.py:162-179` (if exact batch/branch/type matches nothing, broaden the search and say so, using Qdrant's payload filters instead of Chroma's `where`). Reuse `main.py`'s embedding manager (now calling **NIM's bge-m3 endpoint**) for the query vector — never embed a query with a different model than the one that wrote the stored vectors; mismatched embedding spaces cause Qdrant to silently return nonsense.

At this point the web chatbot works for the first time, in all Tier-1 and Tier-2 languages.

**Embedding API endpoint.** Expose the bge-m3 embedder (proxied through to NIM) directly, not just internally inside indexing/retrieval, so other tools (admin scripts, evaluation notebooks, a future semantic-search feature) can get vectors without duplicating the NIM-client code:

```
POST /embed  {texts: string[], input_type?: "query" | "document"}  ->  {embeddings: float[][], model: "bge-m3", dim: 1024}
```

- Backed by the same `EmbeddingManager` singleton used by `/student_query`, `/rag_query`, and the indexer — one NIM client, no duplicate API-key handling or retry logic.
- Batches the request into as few NIM API calls as possible rather than looping one-call-per-text.
- `input_type` matters for bge-m3 only insofar as callers may want to keep query vs. document vectors distinguishable for their own downstream use; bge-m3 itself needs no special prefix (see Phase 2).
- Cap `texts` length (e.g. 64) and total character count per request to keep it from being used as an unbounded NIM-quota sink; return 413 past the cap.
- Auth: reuse the existing MongoDB session/JWT auth so this isn't an open unauthenticated inference endpoint (doubly important now since each call spends NIM API quota, not just local CPU).

---

## Phase 5 — WhatsApp

New package `backend/whatsapp/`. Meta WhatsApp Cloud API (not Twilio — Twilio adds a per-message fee on top; Meta's direct API is free for this use case).

- `webhook.py` — `GET /whatsapp/webhook` for Meta's verification handshake (`hub.mode` / `hub.verify_token` / `hub.challenge`); `POST /whatsapp/webhook` to receive. Return 200 immediately and process in a `BackgroundTasks` job — never block or return non-2xx, which would otherwise cause Meta to redeliver and double-answer the user. Verify the `X-Hub-Signature-256` HMAC, and deduplicate on `message.id` (Meta redelivers) via a TTL-indexed Mongo collection.
- `client.py` — send text / interactive buttons / interactive lists via `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`.
- `session.py` — per-`wa_id` conversation state in MongoDB (already available via `MONGO_URI`), 24h TTL.
- `flow.py` — the state machine, mirroring `ChatBot.tsx` exactly, driving the website:

```
START → ROLE ─┬─ STUDENT → BATCH → BRANCH → SEMESTER → DOC_TYPE → ASK (free text)
              └─ VISITOR → FAQ_MENU → ASK (free text)
```

The existing menus fit WhatsApp's interactive limits with room to spare — role is 2 options (buttons cap at 3); batches 4, branches 6, semesters 8, doc types 9, visitor FAQs 5+1 (lists cap at 10 rows). No redesign needed.

**Language on WhatsApp:** auto-detect, no selector. 22 languages is too many for a static menu list, and forcing a menu adds friction for exactly the users this feature is for. The user simply writes in their language and Samvaad replies in it (Tier 1 direct, Tier 2 via IndicTrans2 as above). A `/lang` command offers an explicit override for ambiguous cases (e.g. romanized text).

**Voice notes** — an inbound `type == "audio"` message: download the media, send the OGG/Opus to Groq `whisper-large-v3` (`POST https://api.groq.com/openai/v1/audio/transcriptions`), then run the transcribed text through the normal detection → retrieval → Qwen3-32B pipeline. Free tier allows 2,000 transcriptions/day and far more audio-minutes than a college needs. Huge accessibility win for parents. (This is the one place Groq remains in the architecture — see the note under Locked Decisions.)

**Inbound documents/images** — reuse the Phase-1 extractor, so a student can photograph a notice and ask about it.

Cost stays $0 as long as the bot only ever replies inside the 24-hour service window opened by the user. Never send proactive/marketing template messages — that is the only thing that would start billing.

**Inference flow (updated):**

```
Student → Meta WhatsApp Cloud API → FastAPI → Language Detection → BAAI/bge-m3 (NIM) → Qdrant Cloud → NIM reranker → Qwen3-32B → Answer
```

---

## Phase 6 — Deploy free on Hugging Face Spaces

The original gotcha with this deployment target was that a free Space's disk is ephemeral, so a locally-written vector index would vanish on every restart. **Moving the vector store to Qdrant Cloud (Phase 2) removes this problem entirely** — Qdrant is external, durable-by-default storage; the Space never writes vectors to its own disk, so there is no snapshot/reload dance and no HF-Dataset-repo trick needed for the index.

- On boot: the Space just opens a Qdrant client connection (`QDRANT_URL` + `QDRANT_API_KEY`) — no download step.
- On admin upload: extract → chunk → embed via NIM → `qdrant_client.upsert(...)` directly to Qdrant Cloud. Durable immediately, no separate persistence step.

**Dockerfile** (Space SDK: `docker`):
- `FROM python:3.11-slim`
- `apt-get install -y tesseract-ocr tesseract-ocr-{hin,guj,ben,tam,tel,kan,mal,ori,pan,asm,urd,san,mar,nep} poppler-utils libgl1`
- Listen on port 7860 (HF Spaces requires it), `0.0.0.0`.
- `HF_HOME=/tmp/hf` — the default cache path is not writable in a Space (still needed for IndicTrans2's model cache, which is the only model still loaded locally).

**Secrets via Space settings** (never in the repo): `NVIDIA_NIM_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `GROQ_API_KEY` (Whisper STT only), `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `MONGO_URI`, `HF_TOKEN`.

**RAM budget:** with bge-m3 now called via NIM instead of loaded locally, the Space no longer carries the ~2.2 GB embedder + ~1 GB torch weight. The only local model left is **IndicTrans2** (~800 MB combined, lazy-loaded only when a Tier-2 language actually appears) — everything else (embedding, reranking, LLM) is a remote NIM API call. Local RAM footprint drops to roughly **~1 GB idle, ~1.8 GB when a Tier-2 language triggers IndicTrans2**, out of the 16 GB available — very comfortable headroom, and the Space starts faster since it isn't preloading a 2.2 GB model at boot.

**Deployment notes:**
- BAAI/bge-m3 runs remotely via the NVIDIA NIM API — no local inference weight, no local RAM cost.
- Qdrant Cloud stores multilingual dense vectors produced by bge-m3 (via NIM) — external, durable, free tier (4 GiB disk / 1 GiB RAM) comfortably covers this project's ~60–120 MB index.
- The NIM reranker model is accessed exclusively through the NVIDIA NIM API.
- Qwen3-32B is accessed exclusively through the NVIDIA NIM API — no local inference weight.
- IndicTrans2 is the only model loaded locally, lazily, only when a Tier-2 (low-resource) language is detected.
- WhatsApp uses the Meta Cloud API.
- The Hugging Face Space hosts the FastAPI backend end-to-end (web chat + WhatsApp webhook) as a thin orchestrator over NIM + Qdrant Cloud.

**Webhook URL:** `https://<user>-<space>.hf.space/whatsapp/webhook` — HTTPS with a valid cert out of the box, which Meta requires.

**Uptime:** a free Space sleeps only after 48 hours of inactivity. A free cron-job.org ping every 12h keeps it awake indefinitely.

**Going live for real users:** the Meta test number is free and instant but only messages 5 verified recipients — fine for demos and the hackathon. To open it to any student, attach a real phone number and complete Meta's business verification (free, takes a few days). Messaging remains free either way.

---

## Final technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | FastAPI |
| Authentication | MongoDB |
| Vector Database | **Qdrant Cloud** (free tier) |
| Embedding | **BAAI/bge-m3 (hosted on NVIDIA NIM)** |
| Reranking | **NIM reranker model** |
| OCR | Tesseract OCR |
| Language Detection | Lightweight Unicode-block detector + Qwen3-32B fallback for romanized text |
| Translation | **IndicTrans2** (fallback only, Tier-2 languages, only model still run locally) |
| LLM | **Qwen3-32B (NVIDIA NIM)** |
| Speech-to-Text | Groq Whisper `whisper-large-v3` (voice notes only) |
| Deployment | Hugging Face Spaces |
| Messaging | Meta WhatsApp Cloud API |

---

## Deliverables

The planning documentation requested, written into the repo:
- `SAMVAAD_PLAN.md` (this file) — Phases 0-6: stabilization, multilingual extraction/retrieval/conversation, the missing chat API, WhatsApp, and free-tier deployment, including model IDs and the updated AI stack.

## Files touched

| Action | Path |
|---|---|
| New | `backend/extraction.py`, `backend/indexing.py`, `backend/multilingual.py`, `backend/languages.py`, `backend/rag.py` |
| New | `backend/whatsapp/{webhook,client,session,flow}.py` |
| New | `Dockerfile`, `.gitignore`, `backend/scripts/reindex.py` |
| Modify | `backend/main.py` (add `/student_query`, `/rag_query`, `/embed`, `/whatsapp/*`; fix host/port, embedder calls routed through NIM, per-chunk `qdrant_client.upsert`) |
| Modify | `backend/requirements.txt` (pin; add `httpx`, `PyMuPDF`, `pytesseract`, `pdf2image`, `motor`, `qdrant-client`, `IndicTransToolkit`; remove `FlagEmbedding`/`sentence-transformers`/`chromadb` — embedding is now a NIM API call, not a local model; remove any Groq LLM SDK usage beyond Whisper) |
| Modify | `Client/src/components/layout/Layout.tsx` (import casing — breaks Linux builds) |
| Delete | `backend/{main2,mihir,app}.py`, `backend/routes/auth.js` (a broken duplicate of `server.js`), `backend/chroma_db/`, `backend/chromadb_data/` (both retired in favor of Qdrant Cloud) |

## Verification

1. **Retrieval first.** Run `scripts/reindex.py`, then confirm a search returns the specific fee-notice chunk, not an averaged whole-document vector. This is the fix everything else rests on.
2. **Extraction.** Upload a scanned Gujarati PDF and a table-heavy DOCX; confirm OCR text and table rows both appear in the indexed chunks (today both produce nothing).
3. **Chat API.** `curl /student_query` in English, Hindi (Devanagari), and Gujarati; check the answer is in the input language and `sources[]` is populated.
4. **WhatsApp locally.** `cloudflared tunnel --url http://localhost:8000`, point the Meta webhook at it, message the test number from a verified phone. Walk the full Student flow and the Visitor flow; send a Hindi voice note.
5. **Deployed.** Repoint the webhook at the Space URL, re-run the same checks, and confirm the index survives a Space restart — trivially true now since vectors live in Qdrant Cloud rather than on the Space's ephemeral disk, but verify the Space's `QDRANT_URL`/`QDRANT_API_KEY` secrets are actually wired up correctly after redeploy.
6. **NIM dependency check.** With embedding, reranking, and generation all now going through NVIDIA NIM, confirm behavior when NIM rate-limits or errors (e.g. a burst of concurrent queries during a demo) — the app should surface a clear degraded-service message rather than hanging or crashing, since there's no local fallback for embedding/reranking anymore.
