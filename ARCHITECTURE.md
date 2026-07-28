# Samvaad — System Architecture

Samvaad is the RAG-based multilingual assistant for **LDRP-ITR**, an engineering college in Gandhinagar, Gujarat. It has three user-facing surfaces (Student chatbot, Parent/Visitor chatbot, Admin/Faculty portal) built on a single FastAPI backend, an external vector database (Qdrant Cloud), and three NVIDIA-NIM-hosted models (embedding, reranker, LLM) plus one Groq-hosted model (email drafting).

> This document describes the **actual, current code** in `backend/` and `Client/`, not the aspirational roadmap in `SAMVAAD_PLAN.md`. Where the two disagree (they do, in a few important places), this document says so explicitly.

---

## 1. High-level system map

```
                                   ┌─────────────────────────────┐
                                   │        React / Vite SPA      │
                                   │        (Client/)             │
                                   │                               │
                                   │  Public site  ChatBot widget  │
                                   │  AdminDashboard (admin/fac.)  │
                                   └───────────────┬───────────────┘
                                                   │ HTTPS / JSON
                                                   ▼
                                   ┌─────────────────────────────┐
                                   │   FastAPI backend (main.py)  │
                                   │   single process, no queue,  │
                                   │   no message broker           │
                                   └───┬─────────┬─────────┬──────┘
                       ┌───────────────┘         │         └───────────────┐
                       ▼                         ▼                         ▼
          ┌─────────────────────┐   ┌─────────────────────────┐  ┌─────────────────────┐
          │  NVIDIA NIM API      │   │   Qdrant Cloud            │  │  Neon Postgres        │
          │  - bge-m3 (embed)    │   │   1 collection,           │  │  - admins/faculty     │
          │  - nv-rerankqa (rer.)│   │   1 point per chunk       │  │  - activity_log       │
          │  - Llama-3.1-8B (LLM)│   │                            │  │  - document_files     │
          └─────────────────────┘   └─────────────────────────┘  └─────────────────────┘
                       ▲
                       │ (OCR, separate hosted model, not NIM)
          ┌─────────────────────────┐        ┌─────────────────────┐
          │ HF Space: baidu/        │        │  Groq API             │
          │ Unlimited-OCR (Gradio)  │        │  llama-3.1-8b-instant │
          │ ZeroGPU                 │        │  (email drafting only)│
          └─────────────────────────┘        └─────────────────────┘
```

There is **no agent framework, no message queue, no background workers, and no WhatsApp integration in the running code.** Everything happens synchronously inside FastAPI request handlers (with a `ThreadPoolExecutor` used only to run the blocking document-extraction step off the event loop).

---

## 2. "How many agents?" — the honest answer

This is worth addressing head-on because the codebase contains **two very different designs that look similar on the surface**:

| File | Status | Design |
|---|---|---|
| `backend/main.py` | **Live, imported by nothing else, this is the app** | A linear function pipeline: `extract → chunk → embed → upsert` for ingestion, `embed query → search → rerank → generate` for chat. No agent classes, no orchestrator, no coordinator. |
| `backend/rag_system.py` | **Dead code** — never imported by `main.py` or anything else | A genuine multi-agent design (`ChiefAgent` coordinating `BatchAgent`, `DepartmentAgent`, `SemesterAgent`, `DocumentTypeAgent`, `QueryAnalysisAgent`, `ChunkingAgent`, `ReRankingAgent`), built for a local Ollama + ChromaDB stack that predates the current NIM/Qdrant/Postgres stack. |
| `backend/chatbot.py` | **Dead code** — never imported | An older Ollama+ChromaDB FastAPI prototype (`EmbeddingManager`, `ChromaDBManager`) with `/api/search` and `/api/answer-query` endpoints. Superseded by `main.py`. |
| `backend/app.py` | **Dead code** — never imported | A Streamlit prototype for manually OCR-ing a single PDF into ChromaDB, using local `pytesseract` + `pdf2image`. This is the app SAMVAAD_PLAN.md refers to as "the only thing that runs today" — it predates the current design and is not part of the request pipeline anymore. |

**So: in the code that actually runs, there is no "coordinator agent."** The seven-agent `ChiefAgent` design in `rag_system.py` was the original concept, but it was rewritten into a flat pipeline when the stack moved to NIM + Qdrant + Postgres, because at that point the responsibilities each agent used to hold (batch/branch/semester filtering, chunking, reranking, LLM re-scoring) collapsed into: Qdrant payload filters (batch/branch/semester/doc_type), one shared chunker, and one NIM reranker call. If you see documentation, memory, or comments elsewhere calling this a "multi-agent system," that description is stale — treat `rag_system.py` and `chatbot.py` as historical prototypes, not live components, and consider deleting them to avoid this exact confusion.

The two functions that *are* the live "brain" of the app are both in `backend/main.py`:
- `index_document()` — the ingestion pipeline (§5)
- `answer_query()` — the retrieval/answer pipeline (§8)

---

## 3. Technology stack (as implemented)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript, Tailwind, shadcn/ui | `Client/` |
| Backend | FastAPI (Python), single `main.py` module | `backend/main.py`, 651 lines |
| Vector store | **Qdrant Cloud** | one collection `samvaad_documents`, 1024-dim, cosine distance |
| Embedding model | **BAAI/bge-m3**, called via NVIDIA NIM's OpenAI-compatible `/embeddings` endpoint | `backend/nim_client.py` |
| Reranker | **`nvidia/nv-rerankqa-mistral-4b-v3`**, via NVIDIA NIM's dedicated reranking endpoint | separate URL from the chat/embed endpoint |
| LLM (chat/answer generation) | **`meta/llama-3.1-8b-instruct`** via NVIDIA NIM chat completions | env-overridable via `NIM_LLM_MODEL`; this is *not* Qwen3-32B — see §11 |
| OCR | **Hosted Gradio Space `baidu/Unlimited-OCR`** (ZeroGPU), called over the network via `gradio_client` | *not* local Tesseract — see §7 and §11 |
| Language detection | Pure Unicode code-point range matching (`backend/languages.py`) | no ML model, no romanized-text handling |
| Relational storage | **Postgres (Neon)**, via `asyncpg` connection pools | admin/faculty credentials, activity log, uploaded file bytes |
| Email drafting LLM | **Groq** (`llama-3.1-8b-instant`, with fallback models), direct HTTP, independent of NIM | `DirectHTTPEmailGenerator` in `main.py` |
| Auth | Custom HMAC-SHA256 signed tokens, 24h TTL, `bcrypt` password hashes | `backend/auth_tokens.py`, `backend/admin_store.py` |
| Deployment | Docker (Render) and/or Vercel serverless (`vercel.json`) | see §11 |

---

## 4. Repository layout

```
backend/
  main.py            FastAPI app: all endpoints, Config, in-process pipeline functions
  extraction.py       extract() — the single multilingual text extractor (PDF/DOCX/image/xlsx/csv/txt)
  chunking.py         chunk_text() — word-count-based paragraph-aware chunker
  languages.py        detect_script() / simple_lang_code() — Unicode-range language guesser
  nim_client.py        NIMClient — embed() / rerank() / chat(), one client for all 3 NIM models
  qdrant_store.py       QdrantStore — collection lifecycle, upsert_chunks(), search(), exists_by_hash()
  admin_store.py         Postgres-backed AdminStore / FacultyStore (bcrypt password check)
  analytics_store.py     Postgres-backed activity_log (uploads + email generations) for the dashboard
  file_store.py          Postgres BYTEA storage of the raw uploaded file bytes
  auth_tokens.py          HMAC-signed session tokens (not JWT, hand-rolled)
  rag_system.py    (dead) legacy multi-agent ChromaDB/Ollama RAG prototype
  chatbot.py       (dead) legacy ChromaDB/Ollama FastAPI prototype
  app.py           (dead) Streamlit OCR-to-ChromaDB prototype
  Dockerfile, render.yaml, vercel.json     deployment configs (both targets present)

Client/src/
  components/ChatBot.tsx          the floating chat widget (Student + Parent/Visitor flows)
  pages/AdminDashboard.tsx         admin portal: upload, student/visitor upload, email drafter, analytics
  pages/auth/AdminLogin.tsx, FacultyLogin.tsx
  pages/FacultyDashboard.tsx        stub only — no real faculty features implemented yet
  lib/api.ts                        API_BASE_URL, read from VITE_API_BASE_URL
```

---

## 5. Document ingestion (admin upload → indexed & searchable)

Entry points: `POST /api/upload` (admin, requires classification fields) and `POST /api/upload-student-document` (student/visitor, no classification — see §6). Both funnel into the same `index_document()` helper in `main.py`.

### 5.1 What the admin must select before uploading

The admin upload form (`DocumentUpload` in `AdminDashboard.tsx`) requires, before the file can be submitted:

| Field | Purpose | Options (hardcoded in the frontend) |
|---|---|---|
| **Batch** | which cohort the document applies to | `2022-26`, `2023-27`, `2024-28`, `2025-29` |
| **Branch** | department | Computer / IT / Mechanical / Electrical & Communication / Electrical Engineering |
| **Semester** | 1–8 | rendered as `Semester N` in the payload |
| **Document Type** | one of 9 enum values (`ExamForm`, `FeesNotice`, `ExamTimetable`, `Circular`, `EventInformation`, `ClassTimeTable`, `SeminarInformation`, `GeneralNotice`, `GeneralInformation`) | validated server-side against `DocumentType` (a Pydantic `Enum`) |
| **Title** | free text, used as a stand-in when extraction returns nothing | required |
| **Description** | free text | optional |
| **File** | the document itself | required, ≤ 50MB, extension must be one of `.pdf .doc .docx .txt .jpg .jpeg .png .xlsx .csv` |

These five classification fields (batch, branch, semester, document_type, plus filename) become the **Qdrant payload filter keys** used at query time — this is exactly how the student chatbot narrows retrieval to "only documents relevant to *this* student's batch/branch/semester/doc type" (§8). Get any of these wrong at upload time and the document becomes unreachable from the matching student query filter (though `answer_query()`'s filter-widening logic provides a safety net — see §8.3).

### 5.2 Server-side upload flow (`upload_document` in `main.py:428`)

1. **Validate**: extension allow-list + 50MB size cap (`validate_file`).
2. **Buffer to a temp file**, then read it back into memory and compute a **SHA-256 hash** of the raw bytes (`calculate_file_hash_from_stream`).
3. **Duplicate check by content hash**: `qdrant_store.exists_by_hash(file_hash)` — if any existing chunk in Qdrant carries this exact file hash, reject as a duplicate. This catches re-uploads of byte-identical files even under a different filename.
4. **Duplicate check by identity** (batch, branch, semester, document_type, filename) via `file_store.exists(...)` — catches "same logical slot, different content" collisions (e.g. re-uploading a corrected version under the same name is rejected; the admin must rename).
5. Build a **metadata dict**: `title, description, filename, document_type, batch, branch, semester, file_path (a synthetic logical path string), upload_date`.
6. Call `index_document()` (§5.3) — this is where extraction, chunking, embedding, and Qdrant upsert happen.
7. Persist the **raw file bytes** to Postgres via `file_store.save(...)` (so the original document can be retrieved/audited later — Qdrant only ever stores chunk text, never the original file).
8. Log the upload to `analytics_store` (feeds the Analytics dashboard, §10).
9. Return `{success, message, file_id, hash}`. `file_id` is a synthetic string (`batch-branch-semester-doctype-<8 hex chars>`), not a database primary key — it exists only for the client's own bookkeeping.

### 5.3 `index_document()` — extract → chunk → embed → upsert (`main.py:220`)

```python
doc = extract_document(file_content, filename)     # off the event loop, via ThreadPoolExecutor
chunks = chunk_text(doc.text)                        # ~700-word chunks, 100-word overlap
vectors = await nim_client.embed(chunks, input_type="passage")   # one batched NIM call
# one Qdrant point per chunk, payload = metadata + {chunk_index, source_lang, text, file_hash}
await qdrant_store.upsert_chunks(file_hash, vectors, payloads)
```

Two design points worth calling out explicitly, because they were historically bugs in an earlier version of this system (see the "Retrieval is structurally broken" note in `SAMVAAD_PLAN.md`, which described the *previous* implementation, not this one):

- **One vector per chunk, never averaged.** The old design embedded every chunk and then `np.mean`'d them into a single vector per document — this collapsed a 30-page PDF into one blurry point and made retrieval useless. The current code stores each chunk as its own Qdrant point (`qdrant_store.py:40`), with a deterministic id `uuid5(NAMESPACE_URL, f"{file_hash}::chunk_{i}")` so re-indexing the same file is idempotent (same input → same point IDs → upsert overwrites, doesn't duplicate).
- **Batched embedding, not one-call-per-chunk.** `nim_client.embed()` sends the entire chunk list to NIM in a single HTTP request and re-sorts the response by the `index` field the API returns, since NIM does not guarantee response ordering matches request ordering under the hood.

### 5.4 Chunking (`chunking.py`)

A simple, cheap **paragraph-then-word-count** chunker: split on blank lines is not actually done — it just splits on raw whitespace into a word list and slides a window:

- `CHUNK_WORDS = 700`, `OVERLAP_WORDS = 100` → step = 600 words per chunk.
- Word count is used as a **cheap proxy for token count** (not an actual tokenizer call — no `tiktoken`/model-specific tokenizer is used anywhere in this repo). This is an approximation: for CJK-adjacent or non-whitespace-segmented scripts it would be inaccurate, but for space-delimited scripts (Latin, Devanagari, Gujarati, etc. — all of this college's actual documents) it's a reasonable and fast approximation.
- If the whole document is ≤ 700 words, it's returned as a single chunk (no overlap needed).

### 5.5 What file types are accepted, and what happens to each

The **admin upload** endpoint enforces the allow-list `{.pdf .doc .docx .txt .jpg .jpeg .png .xlsx .csv}` at `validate_file()`. The **student/visitor upload** endpoint (§6) explicitly passes `check_extension=False` — **any file type is accepted** from that path, subject only to the 50MB size cap.

`extraction.py`'s `extract()` dispatches purely on file extension:

| Extension | Extraction path |
|---|---|
| `.pdf` | PyMuPDF (`fitz`) `page.get_text()` per page; if a page's extracted text is under 20 characters, it's treated as a scan and rendered to a 300-DPI PNG, then sent to the hosted OCR model (§7) |
| `.jpg / .jpeg / .png` | Sent directly to the hosted OCR model, no text-layer check |
| `.docx` | `python-docx`: paragraph text + every table, with table rows rendered as `cell | cell | cell` pipe-joined strings (so timetables/fee tables survive as searchable text, not silently dropped) |
| `.xlsx / .csv` | loaded via `pandas`, converted to a Markdown table (`df.to_markdown()`) |
| `.txt / .md` | decoded as UTF-8 (`errors="ignore"`) |
| anything else (e.g. a file type accepted only via the student/visitor "any file" path) | returns empty text; `index_document()` then falls back to indexing just the title/filename as a one-line placeholder document, rather than failing the upload |

After extraction, `detect_script(text)` (§9) runs over the extracted text to tag `detected_langs`, which becomes the chunk payload's `source_lang`.

---

## 6. Student/Visitor self-upload path

A second upload endpoint, `POST /api/upload-student-document`, exists for the "Student & Visitor Document Upload" admin-portal page (`StudentVisitorUpload` in `AdminDashboard.tsx`) — despite the name, this is still reached through the admin portal's sidebar, not the public chatbot widget. It:

- Accepts **any file extension** (`validate_file(file, check_extension=False)`).
- Auto-derives a `title` from the filename (snake_case → Title Case) and a generic description.
- Tags the document with synthetic classification values: `batch="Student/Visitor"`, `branch="N/A"`, `semester="N/A"`, `document_type="GeneralQuery"` — meaning these documents are **not** reachable via the batch/branch/semester-filtered `/student_query` endpoint, only via the unfiltered `/rag_query` endpoint (§8), since that's the only query path with no classification filters.
- Same hash-based dedup and Postgres persistence as the admin path.

---

## 7. OCR — how scanned/image content becomes searchable text

This is one of the two biggest divergences from `SAMVAAD_PLAN.md`, which specifies Tesseract. **The live code does not use Tesseract at all.**

- OCR is delegated to a **hosted Gradio Space**, `baidu/Unlimited-OCR`, called over the network via the `gradio_client` Python package (`extraction.py:31`). This is a deliberate choice: the plan doc itself explains the reasoning was to support deployment on Vercel's serverless Python runtime, which cannot install system binaries like `tesseract-ocr` or `poppler-utils`.
- The client is **lazily constructed** (`_get_ocr_client()`) so that `HF_OCR_SPACE` / `HF_TOKEN` env vars are read only after `main.py`'s `load_dotenv()` has already populated `os.environ` — constructing it eagerly at import time would read stale/empty values.
- Call shape: the image is saved to a temp PNG, then `client.predict(image_path=handle_file(tmp_path), mode="gundam", prompt="document parsing.", api_name="/run_ocr")`. `HF_TOKEN` is optional but improves ZeroGPU queue priority (ZeroGPU Spaces time-slice free GPU access and prioritize authenticated callers).
- Failure mode: any exception (network error, Space cold-start timeout, ZeroGPU queue full) is caught and logged, and OCR returns an **empty string** rather than raising — so a failed OCR call degrades to "no text extracted for this page," not a crashed upload.
- **No language hint is passed to the OCR model** — unlike the Tesseract-based design in the plan (which would pass `lang="eng+hin+guj"` etc.), this model presumably does its own script/language inference internally; the backend has no control over or visibility into that.
- Triggering rule for PDFs: a page is OCR'd only if `page.get_text()` yields under 20 characters — i.e., PyMuPDF's native text layer is trusted first, and OCR is the fallback for image-only/scanned pages, not the default path.

---

## 8. Retrieval and answer generation (the chat pipeline)

Two endpoints share one implementation function, `answer_query()` (`main.py:252`):

```
POST /student_query   {batch, branch, semester, doc_type, question, lang?}
POST /rag_query        {question, lang?}
```

`student_query` builds a Qdrant filter dict from the four classification fields and calls `answer_query`; `rag_query` calls it with an **empty filter dict** (search the entire collection, no narrowing) — this is the path both the "Ask Other Query" visitor flow and any future general-purpose search would use.

### 8.1 Step 1 — language detection

`detected_lang = lang_hint or simple_lang_code(detect_script(question)[0])`. If the client didn't pass an explicit `lang`, the backend Unicode-scans the question text, finds the most-frequent non-Latin script block present, and maps it to an ISO code (`languages.py`). **This is not a statistical or ML language detector** — it is pure code-point range matching (Devanagari→hi, Gujarati→gu, Bengali→bn, Gurmukhi→pa, Oriya→or, Tamil→ta, Telugu→te, Kannada→kn, Malayalam→ml, Urdu→ur, anything else→en/latin). It cannot distinguish, e.g., Hindi from Marathi (both Devanagari) or detect romanized Indic text typed in Latin script ("fees kitni hai" is detected as English) — this limitation is called out explicitly in `SAMVAAD_PLAN.md` §3 as a known gap, and no mitigation for it (the plan's proposed "cheap LLM classification call" fallback) is implemented in the live code.

### 8.2 Step 2 — embed the question and search Qdrant

- `nim_client.embed([question], input_type="query")` — same `bge-m3` model as indexing, called with `input_type="query"` rather than `"passage"` (bge-m3 doesn't require special text prefixes the way some embedding models do, but the API still lets you tag which mode a call represents).
- `qdrant_store.search(query_vector, filters, limit=5)` — cosine similarity search, top **5** hits (`Config.RETRIEVE_TOP_K = 5`), constrained to whichever filter fields are non-empty.

### 8.3 Step 3 — graceful filter widening (only for `/student_query`)

If the exact-filter search returns nothing, `answer_query()` progressively drops filters, most-specific first, until something matches:

```
drop document_type → still empty? drop semester → still empty? drop branch → still empty? drop batch
```

It stops at the first widening step that returns hits, and sets `widened_search=True` in the response so the frontend/caller can (in principle) tell the user their result set was broadened — though the current `ChatBot.tsx` does not surface this flag to the user at all; it only reads `answer` and `sources`.

If even a fully unfiltered search returns nothing, the endpoint returns a canned "I couldn't find anything relevant..." answer with an empty `sources` list, rather than calling the LLM at all (saving a NIM call on a query that has no retrieved context to answer from).

### 8.4 Step 4 — rerank

The top-5 vector-search hits are reranked by a **dedicated NIM reranker model** (`nvidia/nv-rerankqa-mistral-4b-v3`), in **one batched HTTP call** carrying the query plus all 5 passages, cut down to the top **3** (`Config.RERANK_TOP_N = 3`). The rerank endpoint is a separate URL (`https://ai.api.nvidia.com/v1/retrieval/nvidia/reranking`) from the embed/chat endpoint (`https://integrate.api.nvidia.com/v1`) — NIM exposes reranking through NVIDIA's retrieval-specific API surface, not the general chat-completions surface.

If the rerank call fails for any reason (timeout, malformed response, model unavailable), `nim_client.rerank()` **falls back to the original vector-similarity order** (`fallback = list(range(min(top_n, len(passages))))`) rather than raising — so a reranker outage degrades quality slightly instead of breaking the chat endpoint entirely.

### 8.5 Step 5 — build context and call the LLM

The top-3 (post-rerank) chunks are each wrapped as `[Source: {filename}]\n{chunk text}` and joined with `---` separators. The system prompt is fixed and short:

> "You are Samvaad, the multilingual assistant for LDRP-ITR... Answer the student's/visitor's question using ONLY the provided context. If the context does not contain the answer, say so honestly rather than guessing. Respond in the same language as the question (language code: `{detected_lang}`). Be concise and directly helpful."

This is sent to `meta/llama-3.1-8b-instruct` via NIM chat completions (`temperature=0.3, max_tokens=800, stream=False` — **no token-by-token streaming to the frontend**, despite the plan document recommending it; the whole answer is generated server-side, then returned as one JSON blob).

### 8.6 Response shape

```json
{
  "answer": "...",
  "sources": ["FeeNotice_Sem1.pdf", "..."],
  "detected_lang": "gu",
  "widened_search": false
}
```

`sources` is deduplicated by filename (a real array, per-source, matching what `ChatBot.tsx:335` expects) — not string-appended into the answer text the way the legacy `rag_system.py` prototype did (`"\n\n---\n*📚 Sources Consulted:*\n..."` baked into the response body).

### 8.7 What is *not* implemented (contrary to the plan document)

- **No reranker-then-generate token budget tuning beyond top-3** — this part matches the plan.
- **No translation tier / IndicTrans2** — the plan's "Tier 1 direct / Tier 2 pivot-through-IndicTrans2" design for low-resource languages is entirely unimplemented. Every language gets the same treatment: detect script → tell the LLM which language code to answer in → hope the LLM (an 8B-parameter general instruction model, not a specialized multilingual model) can actually produce fluent output in that language. For genuinely low-resource scheduled languages, quality is whatever the base LLM can do zero-shot; there is no fallback or quality floor.
- **No WhatsApp integration** — `backend/whatsapp/` does not exist. Phase 5 of the plan is unbuilt.
- **No response streaming, no embedding cache, no response cache** — all "Performance optimizations" listed in the plan (query embedding cache, FAQ response cache, streaming) are aspirational, not present in `main.py`.
- **No `/embed` API endpoint** — the plan's proposed generic embedding-proxy endpoint doesn't exist; `nim_client` is only called internally.

---

## 9. Chatbot — end-to-end user flow (`ChatBot.tsx`)

The floating chat widget is a **client-side state machine** (React `useState`, not driven by any backend session/conversation state — every message exchange is a fresh, stateless HTTP call with no memory of prior turns passed back to the LLM). Two distinct roles branch at the very first message:

```
Bot: "Welcome to LDRP! ... please select your role."
        │
        ├── "I am a Student"  ──────────────────────────────────────────┐
        │                                                                │
        └── "I am a Parent / Visitor"                                    │
                 │                                                       │
                 ▼                                                       ▼
      Show 5 canned FAQ buttons +          Show 4 dropdowns: Batch, Branch,
      "Ask Other Query"                    Semester, Document Type
                 │                                    │
     ┌───────────┴───────────┐                       │  (student types a free-text question
     ▼                       ▼                       │   while these selectors are visible)
 FAQ button clicked    "Ask Other Query"              ▼
     │                       │                POST /student_query
     ▼                       ▼                {batch, branch, semester,
 Answer served         isAgentMode = true       doc_type, question}
 from a hardcoded      (free-text input                │
 JS dict — NO           enabled)                        ▼
 backend call at all         │                   answer + sources[]
     │                       ▼                          │
     │                POST /rag_query                   ▼
     │                {question}   (no filters —   shown in chat, then bot
     │                 searches whole collection)   auto-resets to main menu
     │                       │
     │                       ▼
     │                answer + sources[]
     │                       │
     └───────────────────────┴──► shown in chat, then bot resets to the visitor FAQ menu
```

Key details:

- **The 5 visitor FAQ answers are hardcoded strings in the frontend** (`predefinedVisitorAnswers` in `ChatBot.tsx`) — college timings, admission documents, fee-structure pointer, anti-ragging policy, placement blurb. These never touch the backend or the RAG pipeline at all; they're static copy.
- Only **"Ask Other Query"** (visitor) or **any typed question** (student) actually invokes the RAG pipeline.
- The student flow's batch/branch/semester/doc-type selectors default to `2022-26 / computer_engineering / Semester 1 / ExamForm` and are always visible once "I am a Student" is chosen — the student can change them per-question.
- After every answered question, the bot **auto-resets**: students go back to the batch/branch/semester/doc-type + input state, visitors go back to the FAQ menu — so this is a single-question-at-a-time interaction pattern, not a running conversation.
- **Speech**: browser-native `SpeechRecognition` (voice-to-text input) and `speechSynthesis` (text-to-speech playback of bot answers, with a language dropdown limited to whatever `SpeechSynthesisVoice`s the browser reports as available) — both entirely client-side Web APIs, no backend speech processing (Groq Whisper is mentioned in the plan for WhatsApp voice notes only, and even that is unbuilt).
- The `API_BASE_URL` the widget calls is `import.meta.env.VITE_API_BASE_URL`, falling back to `http://127.0.0.1:8000` — so a production build must have this env var set at build time or the widget silently targets localhost.

---

## 10. Admin portal — the four modules

`AdminDashboard.tsx` is a single-page app with a sidebar switching between four views. Login gating differs oddly by section: the **Upload / Student-upload / Email-drafter pages have no auth check at all** in the frontend (any visitor who reaches `/admin` — routing itself is defined in `App.tsx`, not shown here — can use them); only the **Analytics** page requires a login (`DashboardLogin` → `POST /api/dashboard/login`).

### 10.1 Document Upload (§5) and Student/Visitor Upload (§6)
Covered above.

### 10.2 AI Email Drafter

- `POST /api/draft-email {prompt}` → `DirectHTTPEmailGenerator.generate_optimized_email()`.
- Runs on **Groq**, not NIM — a deliberately separate, independent AI dependency (`GROQ_API_KEY`, `https://api.groq.com/openai/v1/chat/completions`), so an outage of the NIM stack doesn't take down email drafting and vice versa.
- Tries a **fixed list of Groq models in order** (`llama-3.1-8b-instant → llama3-8b-8192 → llama-3.1-70b-versatile → llama3-70b-8192`), moving to the next only if the current one returns a non-200 or throws — a manual fallback chain, not a retry-with-backoff.
- Hard **4.5-second timeout** (`EMAIL_GENERATION_TIMEOUT`) wrapping the whole Groq call chain; on timeout, a **template-based fallback email** is synthesized locally (`_create_fallback_email`) so the UI never hangs waiting on the LLM.
- The system prompt hard-codes the response contract (`SUBJECT: ...` / `BODY: ...`), and `_parse_email_response()` does string-partitioning to pull those back apart — a brittle but effective ad hoc parser with three fallback strategies if the model doesn't follow the format exactly (look for both markers → look for just `SUBJECT:` → assume the first line is the subject if it's short and doesn't end in punctuation → give up and treat the whole reply as the body under a generic subject).
- The frontend's "Compose in Gmail" button doesn't send anything — it just opens `https://mail.google.com/mail/?view=cm&...` prefilled with the subject/body as URL params, handing off to the admin's own Gmail session.
- Every generation is logged to `analytics_store` (prompt + resulting body length), feeding the Analytics dashboard's "Total Emails" stat — though note `get_dashboard_stats()` in `analytics_store.py` currently **hardcodes `total_emails: 0`** rather than actually counting `activity_type = 'email_generation'` rows; the emails are logged but that particular stat is not wired up to read them back.

### 10.3 Analytics Dashboard (super-admin view)

- Auth: `POST /api/dashboard/login {email, password}` → validated against the Postgres `admins` table (bcrypt) → returns an HMAC-signed token (`auth_tokens.create_token`). **Note a frontend/backend mismatch**: `AnalyticsDashboard`'s data-fetch calls send `Authorization: Bearer ${user.email}:${user.password}` (the raw credentials, re-sent on every poll) rather than the token that was actually issued and stored in `sessionStorage` as `dashboardToken` — the backend's `validate_dashboard_token()` expects (and only accepts) the signed token format from `create_token`, so as implemented this header would fail `verify_token`'s base64/HMAC decode and dashboard data fetches would 401. This looks like a real integration bug worth flagging to whoever owns this code, not an intentional design choice.
- Once authenticated, `GET /api/dashboard/records` returns up to 500 rows from the Postgres `activity_log` table (upload events only — `WHERE activity_type = 'file_upload'`) plus aggregate stats (`total_files`, `today_uploads`, `weekly_uploads` — computed with `CURRENT_DATE` / `INTERVAL '7 days'` SQL, `total_emails` hardcoded to 0 as noted above).
- Client-side **filtering** (batch/branch/semester/document-type dropdowns) happens entirely in the browser over the already-fetched record set — the backend always returns the same (up to) 500 most-recent rows regardless of filter state; filters don't reduce what's fetched, only what's displayed and what's exported.
- **CSV export**: `GET /api/dashboard/export` returns up to 1000 rows as a pre-built CSV string (hand-assembled with manual quote-escaping, not `csv.writer`) that the frontend turns into a `Blob` and downloads client-side.
- Auto-refreshes every 30 seconds (`setInterval`) and also refreshes immediately after any successful document upload (via a `refreshTrigger` counter bumped by `handleUploadSuccess`).

### 10.4 Faculty portal

`FacultyLogin.tsx` posts to `POST /api/faculty/login`, validated against the separate Postgres `faculty` table, issuing the same kind of signed token. But `FacultyDashboard.tsx` itself is a **placeholder** — static copy ("view classes, upload materials, manage students") with only a logout link; none of those described features are implemented yet.

---

## 11. Storage model

Everything durable lives in **one Neon Postgres database** plus **one Qdrant Cloud collection** — there is no local filesystem persistence for anything that needs to survive a redeploy (this was a deliberate fix: comments in `file_store.py` / `analytics_store.py` explicitly say they replace an earlier local-disk design that didn't survive redeploys on most hosts).

| What | Where | Table/Collection | Notes |
|---|---|---|---|
| Admin credentials | Postgres | `admins` | email (unique) + bcrypt hash |
| Faculty credentials | Postgres | `faculty` | same shape, separate table |
| Upload/email activity log | Postgres | `activity_log` | one row per upload or email-draft event, feeds Analytics |
| Raw uploaded file bytes | Postgres | `document_files` | `BYTEA` column; unique on (batch, branch, semester, document_type, filename) |
| Chunk text + embeddings + metadata | **Qdrant Cloud** | `samvaad_documents` | 1024-dim cosine vectors; payload includes the chunk's own text (Qdrant, unlike some vector DBs, does not separately store "documents" — the searchable text must live in the payload) |

All four Postgres tables use `asyncpg` connection pools created lazily on first use (`min_size=1, max_size=5`) and `CREATE TABLE IF NOT EXISTS` run at pool-creation time — there's no separate migrations system; schema creation is inline and idempotent.

---

## 12. Deployment

Two deployment targets are configured simultaneously:

- **Render** (`render.yaml`): Docker-based web service, free plan, builds from `backend/Dockerfile`. All secrets (`DATABASE_URL`, `AUTH_SECRET_KEY`, `GROQ_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `NVIDIA_NIM_API_KEY`, `ALLOWED_ORIGINS`, `HF_TOKEN`) are marked `sync: false` (set manually in the Render dashboard, not committed).
- **Vercel** (`backend/vercel.json`, `backend/.vercelignore`): serverless Python function target, `main.py` given 60s max duration and 1024MB memory. This is almost certainly *why* OCR was moved off local Tesseract to a hosted Space (§7) — Vercel's serverless Python runtime can't install system packages like `tesseract-ocr`/`poppler-utils`, so any OCR dependency has to be an API call, not a local binary.

`app.run(host="0.0.0.0", port=8000)` in the `__main__` block already binds to all interfaces (the plan's Phase-0 "binds 127.0.0.1, breaks in Docker" issue has been fixed in the current code).

---

## 13. Known gaps and inconsistencies (for whoever picks this up next)

1. **Dashboard auth header bug** (§10.3) — the Analytics page sends `email:password` instead of the issued token; as written this would fail token verification on the backend. Worth a quick fix: send `Authorization: Bearer ${sessionStorage.getItem('dashboardToken')}`.
2. **`total_emails` stat is hardcoded to 0** in `analytics_store.get_dashboard_stats()` despite email generations being logged — a one-line `COUNT(*) WHERE activity_type = 'email_generation'` query away from being accurate.
3. **Dead legacy files** (`rag_system.py`, `chatbot.py`, `app.py`) are still in the repo, still runnable in isolation, and describe an entirely different (multi-agent, Ollama/ChromaDB) architecture than what's live — a real risk of confusing future readers (including AI assistants) into thinking the multi-agent design is current. Consider deleting or clearly marking them `archive/`.
4. **No conversation memory** — every chatbot turn is stateless; the LLM never sees prior turns in the same session.
5. **No translation tier, no romanized-language handling, no WhatsApp, no streaming, no caching** — all planned in `SAMVAAD_PLAN.md` but not implemented; don't assume they exist when reasoning about behavior or costs.
6. **Faculty dashboard is a stub.**
7. **LLM model is Llama-3.1-8B via NIM, not Qwen3-32B** — if you're tuning prompts or debugging answer quality, remember the model in production is smaller/less capable than what earlier planning docs assumed.
