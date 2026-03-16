# PDF Pipeline Split: Extraction + Chunking

## Problem

The current `process_pdf_from_supabase.py` script ties chunking to extraction — chunk
boundaries are determined by the page-batch window (3 pages at a time), not by narrative
meaning. This produces tiny, fragmented chunks that don't map to scenes or ideas.
Non-story content (copyright, marketing, glossary) also leaks through because there is no
dedicated cleaning step.

The worker task (`server/worker/tasks.py`) is currently a stub.

## Scope

This design targets children's picture books and early readers (typically under 50 pages,
under 10k words). For large books exceeding the Gemini context window, see deferred items.

## Solution

Replace the monolithic script with a two-step pipeline inside a new service package,
called from the Dramatiq worker.

## Architecture

### Package structure

```
server/services/pdf_pipeline/
├── __init__.py
├── models.py      # Manuscript, Chunk, LLMChunk, PageContent
├── extract.py     # extract_manuscript() — PDF → clean text
├── chunk.py       # chunk_manuscript() — text → semantic chunks with chunk_hint
└── storage.py     # Supabase Storage I/O + chunk upsert
```

### Data models (`models.py`)

```python
class PageContent(BaseModel):
    """Internal to extraction. Not persisted."""
    page_number: int
    text: str
    image_bytes: bytes | None = None

class Manuscript(BaseModel):
    """Output of Step 1. Persisted to Supabase Storage as manuscript.json."""
    book_id: str
    title: str
    text: str                  # full cleaned story text
    extraction_model: str
    pages_total: int
    image_pages: int           # pages that needed vision fallback

class LLMChunk(BaseModel):
    """Raw shape returned by Gemini (no chunk_index)."""
    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str            # one-sentence summary
    text: str

class Chunk(BaseModel):
    """Final chunk with assigned index. Used for DB insertion."""
    chunk_index: int
    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str
```

### Step 1 — Extraction (`extract.py`)

**Public function:**
```python
def extract_manuscript(book_id: str, title: str, pdf_bytes: bytes) -> Manuscript
```

Note: synchronous — both google-genai and supabase-py clients are synchronous.
The `title` comes from the `books` table (set at upload time).

**Flow:**
1. Iterate PDF pages with PyMuPDF, extract native text per page
2. For pages with < 25 words, render to PNG and send to Gemini vision (fallback)
3. Send all page texts to Gemini with a cleaning prompt:
   - Concatenate into one continuous text
   - Strip front matter (title page, copyright, ISBN, dedication, publisher info)
   - Strip back matter (glossary, author bio, discussion guide, marketing)
   - Fix OCR artifacts (broken words, stray mid-sentence capitals)
   - Preserve story text verbatim — no paraphrasing
4. Return `Manuscript` with cleaned text and metadata

**Dependencies:** PyMuPDF, google-genai, tenacity (retries)

### Step 2 — Chunking (`chunk.py`)

**Public function:**
```python
def chunk_manuscript(manuscript: Manuscript) -> list[Chunk]
```

**Flow:**
1. Send full `manuscript.text` to Gemini with a chunking prompt:
   - Split by narrative beat (~150-250 words, LLM decides boundaries)
   - Never cut mid-sentence or mid-dialogue
   - Group dialogue with surrounding action
   - Strip any non-story content that slipped through (safety net)
   - Detect chapter boundaries, emit `chunk_kind: "chapter_title"` chunks
   - Generate `chunk_hint` per chunk (one-sentence summary)
2. Parse Gemini's structured response (list of `LLMChunk`)
3. Assign sequential `chunk_index` values (0-based)
4. Return `list[Chunk]`

### Storage helpers (`storage.py`)

Storage functions resolve paths by querying the `books` table to get `storage_path`,
which contains the full path including `household_id` and original filename (set by
the upload API in `admin.py`). The `manuscript.json` is stored alongside the PDF.

```python
def download_pdf(book_id: str) -> tuple[bytes, str]
    """Query books table for storage_path and title. Download PDF from that path."""

def upload_manuscript(book_id: str, manuscript: Manuscript) -> None
    """Derive manuscript path from books.storage_path (same directory). Upload JSON."""

def download_manuscript(book_id: str) -> Manuscript
    """Derive manuscript path from books.storage_path. Download and parse JSON."""

def upsert_chunks(book_id: str, chunks: list[Chunk]) -> None
    """Replace all chunks and update status. See behavior below."""
```

**`upsert_chunks` behavior:**
1. DELETE all existing chunks for book_id
2. INSERT new chunks (including chunk_hint)
3. UPDATE books SET status = 'ready'
4. RESET reading_progress.current_chunk_index = 0 for all kids on this book

Note: resetting progress to 0 on rechunk is a known limitation. Chapter-aware remapping
is deferred. This is acceptable for now since rechunking is a dev/admin operation, not
something that happens during normal reading.

### Worker tasks (`server/worker/tasks.py`)

All pipeline functions are synchronous. Dramatiq actors call them directly.

```python
@dramatiq.actor
def process_book(book_id: str):
    try:
        pdf_bytes, title = download_pdf(book_id)
        manuscript = extract_manuscript(book_id, title, pdf_bytes)
        upload_manuscript(book_id, manuscript)
        chunks = chunk_manuscript(manuscript)
        upsert_chunks(book_id, chunks)
    except Exception:
        set_book_status(book_id, "error")
        raise

@dramatiq.actor
def rechunk_book(book_id: str):
    try:
        manuscript = download_manuscript(book_id)
        chunks = chunk_manuscript(manuscript)
        upsert_chunks(book_id, chunks)
    except Exception:
        set_book_status(book_id, "error")
        raise
```

**Error handling:** On failure, `books.status` is set to `"error"` so the UI can
distinguish between "still processing" and "failed". The exception is re-raised so
Dramatiq can handle retries per its configuration.

**Logging:** Use `loguru` (consistent with the rest of `server/`) with structured fields
(`book_id`, step name, duration) for production debugging.

### DB migration

Add `chunk_hint text` column to `book_chunks` table.

### Bot-side changes

- `BookChunk` model in `server/bot/library.py` — add `chunk_hint: str` field
- `supabase_client.py` — include `chunk_hint` in chunk queries
- `load_chunks_to_supabase.py` — remove (replaced by `storage.py`)

## What gets removed

- `scripts/process_pdf_from_supabase.py` — replaced by the service package
- `scripts/load_chunks_to_supabase.py` — replaced by `storage.py`
- `carryover_batches` concept — no longer relevant
- Page-boundary chunking logic — Step 2 never sees pages

## Deferred (see docs/todo/pdf-pipeline-future.md)

- Cheaper vision model for OCR fallback
- Cleaning pass batching for large books (> context window)
- Chapter-aware reading progress remapping on rechunk
