# PDF Pipeline Split Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic `process_pdf_from_supabase.py` script with a two-step pipeline (extraction + chunking) inside `server/services/pdf_pipeline/`, called from Dramatiq worker tasks.

**Architecture:** New service package with 4 modules (models, extract, chunk, storage) called by two thin Dramatiq actors (`process_book`, `rechunk_book`). Intermediate manuscript persisted to Supabase Storage. DB migration adds `chunk_hint` column.

**Tech Stack:** Python 3.13, PyMuPDF, google-genai, Pydantic, tenacity, Supabase, Dramatiq, loguru

**Spec:** `docs/superpowers/specs/2026-03-13-pdf-pipeline-split-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `server/services/__init__.py` | Package init |
| Create | `server/services/pdf_pipeline/__init__.py` | Re-export public functions |
| Create | `server/services/pdf_pipeline/models.py` | Pydantic models: Manuscript, Chunk, LLMChunk, PageContent |
| Create | `server/services/pdf_pipeline/_gemini.py` | Shared Gemini client, retry logic, structured output helper |
| Create | `server/services/pdf_pipeline/extract.py` | PDF → Manuscript (page extraction + Gemini cleaning) |
| Create | `server/services/pdf_pipeline/chunk.py` | Manuscript → list[Chunk] (Gemini semantic chunking) |
| Create | `server/services/pdf_pipeline/storage.py` | Supabase Storage I/O + chunk upsert + status updates |
| Create | `server/tests/services/__init__.py` | Test package |
| Create | `server/tests/services/test_models.py` | Model unit tests |
| Create | `server/tests/services/test_extract.py` | Extraction tests (mocked Gemini) |
| Create | `server/tests/services/test_chunk.py` | Chunking tests (mocked Gemini) |
| Create | `server/tests/services/test_storage.py` | Storage tests (mocked Supabase) |
| Create | `server/tests/services/test_worker_tasks.py` | Worker task orchestration tests (mocked pipeline) |
| Create | `supabase/migrations/20250101000005_chunk_hint.sql` | Add chunk_hint column |
| Modify | `server/worker/tasks.py` | Replace stub with real pipeline calls |
| Modify | `server/pyproject.toml:7-17` | Add PyMuPDF, google-genai, tenacity deps |
| Modify | `server/bot/library.py:43-47` | Add chunk_hint to BookChunk |
| Modify | `server/bot/supabase_client.py:38` | Include chunk_hint in select |
| Modify | `server/tests/bot/test_library.py:18-34` | Add chunk_hint to test fixtures |
| Delete | `scripts/process_pdf_from_supabase.py` | Replaced by service package |
| Delete | `scripts/load_chunks_to_supabase.py` | Replaced by storage.py |

---

## Chunk 1: Foundation (models, deps, migration)

### Task 1: Add dependencies to pyproject.toml

**Files:**
- Modify: `server/pyproject.toml:7-17`

- [ ] **Step 1: Add PyMuPDF, google-genai, pydantic, tenacity to dependencies**

Add after `"dramatiq[redis]>=1.18.0"`:
```toml
    "PyMuPDF>=1.24.0",
    "google-genai>=1.63.0",
    "pydantic>=2.0.0",
    "tenacity>=9.0.0",
```

Note: `pydantic` may already be pulled transitively but declare it explicitly since the pipeline depends on it directly.

- [ ] **Step 2: Install dependencies**

Run: `cd /Users/isabelleredactive/src/readme/server && uv sync`
Expected: resolves and installs without errors

- [ ] **Step 3: Commit**

```bash
git add server/pyproject.toml server/uv.lock
git commit -m "feat: add PDF pipeline dependencies (PyMuPDF, google-genai, tenacity)"
```

---

### Task 2: Create data models

**Files:**
- Create: `server/services/__init__.py`
- Create: `server/services/pdf_pipeline/__init__.py`
- Create: `server/services/pdf_pipeline/models.py`
- Create: `server/tests/services/__init__.py`
- Create: `server/tests/services/test_models.py`

- [ ] **Step 1: Write model tests**

```python
# server/tests/services/test_models.py
"""Unit tests for pdf_pipeline models."""

from services.pdf_pipeline.models import Chunk, LLMChunk, Manuscript, PageContent


class TestPageContent:
    def test_create_text_only(self):
        page = PageContent(page_number=1, text="Hello world")
        assert page.page_number == 1
        assert page.text == "Hello world"
        assert page.image_bytes is None

    def test_create_with_image(self):
        page = PageContent(page_number=2, text="", image_bytes=b"\x89PNG")
        assert page.image_bytes == b"\x89PNG"


class TestManuscript:
    def test_create(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            text="Once upon a time.",
            extraction_model="gemini-2.5-flash",
            pages_total=10,
            image_pages=3,
        )
        assert m.book_id == "book_001"
        assert m.text == "Once upon a time."

    def test_serialization_roundtrip(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            text="Story text here.",
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        data = m.model_dump_json()
        m2 = Manuscript.model_validate_json(data)
        assert m2 == m


class TestLLMChunk:
    def test_create(self):
        c = LLMChunk(
            chunk_kind="content",
            chapter_title="Chapter 1",
            chunk_hint="The hero arrives.",
            text="He walked into town.",
        )
        assert c.chunk_kind == "content"
        assert c.chunk_hint == "The hero arrives."

    def test_chapter_title_kind(self):
        c = LLMChunk(
            chunk_kind="chapter_title",
            chapter_title="Chapter 2",
            chunk_hint="New chapter begins.",
            text="Chapter 2",
        )
        assert c.chunk_kind == "chapter_title"


class TestChunk:
    def test_create_with_index(self):
        c = Chunk(
            chunk_index=0,
            chunk_kind="content",
            chapter_title="Chapter 1",
            chunk_hint="Opening scene.",
            text="Once upon a time.",
        )
        assert c.chunk_index == 0
        assert c.chunk_hint == "Opening scene."
```

- [ ] **Step 2: Run tests — expect failure (module doesn't exist yet)**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_models.py -v`
Expected: `ModuleNotFoundError: No module named 'services'`

- [ ] **Step 3: Create package structure and models**

Create empty `server/services/__init__.py`.

Create empty `server/services/pdf_pipeline/__init__.py`.

Create empty `server/tests/services/__init__.py`.

Create `server/services/pdf_pipeline/models.py`:
```python
"""Data models for the PDF extraction and chunking pipeline."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class PageContent(BaseModel):
    """A single extracted PDF page. Internal to extraction, not persisted."""

    page_number: int
    text: str
    image_bytes: bytes | None = None


class Manuscript(BaseModel):
    """Cleaned full-text output of extraction. Persisted to Supabase Storage."""

    book_id: str
    title: str
    text: str
    extraction_model: str
    pages_total: int
    image_pages: int


class LLMChunk(BaseModel):
    """Raw chunk shape returned by Gemini (no chunk_index)."""

    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str


class Chunk(BaseModel):
    """Final chunk with assigned index. Used for DB insertion."""

    chunk_index: int
    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str
```

- [ ] **Step 4: Run tests — expect pass**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_models.py -v`
Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/ server/tests/services/
git commit -m "feat: add pdf_pipeline data models (Manuscript, Chunk, LLMChunk, PageContent)"
```

---

### Task 3: DB migration — add chunk_hint column

**Files:**
- Create: `supabase/migrations/20250101000005_chunk_hint.sql`

- [ ] **Step 1: Write migration**

```sql
-- Add chunk_hint for semantic one-line chunk summaries.
-- Existing rows get empty string — backward-compatible.

alter table book_chunks
    add column if not exists chunk_hint text not null default '';
```

- [ ] **Step 2: Apply migration locally**

Run: `cd /Users/isabelleredactive/src/readme && supabase db push` (or however migrations are applied in this project's dev workflow — may be `supabase migration up` or manual apply)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20250101000005_chunk_hint.sql
git commit -m "feat: add chunk_hint column to book_chunks"
```

---

## Chunk 2: Shared helpers (Gemini + Storage)

### Task 4: Implement shared Gemini helpers (_gemini.py)

**Files:**
- Create: `server/services/pdf_pipeline/_gemini.py`

- [ ] **Step 1: Create _gemini.py**

Centralises Gemini client creation, retry logic, and quota detection. Both `extract.py` and `chunk.py` import from here instead of duplicating.

```python
# server/services/pdf_pipeline/_gemini.py
"""Shared Gemini client and retry helpers for the PDF pipeline."""

from __future__ import annotations

from functools import cache
from typing import TypeVar, cast, get_origin

from google.genai import Client, types
from loguru import logger
from pydantic import BaseModel
from tenacity import Retrying, retry_if_exception, stop_after_attempt, wait_exponential_jitter

try:
    from shared.config import GOOGLE_API_KEY
except ImportError:
    from server.shared.config import GOOGLE_API_KEY  # type: ignore

LLM_MODEL = "gemini-2.5-flash"
MAX_RETRIES = 6

T = TypeVar("T")


def is_quota_error(error: Exception) -> bool:
    message = str(error).upper()
    return "429" in message or "RESOURCE_EXHAUSTED" in message


@cache
def get_client() -> Client:
    return Client(api_key=GOOGLE_API_KEY)


def _make_retryer() -> Retrying:
    return Retrying(
        retry=retry_if_exception(is_quota_error),
        stop=stop_after_attempt(MAX_RETRIES + 1),
        wait=wait_exponential_jitter(initial=2, max=60, jitter=3),
        reraise=True,
    )


def generate_text(prompt: str | list[types.Part | str]) -> str:
    """Call Gemini and return raw text. Retries on quota errors."""
    client = get_client()
    contents = [prompt] if isinstance(prompt, str) else prompt
    for attempt in _make_retryer():
        with attempt:
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(temperature=0.0),
            )
            return response.text or ""
    raise RuntimeError("Gemini retry loop exhausted.")


def generate_structured(
    prompt: str | list[types.Part | str],
    result_type: type[T],
) -> T:
    """Call Gemini with structured JSON output. Retries on quota errors."""
    client = get_client()
    contents = [prompt] if isinstance(prompt, str) else prompt
    for attempt in _make_retryer():
        with attempt:
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=result_type,
                ),
            )
            check_type = get_origin(result_type) or result_type
            if response.parsed is None or not isinstance(response.parsed, check_type):
                raise RuntimeError(
                    f"Gemini returned invalid structure: {response.text}"
                )
            return cast(T, response.parsed)
    raise RuntimeError("Gemini retry loop exhausted.")
```

- [ ] **Step 2: Commit**

```bash
git add server/services/pdf_pipeline/_gemini.py
git commit -m "feat: add shared Gemini helpers (_gemini.py) for pdf_pipeline"
```

---

### Task 5: Implement storage.py

Note: storage tests mock `_get_client` so the shared config import is not an issue for testing.

**Files:**
- Create: `server/services/pdf_pipeline/storage.py`
- Create: `server/tests/services/test_storage.py`

- [ ] **Step 1: Write storage tests**

```python
# server/tests/services/test_storage.py
"""Unit tests for pdf_pipeline storage helpers."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from services.pdf_pipeline.models import Chunk, Manuscript
from services.pdf_pipeline.storage import (
    download_manuscript,
    download_pdf,
    set_book_status,
    upload_manuscript,
    upsert_chunks,
)


FAKE_BOOK_ROW = {
    "id": "book_001",
    "title": "Test Book",
    "storage_path": "households/hh1/books/book_001/mybook.pdf",
}


def _mock_supabase():
    """Return a mock Supabase client with chainable table/storage methods."""
    client = MagicMock()

    # table().select().eq().execute() chain
    table_mock = MagicMock()
    client.table.return_value = table_mock

    storage_mock = MagicMock()
    client.storage.from_.return_value = storage_mock

    return client, table_mock, storage_mock


class TestDownloadPdf:
    @patch("services.pdf_pipeline.storage._get_client")
    def test_returns_bytes_and_title(self, mock_get_client):
        client, table_mock, storage_mock = _mock_supabase()
        mock_get_client.return_value = client

        # books table query
        table_mock.select.return_value.eq.return_value.execute.return_value.data = [
            FAKE_BOOK_ROW
        ]
        # storage download
        storage_mock.download.return_value = b"%PDF-fake"

        pdf_bytes, title = download_pdf("book_001")

        assert pdf_bytes == b"%PDF-fake"
        assert title == "Test Book"
        storage_mock.download.assert_called_once_with(
            "households/hh1/books/book_001/mybook.pdf"
        )

    @patch("services.pdf_pipeline.storage._get_client")
    def test_raises_on_missing_book(self, mock_get_client):
        client, table_mock, _ = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = []

        with pytest.raises(ValueError, match="not found"):
            download_pdf("nonexistent")


class TestUploadManuscript:
    @patch("services.pdf_pipeline.storage._get_client")
    def test_uploads_json_to_correct_path(self, mock_get_client):
        client, table_mock, storage_mock = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = [
            FAKE_BOOK_ROW
        ]

        manuscript = Manuscript(
            book_id="book_001",
            title="Test Book",
            text="Story text.",
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        upload_manuscript("book_001", manuscript)

        storage_mock.upload.assert_called_once()
        call_args = storage_mock.upload.call_args
        assert call_args.kwargs["path"] == "households/hh1/books/book_001/manuscript.json"


class TestDownloadManuscript:
    @patch("services.pdf_pipeline.storage._get_client")
    def test_parses_json_to_manuscript(self, mock_get_client):
        client, table_mock, storage_mock = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = [
            FAKE_BOOK_ROW
        ]

        manuscript = Manuscript(
            book_id="book_001",
            title="Test Book",
            text="Story text.",
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        storage_mock.download.return_value = manuscript.model_dump_json().encode()

        result = download_manuscript("book_001")
        assert result.book_id == "book_001"
        assert result.text == "Story text."


class TestUpsertChunks:
    @patch("services.pdf_pipeline.storage._get_client")
    def test_deletes_then_inserts_then_updates_status(self, mock_get_client):
        client, table_mock, _ = _mock_supabase()
        mock_get_client.return_value = client

        chunks = [
            Chunk(
                chunk_index=0,
                chunk_kind="content",
                chapter_title="Ch1",
                chunk_hint="Opening.",
                text="Once upon a time.",
            ),
        ]
        upsert_chunks("book_001", chunks)

        # Verify delete was called
        table_mock.delete.assert_called()
        # Verify insert was called
        table_mock.insert.assert_called()


class TestSetBookStatus:
    @patch("services.pdf_pipeline.storage._get_client")
    def test_updates_status(self, mock_get_client):
        client, table_mock, _ = _mock_supabase()
        mock_get_client.return_value = client

        set_book_status("book_001", "error")
        table_mock.update.assert_called()
```

- [ ] **Step 2: Run tests — expect failure**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_storage.py -v`
Expected: `ModuleNotFoundError` or `ImportError`

- [ ] **Step 3: Implement storage.py**

```python
# server/services/pdf_pipeline/storage.py
"""Supabase Storage I/O and chunk management for the PDF pipeline."""

from __future__ import annotations

from functools import lru_cache
from pathlib import PurePosixPath

from loguru import logger
from supabase import Client, create_client

try:
    from shared.config import SUPABASE_BOOKS_BUCKET, SUPABASE_SECRET_KEY, SUPABASE_URL
except ImportError:
    from server.shared.config import (  # type: ignore
        SUPABASE_BOOKS_BUCKET,
        SUPABASE_SECRET_KEY,
        SUPABASE_URL,
    )

from .models import Chunk, Manuscript


@lru_cache(maxsize=1)
def _get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def _get_book_row(book_id: str) -> dict:
    """Fetch book row or raise ValueError."""
    resp = (
        _get_client()
        .table("books")
        .select("id, title, storage_path")
        .eq("id", book_id)
        .execute()
    )
    if not resp.data:
        raise ValueError(f"Book not found: {book_id}")
    return resp.data[0]


def _manuscript_path(storage_path: str) -> str:
    """Derive manuscript.json path from the PDF storage_path."""
    parent = str(PurePosixPath(storage_path).parent)
    return f"{parent}/manuscript.json"


def _bucket() -> str:
    return SUPABASE_BOOKS_BUCKET


def download_pdf(book_id: str) -> tuple[bytes, str]:
    """Download PDF from Supabase Storage. Returns (pdf_bytes, title)."""
    row = _get_book_row(book_id)
    storage = _get_client().storage.from_(_bucket())
    pdf_bytes = storage.download(row["storage_path"])
    logger.info("Downloaded PDF | book_id={} size={}", book_id, len(pdf_bytes))
    return pdf_bytes, row["title"]


def upload_manuscript(book_id: str, manuscript: Manuscript) -> None:
    """Upload manuscript.json alongside the PDF in storage."""
    row = _get_book_row(book_id)
    path = _manuscript_path(row["storage_path"])
    storage = _get_client().storage.from_(_bucket())
    data = manuscript.model_dump_json().encode()
    storage.upload(
        path=path,
        file=data,
        file_options={"content-type": "application/json", "upsert": "true"},
    )
    logger.info("Uploaded manuscript | book_id={} path={}", book_id, path)


def download_manuscript(book_id: str) -> Manuscript:
    """Download existing manuscript.json from storage."""
    row = _get_book_row(book_id)
    path = _manuscript_path(row["storage_path"])
    storage = _get_client().storage.from_(_bucket())
    data = storage.download(path)
    logger.info("Downloaded manuscript | book_id={}", book_id)
    return Manuscript.model_validate_json(data)


def upsert_chunks(book_id: str, chunks: list[Chunk]) -> None:
    """Replace all chunks for a book, update status to 'ready', reset reading progress."""
    client = _get_client()

    # 1. Delete existing chunks
    client.table("book_chunks").delete().eq("book_id", book_id).execute()
    logger.info("Deleted old chunks | book_id={}", book_id)

    # 2. Insert new chunks in batches
    batch_size = 50
    rows = [
        {
            "book_id": book_id,
            "chunk_index": c.chunk_index,
            "chunk_kind": c.chunk_kind,
            "chapter_title": c.chapter_title,
            "chunk_hint": c.chunk_hint,
            "text": c.text,
        }
        for c in chunks
    ]
    for i in range(0, len(rows), batch_size):
        client.table("book_chunks").insert(rows[i : i + batch_size]).execute()

    # 3. Update book status
    client.table("books").update({"status": "ready"}).eq("id", book_id).execute()

    # 4. Reset reading progress
    client.table("reading_progress").update(
        {"current_chunk_index": 0}
    ).eq("book_id", book_id).execute()

    logger.info(
        "Upserted {} chunks, status=ready | book_id={}", len(chunks), book_id
    )


def set_book_status(book_id: str, status: str) -> None:
    """Update books.status (e.g. to 'error' on failure)."""
    _get_client().table("books").update({"status": status}).eq(
        "id", book_id
    ).execute()
    logger.info("Set book status={} | book_id={}", status, book_id)
```

- [ ] **Step 4: Run tests — expect pass**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_storage.py -v`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/pdf_pipeline/storage.py server/tests/services/test_storage.py
git commit -m "feat: add pdf_pipeline storage helpers (download, upload, upsert)"
```

---

## Chunk 3: Extraction

### Task 6: Implement extract.py

**Files:**
- Create: `server/services/pdf_pipeline/extract.py`
- Create: `server/tests/services/test_extract.py`

- [ ] **Step 1: Write extraction tests**

Test the core logic with mocked Gemini calls. Key behaviors to test:
- Pages with enough text skip vision fallback
- Pages with < 25 words get image_bytes populated
- Gemini cleaning prompt is called with all page texts
- Returns a valid Manuscript

```python
# server/tests/services/test_extract.py
"""Unit tests for pdf_pipeline extraction."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from services.pdf_pipeline.extract import (
    _clean_text_with_llm,
    _extract_pages,
    extract_manuscript,
)
from services.pdf_pipeline.models import Manuscript, PageContent


class TestExtractPages:
    @patch("services.pdf_pipeline.extract.fitz")
    def test_text_page_no_image(self, mock_fitz):
        """Page with >= 25 words should not get image_bytes."""
        doc = MagicMock()
        page = MagicMock()
        page.get_text.return_value = " ".join(["word"] * 30)
        doc.__iter__ = MagicMock(return_value=iter([page]))
        doc.__len__ = MagicMock(return_value=1)
        mock_fitz.open.return_value.__enter__ = MagicMock(return_value=doc)
        mock_fitz.open.return_value.__exit__ = MagicMock(return_value=False)

        pages = _extract_pages(b"%PDF-fake")
        assert len(pages) == 1
        assert pages[0].image_bytes is None
        assert "word" in pages[0].text

    @patch("services.pdf_pipeline.extract.fitz")
    def test_sparse_page_gets_image(self, mock_fitz):
        """Page with < 25 words should get image_bytes from render."""
        doc = MagicMock()
        page = MagicMock()
        page.get_text.return_value = "short text"
        pixmap = MagicMock()
        pixmap.tobytes.return_value = b"\x89PNG-fake"
        page.get_pixmap.return_value = pixmap
        doc.__iter__ = MagicMock(return_value=iter([page]))
        doc.__len__ = MagicMock(return_value=1)
        mock_fitz.open.return_value.__enter__ = MagicMock(return_value=doc)
        mock_fitz.open.return_value.__exit__ = MagicMock(return_value=False)

        pages = _extract_pages(b"%PDF-fake")
        assert len(pages) == 1
        assert pages[0].image_bytes == b"\x89PNG-fake"


class TestCleanTextWithLLM:
    @patch("services.pdf_pipeline.extract._gemini_generate")
    def test_returns_cleaned_text(self, mock_gemini):
        mock_gemini.return_value = "Once upon a time there was a story."
        pages = [
            PageContent(page_number=1, text="Copyright 2024.\nOnce upon a time"),
            PageContent(page_number=2, text="there was a story.\nAbout the author..."),
        ]
        result = _clean_text_with_llm(pages)
        assert result == "Once upon a time there was a story."
        mock_gemini.assert_called_once()


class TestExtractManuscript:
    @patch("services.pdf_pipeline.extract._clean_text_with_llm")
    @patch("services.pdf_pipeline.extract._extract_pages")
    def test_returns_manuscript(self, mock_pages, mock_clean):
        mock_pages.return_value = [
            PageContent(page_number=1, text="Hello world " * 20),
            PageContent(page_number=2, text="short", image_bytes=b"\x89PNG"),
        ]
        mock_clean.return_value = "Hello world. The end."

        result = extract_manuscript("book_001", "Test Book", b"%PDF-fake")

        assert isinstance(result, Manuscript)
        assert result.book_id == "book_001"
        assert result.title == "Test Book"
        assert result.text == "Hello world. The end."
        assert result.pages_total == 2
        assert result.image_pages == 1
```

- [ ] **Step 2: Run tests — expect failure**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_extract.py -v`
Expected: `ImportError`

- [ ] **Step 3: Implement extract.py**

Port the page extraction logic from `scripts/process_pdf_from_supabase.py` (lines 136-155) and add the new Gemini cleaning step. Key references from the old script:
- `extract_raw_pages()` at line 142 — PyMuPDF + PyPDF2 extraction pattern
- `_render_page_image()` at line 136 — PNG rendering for vision fallback
- `gemini_generate_structured_output()` at line 199 — Gemini call with tenacity retries

```python
# server/services/pdf_pipeline/extract.py
"""Step 1: Extract clean manuscript text from a PDF."""

from __future__ import annotations

import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from google.genai import types
from loguru import logger

from ._gemini import LLM_MODEL, generate_text
from .models import Manuscript, PageContent

MIN_TEXT_WORDS = 25


def _gemini_generate(prompt: str | list[types.Part | str]) -> str:
    """Thin wrapper over shared generate_text (allows easy mocking in tests)."""
    return generate_text(prompt)


def _extract_pages(pdf_bytes: bytes) -> list[PageContent]:
    """Extract text from each PDF page, with PNG fallback for sparse pages."""
    pages: list[PageContent] = []
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = Path(tmp.name)

    try:
        with fitz.open(str(tmp_path)) as doc:
            for idx, page in enumerate(doc):
                text = (page.get_text() or "").strip()
                image_bytes = None
                if len(text.split()) < MIN_TEXT_WORDS:
                    pixmap = page.get_pixmap(dpi=200, alpha=False)
                    image_bytes = pixmap.tobytes("png")
                pages.append(
                    PageContent(page_number=idx + 1, text=text, image_bytes=image_bytes)
                )
    finally:
        tmp_path.unlink(missing_ok=True)

    return pages


def _clean_text_with_llm(pages: list[PageContent]) -> str:
    """Send all page texts (and images) to Gemini for cleaning and concatenation."""
    parts: list[types.Part | str] = []

    parts.append(
        """You are cleaning extracted text from a children's book PDF.

Instructions:
- Concatenate all pages into one continuous story text.
- Strip front matter: title page, copyright, ISBN, dedication, publisher info.
- Strip back matter: glossary, author bio, discussion guide, FAQs, marketing, ads.
- Fix OCR/extraction artifacts: broken words, stray mid-sentence capitals, garbled text.
- Preserve the story text VERBATIM — do not paraphrase, summarize, or rewrite.
- Output ONLY the cleaned story text, nothing else. No commentary, no labels."""
    )

    for page in pages:
        if page.image_bytes:
            parts.append(f"\n[[PAGE {page.page_number} — image]]")
            parts.append(types.Part.from_bytes(data=page.image_bytes, mime_type="image/png"))
            if page.text.strip():
                parts.append(f"(extracted text hint: {page.text.strip()[:500]})")
        else:
            parts.append(f"\n[[PAGE {page.page_number}]]\n{page.text}")

    return _gemini_generate(parts)


def extract_manuscript(book_id: str, title: str, pdf_bytes: bytes) -> Manuscript:
    """Extract and clean a PDF into a Manuscript."""
    logger.info("Extracting pages | book_id={}", book_id)
    pages = _extract_pages(pdf_bytes)
    image_pages = sum(1 for p in pages if p.image_bytes)
    logger.info(
        "Extracted {} pages ({} image, {} text) | book_id={}",
        len(pages), image_pages, len(pages) - image_pages, book_id,
    )

    logger.info("Cleaning text with LLM | book_id={}", book_id)
    cleaned_text = _clean_text_with_llm(pages)

    return Manuscript(
        book_id=book_id,
        title=title,
        text=cleaned_text,
        extraction_model=LLM_MODEL,
        pages_total=len(pages),
        image_pages=image_pages,
    )
```

- [ ] **Step 4: Run tests — expect pass**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_extract.py -v`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/pdf_pipeline/extract.py server/tests/services/test_extract.py
git commit -m "feat: add pdf_pipeline extraction (PDF → clean manuscript text)"
```

---

## Chunk 4: Chunking

### Task 7: Implement chunk.py

**Files:**
- Create: `server/services/pdf_pipeline/chunk.py`
- Create: `server/tests/services/test_chunk.py`

- [ ] **Step 1: Write chunking tests**

```python
# server/tests/services/test_chunk.py
"""Unit tests for pdf_pipeline chunking."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from services.pdf_pipeline.chunk import _assign_indices, chunk_manuscript
from services.pdf_pipeline.models import Chunk, LLMChunk, Manuscript


SAMPLE_MANUSCRIPT = Manuscript(
    book_id="book_001",
    title="Test Book",
    text="Once upon a time there was a brave little rabbit. " * 20,
    extraction_model="gemini-2.5-flash",
    pages_total=5,
    image_pages=1,
)


class TestAssignIndices:
    def test_sequential_indices(self):
        llm_chunks = [
            LLMChunk(
                chunk_kind="content",
                chapter_title="Ch1",
                chunk_hint="Opening.",
                text="First chunk.",
            ),
            LLMChunk(
                chunk_kind="chapter_title",
                chapter_title="Ch2",
                chunk_hint="New chapter.",
                text="Chapter 2",
            ),
            LLMChunk(
                chunk_kind="content",
                chapter_title="Ch2",
                chunk_hint="Continues.",
                text="Second chunk.",
            ),
        ]
        chunks = _assign_indices(llm_chunks)
        assert len(chunks) == 3
        assert [c.chunk_index for c in chunks] == [0, 1, 2]
        assert all(isinstance(c, Chunk) for c in chunks)
        assert chunks[1].chunk_kind == "chapter_title"


class TestChunkManuscript:
    @patch("services.pdf_pipeline.chunk._gemini_chunk")
    def test_returns_indexed_chunks(self, mock_gemini):
        mock_gemini.return_value = [
            LLMChunk(
                chunk_kind="content",
                chapter_title="Chapter 1",
                chunk_hint="The rabbit sets out on an adventure.",
                text="Once upon a time there was a brave little rabbit.",
            ),
            LLMChunk(
                chunk_kind="content",
                chapter_title="Chapter 1",
                chunk_hint="The rabbit meets a friend.",
                text="The rabbit met a friendly fox.",
            ),
        ]

        chunks = chunk_manuscript(SAMPLE_MANUSCRIPT)

        assert len(chunks) == 2
        assert chunks[0].chunk_index == 0
        assert chunks[1].chunk_index == 1
        assert chunks[0].chunk_hint == "The rabbit sets out on an adventure."
        mock_gemini.assert_called_once()

    @patch("services.pdf_pipeline.chunk._gemini_chunk")
    def test_empty_manuscript_returns_empty(self, mock_gemini):
        mock_gemini.return_value = []
        empty = Manuscript(
            book_id="book_002",
            title="Empty",
            text="",
            extraction_model="gemini-2.5-flash",
            pages_total=0,
            image_pages=0,
        )
        chunks = chunk_manuscript(empty)
        assert chunks == []
```

- [ ] **Step 2: Run tests — expect failure**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_chunk.py -v`
Expected: `ImportError`

- [ ] **Step 3: Implement chunk.py**

```python
# server/services/pdf_pipeline/chunk.py
"""Step 2: Split manuscript text into semantic, TTS-ready chunks."""

from __future__ import annotations

from loguru import logger
from pydantic import BaseModel

from ._gemini import generate_structured
from .models import Chunk, LLMChunk, Manuscript


class _LLMChunkResponse(BaseModel):
    chunks: list[LLMChunk]


def _gemini_chunk(text: str) -> list[LLMChunk]:
    """Send full manuscript text to Gemini for semantic chunking."""
    if not text.strip():
        return []

    prompt = f"""You are chunking a children's book for text-to-speech narration.

Instructions:
- Split the text into chunks by narrative beat, roughly 150-250 words each.
- Never cut mid-sentence or mid-dialogue.
- Group dialogue with its surrounding action/narration.
- If you find chapter headings, emit a separate chunk with chunk_kind="chapter_title".
- For each content chunk, generate a chunk_hint: one sentence describing what happens.
- For chapter_title chunks, the chunk_hint should describe what the chapter is about.
- Strip any non-story content (copyright, marketing) that may have slipped through.
- Preserve the story text VERBATIM — do not paraphrase.

Text to chunk:

{text}"""

    result = generate_structured(prompt, _LLMChunkResponse)
    return result.chunks


def _assign_indices(llm_chunks: list[LLMChunk]) -> list[Chunk]:
    """Convert LLMChunks to Chunks with sequential indices."""
    return [
        Chunk(
            chunk_index=i,
            chunk_kind=c.chunk_kind,
            chapter_title=c.chapter_title,
            chunk_hint=c.chunk_hint,
            text=c.text,
        )
        for i, c in enumerate(llm_chunks)
    ]


def chunk_manuscript(manuscript: Manuscript) -> list[Chunk]:
    """Split a manuscript into semantic, TTS-ready chunks with hints."""
    logger.info("Chunking manuscript | book_id={}", manuscript.book_id)
    llm_chunks = _gemini_chunk(manuscript.text)
    chunks = _assign_indices(llm_chunks)
    logger.info(
        "Produced {} chunks | book_id={}", len(chunks), manuscript.book_id
    )
    return chunks
```

- [ ] **Step 4: Run tests — expect pass**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_chunk.py -v`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/pdf_pipeline/chunk.py server/tests/services/test_chunk.py
git commit -m "feat: add pdf_pipeline chunking (manuscript → semantic chunks with hints)"
```

---

## Chunk 5: Worker tasks + bot-side changes + cleanup

### Task 8: Wire up worker tasks

**Files:**
- Modify: `server/worker/tasks.py`
- Modify: `server/services/pdf_pipeline/__init__.py`

- [ ] **Step 1: Update __init__.py to re-export public API**

```python
# server/services/pdf_pipeline/__init__.py
"""PDF extraction and chunking pipeline."""

from .chunk import chunk_manuscript
from .extract import extract_manuscript
from .storage import (
    download_manuscript,
    download_pdf,
    set_book_status,
    upload_manuscript,
    upsert_chunks,
)

__all__ = [
    "chunk_manuscript",
    "download_manuscript",
    "download_pdf",
    "extract_manuscript",
    "set_book_status",
    "upload_manuscript",
    "upsert_chunks",
]
```

- [ ] **Step 2: Replace worker stub with real implementation**

Replace the full contents of `server/worker/tasks.py`:

```python
# server/worker/tasks.py
import dramatiq
from dramatiq.brokers.redis import RedisBroker
from loguru import logger

try:
    from shared.config import DRAMATIQ_BROKER_URL
except ImportError:
    from server.shared.config import DRAMATIQ_BROKER_URL  # type: ignore

try:
    from services.pdf_pipeline import (
        chunk_manuscript,
        download_manuscript,
        download_pdf,
        extract_manuscript,
        set_book_status,
        upload_manuscript,
        upsert_chunks,
    )
except ImportError:
    from server.services.pdf_pipeline import (  # type: ignore
        chunk_manuscript,
        download_manuscript,
        download_pdf,
        extract_manuscript,
        set_book_status,
        upload_manuscript,
        upsert_chunks,
    )

dramatiq.set_broker(RedisBroker(url=DRAMATIQ_BROKER_URL))


@dramatiq.actor
def process_book(book_id: str) -> None:
    """Full pipeline: extract PDF → persist manuscript → chunk → upsert."""
    logger.info("Starting book processing | book_id={}", book_id)
    try:
        pdf_bytes, title = download_pdf(book_id)
        manuscript = extract_manuscript(book_id, title, pdf_bytes)
        upload_manuscript(book_id, manuscript)
        chunks = chunk_manuscript(manuscript)
        upsert_chunks(book_id, chunks)
        logger.info("Book processing complete | book_id={}", book_id)
    except Exception:
        logger.exception("Book processing failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise


@dramatiq.actor
def rechunk_book(book_id: str) -> None:
    """Re-chunk from existing manuscript (skips extraction)."""
    logger.info("Starting rechunk | book_id={}", book_id)
    try:
        manuscript = download_manuscript(book_id)
        chunks = chunk_manuscript(manuscript)
        upsert_chunks(book_id, chunks)
        logger.info("Rechunk complete | book_id={}", book_id)
    except Exception:
        logger.exception("Rechunk failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise


def enqueue_process_book(book_id: str) -> bool:
    try:
        process_book.send(book_id)
        return True
    except Exception:
        logger.exception("Failed to enqueue book processing | book_id={}", book_id)
        return False


def enqueue_rechunk_book(book_id: str) -> bool:
    try:
        rechunk_book.send(book_id)
        return True
    except Exception:
        logger.exception("Failed to enqueue rechunk | book_id={}", book_id)
        return False
```

- [ ] **Step 3: Commit**

```bash
git add server/services/pdf_pipeline/__init__.py server/worker/tasks.py
git commit -m "feat: wire worker tasks to pdf_pipeline (process_book + rechunk_book)"
```

---

### Task 9: Worker task tests

**Files:**
- Create: `server/tests/services/test_worker_tasks.py`

- [ ] **Step 1: Write worker orchestration tests**

```python
# server/tests/services/test_worker_tasks.py
"""Unit tests for worker task orchestration."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from services.pdf_pipeline.models import Chunk, Manuscript


FAKE_MANUSCRIPT = Manuscript(
    book_id="book_001",
    title="Test Book",
    text="Story text.",
    extraction_model="gemini-2.5-flash",
    pages_total=5,
    image_pages=1,
)

FAKE_CHUNKS = [
    Chunk(
        chunk_index=0,
        chunk_kind="content",
        chapter_title="Ch1",
        chunk_hint="Opening.",
        text="Once upon a time.",
    ),
]


@patch("worker.tasks.upsert_chunks")
@patch("worker.tasks.chunk_manuscript", return_value=FAKE_CHUNKS)
@patch("worker.tasks.upload_manuscript")
@patch("worker.tasks.extract_manuscript", return_value=FAKE_MANUSCRIPT)
@patch("worker.tasks.download_pdf", return_value=(b"%PDF", "Test Book"))
def test_process_book_happy_path(mock_dl, mock_ext, mock_up, mock_chunk, mock_upsert):
    from worker.tasks import _process_book_impl

    # Call the impl directly (avoids Dramatiq broker)
    _process_book_impl("book_001")

    mock_dl.assert_called_once_with("book_001")
    mock_ext.assert_called_once_with("book_001", "Test Book", b"%PDF")
    mock_up.assert_called_once_with("book_001", FAKE_MANUSCRIPT)
    mock_chunk.assert_called_once_with(FAKE_MANUSCRIPT)
    mock_upsert.assert_called_once_with("book_001", FAKE_CHUNKS)


@patch("worker.tasks.set_book_status")
@patch("worker.tasks.download_pdf", side_effect=RuntimeError("storage error"))
def test_process_book_sets_error_on_failure(mock_dl, mock_status):
    from worker.tasks import _process_book_impl

    with pytest.raises(RuntimeError, match="storage error"):
        _process_book_impl("book_001")

    mock_status.assert_called_once_with("book_001", "error")


@patch("worker.tasks.upsert_chunks")
@patch("worker.tasks.chunk_manuscript", return_value=FAKE_CHUNKS)
@patch("worker.tasks.download_manuscript", return_value=FAKE_MANUSCRIPT)
def test_rechunk_book_happy_path(mock_dl, mock_chunk, mock_upsert):
    from worker.tasks import _rechunk_book_impl

    _rechunk_book_impl("book_001")

    mock_dl.assert_called_once_with("book_001")
    mock_chunk.assert_called_once_with(FAKE_MANUSCRIPT)
    mock_upsert.assert_called_once_with("book_001", FAKE_CHUNKS)


@patch("worker.tasks.set_book_status")
@patch("worker.tasks.download_manuscript", side_effect=RuntimeError("not found"))
def test_rechunk_book_sets_error_on_failure(mock_dl, mock_status):
    from worker.tasks import _rechunk_book_impl

    with pytest.raises(RuntimeError, match="not found"):
        _rechunk_book_impl("book_001")

    mock_status.assert_called_once_with("book_001", "error")
```

- [ ] **Step 2: Update worker tasks.py to extract testable `_impl` functions**

The Dramatiq `@dramatiq.actor` decorator makes direct testing awkward. Extract the logic into plain functions that the actors call:

```python
# In server/worker/tasks.py, change process_book and rechunk_book to:

def _process_book_impl(book_id: str) -> None:
    """Core pipeline logic — testable without Dramatiq broker."""
    pdf_bytes, title = download_pdf(book_id)
    manuscript = extract_manuscript(book_id, title, pdf_bytes)
    upload_manuscript(book_id, manuscript)
    chunks = chunk_manuscript(manuscript)
    upsert_chunks(book_id, chunks)


@dramatiq.actor
def process_book(book_id: str) -> None:
    logger.info("Starting book processing | book_id={}", book_id)
    try:
        _process_book_impl(book_id)
        logger.info("Book processing complete | book_id={}", book_id)
    except Exception:
        logger.exception("Book processing failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise


def _rechunk_book_impl(book_id: str) -> None:
    """Core rechunk logic — testable without Dramatiq broker."""
    manuscript = download_manuscript(book_id)
    chunks = chunk_manuscript(manuscript)
    upsert_chunks(book_id, chunks)


@dramatiq.actor
def rechunk_book(book_id: str) -> None:
    logger.info("Starting rechunk | book_id={}", book_id)
    try:
        _rechunk_book_impl(book_id)
        logger.info("Rechunk complete | book_id={}", book_id)
    except Exception:
        logger.exception("Rechunk failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise
```

- [ ] **Step 3: Run tests — expect pass**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/services/test_worker_tasks.py -v`
Expected: all 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add server/tests/services/test_worker_tasks.py server/worker/tasks.py
git commit -m "test: add worker task orchestration tests"
```

---

### Task 10: Bot-side changes (chunk_hint in BookChunk)

**Files:**
- Modify: `server/bot/library.py:43-47`
- Modify: `server/bot/supabase_client.py:38`
- Modify: `server/tests/bot/test_library.py:18-34`

- [ ] **Step 1: Add chunk_hint to BookChunk model**

In `server/bot/library.py`, change the `BookChunk` class (line 43-47):

```python
# Before:
class BookChunk(BaseModel):
    chunk_index: int
    chunk_kind: ChunkKind = ChunkKind.CONTENT
    chapter_title: str
    text: str

# After:
class BookChunk(BaseModel):
    chunk_index: int
    chunk_kind: ChunkKind = ChunkKind.CONTENT
    chapter_title: str
    chunk_hint: str = ""
    text: str
```

- [ ] **Step 2: Include chunk_hint in Supabase query**

In `server/bot/supabase_client.py`, change line 38:

```python
# Before:
        .select("chunk_index, chunk_kind, chapter_title, text")

# After:
        .select("chunk_index, chunk_kind, chapter_title, chunk_hint, text")
```

Also update `get_chunk_at` (line 78):

```python
# Before:
        .select("chapter_title, text")

# After:
        .select("chapter_title, chunk_hint, text")
```

- [ ] **Step 3: Update test fixtures**

In `server/tests/bot/test_library.py`, add `chunk_hint` to `FAKE_CHUNKS` (line 18-34):

```python
FAKE_CHUNKS = [
    {
        "chunk_index": 0,
        "chapter_title": "Chapter I",
        "chunk_hint": "The story begins.",
        "text": "Once upon a time.",
    },
    {
        "chunk_index": 1,
        "chapter_title": "Chapter I",
        "chunk_hint": "The rabbit appears.",
        "text": "There was a rabbit.",
    },
    {
        "chunk_index": 2,
        "chapter_title": "Chapter II",
        "chunk_hint": "The story ends.",
        "text": "The end.",
    },
]
```

- [ ] **Step 4: Run all bot tests**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest tests/bot/ -v`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/bot/library.py server/bot/supabase_client.py server/tests/bot/test_library.py
git commit -m "feat: add chunk_hint to BookChunk model and queries"
```

---

### Task 11: Delete old scripts

**Files:**
- Delete: `scripts/process_pdf_from_supabase.py`
- Delete: `scripts/load_chunks_to_supabase.py`

- [ ] **Step 1: Remove old scripts**

```bash
git rm scripts/process_pdf_from_supabase.py scripts/load_chunks_to_supabase.py
```

- [ ] **Step 2: Run full test suite to confirm nothing breaks**

Run: `cd /Users/isabelleredactive/src/readme/server && python -m pytest -v`
Expected: all tests PASS (no code imports these scripts)

- [ ] **Step 3: Run quality checks**

Run: `cd /Users/isabelleredactive/src/readme/server && ruff check && ruff format`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old PDF processing scripts (replaced by pdf_pipeline service)"
```

---

## Chunk 6: Integration test

### Task 12: End-to-end smoke test

- [ ] **Step 1: Start the dev stack**

Run: `docker compose up -d`

- [ ] **Step 2: Upload a test PDF via the API**

Use a small children's book PDF. This triggers `process_book` in the worker.

```bash
curl -X POST http://localhost:8000/admin/books/upload \
  -F "household_id=test_household" \
  -F "file=@/path/to/test-book.pdf"
```

Expected: returns `{"book_id": "...", "status": "processing", ...}`

- [ ] **Step 3: Watch worker logs for completion**

Run: `docker compose logs worker --tail=100 -f`

Expected: see log lines for:
- "Starting book processing"
- "Extracted N pages"
- "Cleaning text with LLM"
- "Uploaded manuscript"
- "Produced N chunks"
- "Upserted N chunks, status=ready"
- "Book processing complete"

- [ ] **Step 4: Verify chunks in Supabase**

Check that `book_chunks` rows exist with `chunk_hint` populated:

```bash
# Via Supabase dashboard or:
curl "http://localhost:54321/rest/v1/book_chunks?book_id=eq.<book_id>&select=chunk_index,chunk_hint,text&limit=3" \
  -H "apikey: <anon-key>"
```

- [ ] **Step 5: Test rechunking**

Trigger rechunk (you may need to add a temporary endpoint or call from Python shell):

```python
from worker.tasks import rechunk_book
rechunk_book.send("<book_id>")
```

Verify worker logs show "Starting rechunk" and new chunks are produced.
