# Ingestion Batching (P0.1b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the PDF ingestion pipeline so long books (up to trade-size chapter books) ingest without hitting Gemini's output-token cap.

**Architecture:** Split responsibilities cleanly across single-purpose LLM passes — batched per-page-range cleaning, a dedicated chapter-detection call, pure in-code slicing, per-chapter body chunking. `upsert_chunks` stays atomic; `book_chunks` schema unchanged; bot untouched. See `docs/superpowers/specs/2026-04-16-ingestion-batching-design.md` for the full spec.

**Tech Stack:** Python 3.13, Pydantic, PyMuPDF, google-genai (Gemini 2.5 Flash), tenacity, pytest, loguru, Supabase, Modal.

**Repo conventions you need to know:**
- Tests live at `server/tests/services/` and run from `server/` with `uv run pytest`.
- `pyproject.toml` has `pythonpath = ["."]` — imports in tests use `workers.pdf_pipeline.…`.
- `ruff` is the linter (`uv run ruff check` and `uv run ruff format`).
- Type checker is `ty` (`uv run ty check` — optional but recommended).
- Prefer arrow-style lambdas-for-helpers only where natural; this is Python — regular `def` is fine.
- Gemini client wrappers `generate_text` and `generate_structured` already retry on quota errors via `tenacity` (`server/workers/pdf_pipeline/_gemini.py:47-53`). Do not re-wrap.

**Target test command throughout:**

```bash
cd server && uv run pytest tests/services/<file>.py -v
```

---

## File map

| File | Responsibility |
|---|---|
| `server/workers/pdf_pipeline/models.py` | Data types — `PageContent`, `Chapter`, `Manuscript`, `_ChapterTitles`, `LLMChunk`, `Chunk` |
| `server/workers/pdf_pipeline/extract.py` | PDF → `Manuscript`. Batched cleaning, chapter detection, slicing |
| `server/workers/pdf_pipeline/chunk.py` | `Chapter` → `list[Chunk]`. Per-chapter LLM chunking + wrapping |
| `server/workers/pdf_pipeline/storage.py` | **No change** — `upsert_chunks` stays atomic |
| `server/workers/pdf_pipeline/__init__.py` | Re-exports — drop `chunk_manuscript`, add `chunk_chapter` |
| `server/workers/book_processor_jobs.py` | Top-level job — chapter loop + single `upsert_chunks` call |
| `server/tests/services/test_models.py` | Model tests — update for new schema |
| `server/tests/services/test_extract.py` | Extract tests — rewrite around new helpers + new `Manuscript` shape |
| `server/tests/services/test_chunk.py` | Chunk tests — rewrite around `chunk_chapter` |
| `server/tests/services/test_storage.py` | Storage tests — update `Manuscript` constructor calls only |
| `server/tests/services/test_worker_tasks.py` | Integration tests — update `Manuscript` fixture and assertion chain |

---

### Task 1: Rewrite data models

**Files:**
- Modify: `server/workers/pdf_pipeline/models.py`
- Modify: `server/tests/services/test_models.py`

- [ ] **Step 1.1: Replace `models.py` with the new schema**

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


class Chapter(BaseModel):
    """One chapter. Order is determined by list position; no explicit index."""

    title: str | None  # None for untitled/single-chapter books
    text: str  # verbatim body (no heading in the text)


class Manuscript(BaseModel):
    """Cleaned, structured output of extraction. Persisted to Supabase Storage."""

    book_id: str
    title: str
    chapters: list[Chapter]  # ordered, always >= 1
    extraction_model: str
    pages_total: int
    image_pages: int


class _ChapterTitles(BaseModel):
    """Internal structured-output wrapper for the chapter-detection call."""

    titles: list[str]


class LLMChunk(BaseModel):
    """Raw chunker output — kind/title are added at the caller."""

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

- [ ] **Step 1.2: Replace `test_models.py` with matching tests**

```python
"""Unit tests for pdf_pipeline models."""

from workers.pdf_pipeline.models import (
    Chapter,
    Chunk,
    LLMChunk,
    Manuscript,
    PageContent,
    _ChapterTitles,
)


class TestPageContent:
    def test_create_text_only(self):
        page = PageContent(page_number=1, text="Hello world")
        assert page.page_number == 1
        assert page.text == "Hello world"
        assert page.image_bytes is None

    def test_create_with_image(self):
        page = PageContent(page_number=2, text="", image_bytes=b"\x89PNG")
        assert page.image_bytes == b"\x89PNG"


class TestChapter:
    def test_titled(self):
        c = Chapter(title="The Boy Who Lived", text="Mr. and Mrs. Dursley...")
        assert c.title == "The Boy Who Lived"

    def test_untitled(self):
        c = Chapter(title=None, text="Once upon a time...")
        assert c.title is None


class TestManuscript:
    def test_create(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[Chapter(title=None, text="Once upon a time.")],
            extraction_model="gemini-2.5-flash",
            pages_total=10,
            image_pages=3,
        )
        assert m.book_id == "book_001"
        assert len(m.chapters) == 1
        assert m.chapters[0].text == "Once upon a time."

    def test_serialization_roundtrip(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[
                Chapter(title="Chapter 1", text="Body one."),
                Chapter(title="Chapter 2", text="Body two."),
            ],
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        data = m.model_dump_json()
        m2 = Manuscript.model_validate_json(data)
        assert m2 == m


class TestChapterTitles:
    def test_empty(self):
        t = _ChapterTitles(titles=[])
        assert t.titles == []

    def test_populated(self):
        t = _ChapterTitles(titles=["Chapter 1", "Chapter 2"])
        assert len(t.titles) == 2


class TestLLMChunk:
    def test_create(self):
        c = LLMChunk(chunk_hint="The hero arrives.", text="He walked into town.")
        assert c.chunk_hint == "The hero arrives."


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

    def test_chapter_title_kind(self):
        c = Chunk(
            chunk_index=1,
            chunk_kind="chapter_title",
            chapter_title="Chapter 2",
            chunk_hint="Start of chapter: Chapter 2",
            text="Chapter 2",
        )
        assert c.chunk_kind == "chapter_title"
```

- [ ] **Step 1.3: Run the model tests and confirm they pass**

```bash
cd server && uv run pytest tests/services/test_models.py -v
```

Expected: all tests pass. Other test files will still reference the old schema and will fail — that's expected and gets fixed in later tasks.

- [ ] **Step 1.4: Commit**

```bash
git add server/workers/pdf_pipeline/models.py server/tests/services/test_models.py
git commit -m "refactor(pdf_pipeline): make chapters first-class in Manuscript"
```

---

### Task 2: Add `_page_batches` helper to extract.py

**Files:**
- Modify: `server/workers/pdf_pipeline/extract.py`
- Modify: `server/tests/services/test_extract.py`

- [ ] **Step 2.1: Write the failing test**

Add the following class to `server/tests/services/test_extract.py` at the bottom of the file (keep existing tests in place for now — we'll replace them in later tasks):

```python
from workers.pdf_pipeline.extract import _page_batches  # noqa: E402


class TestPageBatches:
    def _pages(self, n: int) -> list[PageContent]:
        return [PageContent(page_number=i + 1, text=f"p{i}") for i in range(n)]

    def test_single_batch_when_smaller_than_size(self):
        batches = list(_page_batches(self._pages(5), size=20))
        assert len(batches) == 1
        assert len(batches[0]) == 5

    def test_exact_multiple(self):
        batches = list(_page_batches(self._pages(40), size=20))
        assert [len(b) for b in batches] == [20, 20]

    def test_last_batch_smaller(self):
        batches = list(_page_batches(self._pages(45), size=20))
        assert [len(b) for b in batches] == [20, 20, 5]

    def test_empty_input(self):
        batches = list(_page_batches([], size=20))
        assert batches == []

    def test_preserves_order_and_content(self):
        pages = self._pages(25)
        flat = [p for batch in _page_batches(pages, size=10) for p in batch]
        assert flat == pages
```

- [ ] **Step 2.2: Run the test and confirm it fails**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestPageBatches -v
```

Expected: ImportError on `_page_batches`.

- [ ] **Step 2.3: Implement `_page_batches` in `extract.py`**

Add this function to `server/workers/pdf_pipeline/extract.py` immediately after `_extract_pages`:

```python
def _page_batches(pages: list[PageContent], size: int) -> list[list[PageContent]]:
    """Group pages into consecutive windows of `size`. Last window may be smaller."""
    return [pages[i : i + size] for i in range(0, len(pages), size)]
```

- [ ] **Step 2.4: Run the test and confirm it passes**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestPageBatches -v
```

Expected: all `TestPageBatches` tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add server/workers/pdf_pipeline/extract.py server/tests/services/test_extract.py
git commit -m "feat(pdf_pipeline): add _page_batches helper for batched extraction"
```

---

### Task 3: Add `_slice_into_chapters` helper to extract.py

**Files:**
- Modify: `server/workers/pdf_pipeline/extract.py`
- Modify: `server/tests/services/test_extract.py`

- [ ] **Step 3.1: Write the failing tests**

Add at the bottom of `server/tests/services/test_extract.py`:

```python
from workers.pdf_pipeline.extract import _slice_into_chapters  # noqa: E402
from workers.pdf_pipeline.models import Chapter  # noqa: E402


class TestSliceIntoChapters:
    def test_no_titles_returns_single_untitled_chapter(self):
        text = "Once upon a time there was a rabbit."
        chapters = _slice_into_chapters(text, [])
        assert chapters == [Chapter(title=None, text="Once upon a time there was a rabbit.")]

    def test_no_titles_strips_whitespace(self):
        chapters = _slice_into_chapters("   body text  \n", [])
        assert chapters[0].text == "body text"

    def test_titles_found_slice_correctly(self):
        text = "Chapter 1\nBody one here.\n\nChapter 2\nBody two here."
        chapters = _slice_into_chapters(text, ["Chapter 1", "Chapter 2"])
        assert len(chapters) == 2
        assert chapters[0].title == "Chapter 1"
        assert chapters[0].text == "Body one here."
        assert chapters[1].title == "Chapter 2"
        assert chapters[1].text == "Body two here."

    def test_opening_prelude_becomes_untitled_chapter(self):
        text = "Preface words before anything.\n\nChapter 1\nBody here."
        chapters = _slice_into_chapters(text, ["Chapter 1"])
        assert len(chapters) == 2
        assert chapters[0].title is None
        assert chapters[0].text == "Preface words before anything."
        assert chapters[1].title == "Chapter 1"
        assert chapters[1].text == "Body here."

    def test_hallucinated_title_is_skipped(self):
        text = "Chapter 1\nBody one.\n\nChapter 2\nBody two."
        chapters = _slice_into_chapters(
            text, ["Chapter 1", "Chapter XYZ Not In Text", "Chapter 2"]
        )
        assert [c.title for c in chapters] == ["Chapter 1", "Chapter 2"]

    def test_all_titles_hallucinated_falls_back_to_single_untitled(self):
        text = "Just some body text with no real chapter headings."
        chapters = _slice_into_chapters(text, ["Chapter 99"])
        assert chapters == [Chapter(title=None, text=text)]

    def test_duplicate_title_strings_match_monotonically(self):
        text = "Chapter 1\nFirst body.\n\nChapter 1\nSecond body."
        chapters = _slice_into_chapters(text, ["Chapter 1", "Chapter 1"])
        assert len(chapters) == 2
        assert chapters[0].text == "First body."
        assert chapters[1].text == "Second body."
```

- [ ] **Step 3.2: Run the tests and confirm they fail**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestSliceIntoChapters -v
```

Expected: ImportError on `_slice_into_chapters`.

- [ ] **Step 3.3: Implement `_slice_into_chapters` in `extract.py`**

Add this function to `server/workers/pdf_pipeline/extract.py` after `_page_batches`:

```python
def _slice_into_chapters(text: str, titles: list[str]) -> list[Chapter]:
    """Split cleaned manuscript text into Chapter objects using detected titles.

    Each title is located monotonically (`text.find(title, cursor)`), so duplicate
    strings match distinct occurrences. Titles not found in the text are skipped
    with a warning.
    """
    if not titles:
        return [Chapter(title=None, text=text.strip())]

    found: list[tuple[str, int]] = []
    cursor = 0
    for title in titles:
        idx = text.find(title, cursor)
        if idx < 0:
            logger.warning("Detected chapter title not found in text | title={}", title)
            continue
        found.append((title, idx))
        cursor = idx + len(title)

    if not found:
        return [Chapter(title=None, text=text.strip())]

    chapters: list[Chapter] = []
    first_idx = found[0][1]
    if first_idx > 0:
        prelude = text[:first_idx].strip()
        if prelude:
            chapters.append(Chapter(title=None, text=prelude))

    for i, (title, idx) in enumerate(found):
        body_start = idx + len(title)
        body_end = found[i + 1][1] if i + 1 < len(found) else len(text)
        chapters.append(Chapter(title=title, text=text[body_start:body_end].strip()))

    return chapters
```

Import `Chapter` at the top of `extract.py` if not already present:

```python
from .models import Chapter, Manuscript, PageContent
```

- [ ] **Step 3.4: Run the tests and confirm they pass**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestSliceIntoChapters -v
```

Expected: all `TestSliceIntoChapters` tests pass.

- [ ] **Step 3.5: Commit**

```bash
git add server/workers/pdf_pipeline/extract.py server/tests/services/test_extract.py
git commit -m "feat(pdf_pipeline): add _slice_into_chapters helper"
```

---

### Task 4: Rename `_clean_text_with_llm` → `_clean_batch` with updated prompt

**Files:**
- Modify: `server/workers/pdf_pipeline/extract.py`
- Modify: `server/tests/services/test_extract.py`

- [ ] **Step 4.1: Replace `_clean_text_with_llm` with `_clean_batch` in `extract.py`**

Delete the existing `_clean_text_with_llm` function and replace with:

```python
def _clean_batch(pages: list[PageContent]) -> str:
    """Clean one page-range batch. Returns the cleaned text for just that batch."""
    parts: list[types.Part | str] = []

    parts.append(
        """You are cleaning a page range from a children's book PDF. This may be the entire
book or only part of it.

Instructions:
- Concatenate all pages into one continuous story text.
- Strip front matter: title page, copyright, ISBN, dedication, publisher info.
- Strip back matter: glossary, author bio, discussion guide, FAQs, marketing.
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
```

- [ ] **Step 4.2: Update `test_extract.py` — rename `TestCleanTextWithLLM` to `TestCleanBatch`**

Find the existing `TestCleanTextWithLLM` class in `server/tests/services/test_extract.py` and replace it with:

```python
class TestCleanBatch:
    @patch("workers.pdf_pipeline.extract._gemini_generate")
    def test_returns_cleaned_text(self, mock_gemini):
        from workers.pdf_pipeline.extract import _clean_batch

        mock_gemini.return_value = "Once upon a time there was a story."
        pages = [
            PageContent(page_number=1, text="Copyright 2024.\nOnce upon a time"),
            PageContent(page_number=2, text="there was a story.\nAbout the author..."),
        ]
        result = _clean_batch(pages)
        assert result == "Once upon a time there was a story."
        mock_gemini.assert_called_once()

    @patch("workers.pdf_pipeline.extract._gemini_generate")
    def test_image_page_includes_image_part(self, mock_gemini):
        from workers.pdf_pipeline.extract import _clean_batch

        mock_gemini.return_value = "ok"
        pages = [PageContent(page_number=1, text="short", image_bytes=b"\x89PNG")]
        _clean_batch(pages)
        # The parts list passed to the LLM should be non-trivial (prompt + marker + image)
        called_parts = mock_gemini.call_args.args[0]
        assert any("[[PAGE 1 — image]]" in p for p in called_parts if isinstance(p, str))
```

- [ ] **Step 4.3: Run the tests and confirm they pass**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestCleanBatch -v
```

Expected: both tests pass.

- [ ] **Step 4.4: Commit**

```bash
git add server/workers/pdf_pipeline/extract.py server/tests/services/test_extract.py
git commit -m "refactor(pdf_pipeline): rename _clean_text_with_llm to _clean_batch; widen prompt framing"
```

---

### Task 5: Add `_detect_chapters` function

**Files:**
- Modify: `server/workers/pdf_pipeline/extract.py`
- Modify: `server/tests/services/test_extract.py`

- [ ] **Step 5.1: Write the failing tests**

Add the following class at the bottom of `server/tests/services/test_extract.py`:

```python
class TestDetectChapters:
    @patch("workers.pdf_pipeline.extract.generate_structured")
    def test_returns_title_list(self, mock_structured):
        from workers.pdf_pipeline.extract import _detect_chapters
        from workers.pdf_pipeline.models import _ChapterTitles

        mock_structured.return_value = _ChapterTitles(
            titles=["The Boy Who Lived", "The Vanishing Glass"]
        )
        titles = _detect_chapters("...manuscript text...")
        assert titles == ["The Boy Who Lived", "The Vanishing Glass"]

    @patch("workers.pdf_pipeline.extract.generate_structured")
    def test_no_chapters_returns_empty_list(self, mock_structured):
        from workers.pdf_pipeline.extract import _detect_chapters
        from workers.pdf_pipeline.models import _ChapterTitles

        mock_structured.return_value = _ChapterTitles(titles=[])
        assert _detect_chapters("Picture book with no chapters.") == []

    @patch("workers.pdf_pipeline.extract.generate_structured")
    def test_passes_manuscript_text_as_prompt(self, mock_structured):
        from workers.pdf_pipeline.extract import _detect_chapters
        from workers.pdf_pipeline.models import _ChapterTitles

        mock_structured.return_value = _ChapterTitles(titles=[])
        manuscript = "Chapter 1\nOnce upon a time..."
        _detect_chapters(manuscript)

        called_prompt = mock_structured.call_args.args[0]
        assert manuscript in called_prompt
```

- [ ] **Step 5.2: Run the tests and confirm they fail**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestDetectChapters -v
```

Expected: ImportError on `_detect_chapters`.

- [ ] **Step 5.3: Implement `_detect_chapters` in `extract.py`**

First, update the imports at the top of `server/workers/pdf_pipeline/extract.py` to include `generate_structured` and `_ChapterTitles`:

```python
from ._gemini import LLM_MODEL, generate_structured, generate_text
from .models import Chapter, Manuscript, PageContent, _ChapterTitles
```

Also replace the existing line `from ._gemini import LLM_MODEL, generate_text` — keep `generate_text` for `_gemini_generate` but add `generate_structured`.

Then add after `_clean_batch`:

```python
def _detect_chapters(manuscript_text: str) -> list[str]:
    """One LLM call that returns the chapter headings detected in the manuscript.

    Returns an empty list if the book has no chapters (e.g. a picture book) or
    if the model is unsure.
    """
    prompt = f"""You are analyzing the cleaned text of a children's book to find chapter headings.

A chapter heading is a line that:
- Appears alone on its own line (surrounded by blank lines / paragraph breaks)
- Is short (typically under 10 words)
- Precedes a body of prose
- May or may not contain the word "Chapter" or a number

A line that is part of a paragraph is NOT a heading.
If you are unsure whether a line is a heading, do NOT include it.

Return the heading strings in the order they appear, exactly verbatim as they
appear in the text (same capitalization, same punctuation, same whitespace).
If the book has no chapter headings (e.g., a picture book), return an empty list.

Text to analyze:

{manuscript_text}"""

    result = generate_structured(prompt, _ChapterTitles)
    return result.titles
```

- [ ] **Step 5.4: Run the tests and confirm they pass**

```bash
cd server && uv run pytest tests/services/test_extract.py::TestDetectChapters -v
```

Expected: all `TestDetectChapters` tests pass.

- [ ] **Step 5.5: Commit**

```bash
git add server/workers/pdf_pipeline/extract.py server/tests/services/test_extract.py
git commit -m "feat(pdf_pipeline): add _detect_chapters dedicated LLM pass"
```

---

### Task 6: Rewire `extract_manuscript` to use the new flow

**Files:**
- Modify: `server/workers/pdf_pipeline/extract.py`
- Modify: `server/tests/services/test_extract.py`

- [ ] **Step 6.1: Replace `extract_manuscript` body in `extract.py`**

Delete the existing `extract_manuscript` function and replace with:

```python
def extract_manuscript(book_id: str, title: str, pdf_bytes: bytes) -> Manuscript:
    """Extract and clean a PDF into a Manuscript with chapters."""
    logger.info("Extracting pages | book_id={}", book_id)
    pages = _extract_pages(pdf_bytes)
    image_pages = sum(1 for p in pages if p.image_bytes)
    logger.info(
        "Extracted {} pages ({} image, {} text) | book_id={}",
        len(pages),
        image_pages,
        len(pages) - image_pages,
        book_id,
    )

    batches = _page_batches(pages, size=20)
    logger.info("Cleaning {} batches | book_id={}", len(batches), book_id)
    cleaned_batches = [_clean_batch(batch) for batch in batches]
    manuscript_text = "\n\n".join(cleaned_batches)

    logger.info("Detecting chapters | book_id={}", book_id)
    chapter_titles = _detect_chapters(manuscript_text)
    chapters = _slice_into_chapters(manuscript_text, chapter_titles)
    logger.info("Produced {} chapters | book_id={}", len(chapters), book_id)

    return Manuscript(
        book_id=book_id,
        title=title,
        chapters=chapters,
        extraction_model=LLM_MODEL,
        pages_total=len(pages),
        image_pages=image_pages,
    )
```

- [ ] **Step 6.2: Replace the `TestExtractManuscript` class in `test_extract.py`**

Find `TestExtractManuscript` in `server/tests/services/test_extract.py` and replace it with:

```python
class TestExtractManuscript:
    @patch("workers.pdf_pipeline.extract._detect_chapters")
    @patch("workers.pdf_pipeline.extract._clean_batch")
    @patch("workers.pdf_pipeline.extract._extract_pages")
    def test_titled_chapters_end_to_end(self, mock_pages, mock_clean, mock_detect):
        mock_pages.return_value = [
            PageContent(page_number=1, text="Hello world " * 20),
            PageContent(page_number=2, text="short", image_bytes=b"\x89PNG"),
        ]
        mock_clean.return_value = "Chapter 1\nBody one.\n\nChapter 2\nBody two."
        mock_detect.return_value = ["Chapter 1", "Chapter 2"]

        result = extract_manuscript("book_001", "Test Book", b"%PDF-fake")

        assert isinstance(result, Manuscript)
        assert result.book_id == "book_001"
        assert result.title == "Test Book"
        assert result.pages_total == 2
        assert result.image_pages == 1
        assert [c.title for c in result.chapters] == ["Chapter 1", "Chapter 2"]
        assert result.chapters[0].text == "Body one."
        assert result.chapters[1].text == "Body two."

    @patch("workers.pdf_pipeline.extract._detect_chapters")
    @patch("workers.pdf_pipeline.extract._clean_batch")
    @patch("workers.pdf_pipeline.extract._extract_pages")
    def test_no_chapters_produces_single_untitled(self, mock_pages, mock_clean, mock_detect):
        mock_pages.return_value = [PageContent(page_number=1, text="Body " * 40)]
        mock_clean.return_value = "Once upon a time there was a rabbit."
        mock_detect.return_value = []

        result = extract_manuscript("book_002", "Picture Book", b"%PDF-fake")

        assert len(result.chapters) == 1
        assert result.chapters[0].title is None
        assert result.chapters[0].text == "Once upon a time there was a rabbit."
```

- [ ] **Step 6.3: Run all `test_extract.py` tests**

```bash
cd server && uv run pytest tests/services/test_extract.py -v
```

Expected: all tests pass (TestExtractPages, TestCleanBatch, TestDetectChapters, TestPageBatches, TestSliceIntoChapters, TestExtractManuscript).

- [ ] **Step 6.4: Commit**

```bash
git add server/workers/pdf_pipeline/extract.py server/tests/services/test_extract.py
git commit -m "refactor(pdf_pipeline): rewire extract_manuscript around batched + chapter-detection flow"
```

---

### Task 7: Rewrite `chunk.py` around `chunk_chapter`

**Files:**
- Modify: `server/workers/pdf_pipeline/chunk.py`
- Modify: `server/workers/pdf_pipeline/__init__.py`
- Modify: `server/tests/services/test_chunk.py`

- [ ] **Step 7.1: Replace `chunk.py` entirely**

Replace the contents of `server/workers/pdf_pipeline/chunk.py` with:

```python
"""Step 2: Split a Chapter's body into semantic, TTS-ready chunks."""

from __future__ import annotations

from loguru import logger
from pydantic import BaseModel

from ._gemini import generate_structured
from .models import Chapter, Chunk, LLMChunk


class _LLMChunkResponse(BaseModel):
    chunks: list[LLMChunk]


def _gemini_chunk(text: str) -> list[LLMChunk]:
    """Send one chapter's body text to Gemini; return content chunks only."""
    if not text.strip():
        return []

    prompt = f"""You are chunking one chapter of a children's book for text-to-speech narration.

The chapter heading itself is NOT in the text you're given — do not emit a
chapter_title chunk. Emit only content chunks.

Instructions:
- Split the text into chunks by narrative beat, roughly 150-250 words each.
- Never cut mid-sentence or mid-dialogue.
- Group dialogue with its surrounding action/narration.
- For each chunk, generate a chunk_hint: one sentence describing what happens.
- Strip any non-story content (copyright, marketing, ads) that may have slipped
  through extraction.
- Preserve the story text VERBATIM — do not paraphrase.

Text to chunk:

{text}"""

    result = generate_structured(prompt, _LLMChunkResponse)
    return result.chunks


def chunk_chapter(chapter: Chapter, starting_index: int) -> list[Chunk]:
    """Produce the final Chunk list for one chapter, including a chapter_title
    chunk if the chapter is titled."""
    chunks: list[Chunk] = []
    idx = starting_index

    if chapter.title:
        chunks.append(
            Chunk(
                chunk_index=idx,
                chunk_kind="chapter_title",
                chapter_title=chapter.title,
                chunk_hint=f"Start of chapter: {chapter.title}",
                text=chapter.title,
            )
        )
        idx += 1

    body = _gemini_chunk(chapter.text)
    logger.info(
        "Chunked chapter | title={} body_chunks={}", chapter.title or "(untitled)", len(body)
    )
    for c in body:
        chunks.append(
            Chunk(
                chunk_index=idx,
                chunk_kind="content",
                chapter_title=chapter.title or "",
                chunk_hint=c.chunk_hint,
                text=c.text,
            )
        )
        idx += 1

    return chunks
```

- [ ] **Step 7.2: Update `__init__.py` to export `chunk_chapter`**

Replace the contents of `server/workers/pdf_pipeline/__init__.py` with:

```python
"""PDF extraction and chunking pipeline."""

from .chunk import chunk_chapter
from .extract import extract_manuscript
from .storage import (
    download_manuscript,
    download_pdf,
    set_book_status,
    upload_manuscript,
    upsert_chunks,
)

__all__ = [
    "chunk_chapter",
    "download_manuscript",
    "download_pdf",
    "extract_manuscript",
    "set_book_status",
    "upload_manuscript",
    "upsert_chunks",
]
```

- [ ] **Step 7.3: Replace `test_chunk.py` entirely**

Replace the contents of `server/tests/services/test_chunk.py` with:

```python
"""Unit tests for pdf_pipeline chunking."""

from __future__ import annotations

from unittest.mock import patch

from workers.pdf_pipeline.chunk import chunk_chapter
from workers.pdf_pipeline.models import Chapter, Chunk, LLMChunk


class TestChunkChapter:
    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_titled_chapter_emits_title_chunk_then_body(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="Dursleys arrive.", text="Mr. and Mrs. Dursley..."),
            LLMChunk(chunk_hint="They go to work.", text="He drove to work..."),
        ]
        chapter = Chapter(title="The Boy Who Lived", text="Mr. and Mrs. Dursley...")

        result = chunk_chapter(chapter, starting_index=0)

        assert len(result) == 3
        assert result[0].chunk_kind == "chapter_title"
        assert result[0].chunk_index == 0
        assert result[0].chapter_title == "The Boy Who Lived"
        assert result[0].text == "The Boy Who Lived"
        assert result[1].chunk_kind == "content"
        assert result[1].chunk_index == 1
        assert result[1].chapter_title == "The Boy Who Lived"
        assert result[2].chunk_index == 2

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_untitled_chapter_emits_only_content_chunks(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="Rabbit runs.", text="The rabbit ran fast."),
        ]
        chapter = Chapter(title=None, text="The rabbit ran fast.")

        result = chunk_chapter(chapter, starting_index=0)

        assert len(result) == 1
        assert result[0].chunk_kind == "content"
        assert result[0].chunk_index == 0
        assert result[0].chapter_title == ""  # empty string for untitled

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_starting_index_is_respected(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="Body.", text="Some body text."),
        ]
        chapter = Chapter(title="Chapter 2", text="Some body text.")

        result = chunk_chapter(chapter, starting_index=10)

        assert [c.chunk_index for c in result] == [10, 11]

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_empty_body_titled_chapter_still_emits_title_chunk(self, mock_chunk):
        mock_chunk.return_value = []
        chapter = Chapter(title="Chapter 1", text="")

        result = chunk_chapter(chapter, starting_index=0)

        assert len(result) == 1
        assert result[0].chunk_kind == "chapter_title"

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_returns_chunk_instances(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="H.", text="Body."),
        ]
        result = chunk_chapter(Chapter(title=None, text="Body."), starting_index=0)
        assert all(isinstance(c, Chunk) for c in result)
```

- [ ] **Step 7.4: Run the chunk tests**

```bash
cd server && uv run pytest tests/services/test_chunk.py -v
```

Expected: all `TestChunkChapter` tests pass.

- [ ] **Step 7.5: Commit**

```bash
git add server/workers/pdf_pipeline/chunk.py server/workers/pdf_pipeline/__init__.py server/tests/services/test_chunk.py
git commit -m "refactor(pdf_pipeline): replace chunk_manuscript with per-chapter chunk_chapter"
```

---

### Task 8: Rewire `book_processor_jobs.py`

**Files:**
- Modify: `server/workers/book_processor_jobs.py`
- Modify: `server/tests/services/test_worker_tasks.py`

- [ ] **Step 8.1: Replace `book_processor_jobs.py` entirely**

Replace the contents of `server/workers/book_processor_jobs.py` with:

```python
from loguru import logger

from workers.pdf_pipeline import (
    chunk_chapter,
    download_manuscript,
    download_pdf,
    extract_manuscript,
    set_book_status,
    upload_manuscript,
    upsert_chunks,
)
from workers.pdf_pipeline.models import Chunk, Manuscript


def _chapters_to_chunks(manuscript: Manuscript) -> list[Chunk]:
    all_chunks: list[Chunk] = []
    for chapter in manuscript.chapters:
        all_chunks.extend(chunk_chapter(chapter, starting_index=len(all_chunks)))
    return all_chunks


def process_book_job(book_id: str) -> None:
    logger.info("Starting book processing | book_id={}", book_id)
    try:
        pdf_bytes, title = download_pdf(book_id)
        manuscript = extract_manuscript(book_id, title, pdf_bytes)
        upload_manuscript(book_id, manuscript)
        chunks = _chapters_to_chunks(manuscript)
        upsert_chunks(book_id, chunks)
        logger.info("Book processing complete | book_id={}", book_id)
    except Exception:
        logger.exception("Book processing failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise


def rechunk_book_job(book_id: str) -> None:
    logger.info("Starting rechunk | book_id={}", book_id)
    try:
        manuscript = download_manuscript(book_id)
        chunks = _chapters_to_chunks(manuscript)
        upsert_chunks(book_id, chunks)
        logger.info("Rechunk complete | book_id={}", book_id)
    except Exception:
        logger.exception("Rechunk failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise
```

- [ ] **Step 8.2: Replace `test_worker_tasks.py` entirely**

Replace the contents of `server/tests/services/test_worker_tasks.py` with:

```python
"""Unit tests for worker task orchestration."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from workers.pdf_pipeline.models import Chapter, Chunk, LLMChunk, Manuscript

FAKE_MANUSCRIPT = Manuscript(
    book_id="book_001",
    title="Test Book",
    chapters=[
        Chapter(title="Chapter 1", text="First chapter body."),
        Chapter(title=None, text="Untitled chapter body."),
    ],
    extraction_model="gemini-2.5-flash",
    pages_total=5,
    image_pages=1,
)

FAKE_BODY_CHUNKS = [
    LLMChunk(chunk_hint="Opening.", text="Body text."),
]


@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.chunk_chapter")
@patch("workers.book_processor_jobs.upload_manuscript")
@patch("workers.book_processor_jobs.extract_manuscript", return_value=FAKE_MANUSCRIPT)
@patch("workers.book_processor_jobs.download_pdf", return_value=(b"%PDF", "Test Book"))
def test_process_book_happy_path(mock_dl, mock_ext, mock_up, mock_chunk_chapter, mock_upsert):
    from workers.book_processor_jobs import process_book_job

    # Return one chunk per chapter call (titled chapter emits 2 -> title + body; we simplify here)
    mock_chunk_chapter.side_effect = [
        [Chunk(chunk_index=0, chunk_kind="chapter_title", chapter_title="Chapter 1",
               chunk_hint="Start of chapter: Chapter 1", text="Chapter 1"),
         Chunk(chunk_index=1, chunk_kind="content", chapter_title="Chapter 1",
               chunk_hint="Body.", text="First chapter body.")],
        [Chunk(chunk_index=2, chunk_kind="content", chapter_title="",
               chunk_hint="Body.", text="Untitled chapter body.")],
    ]

    process_book_job("book_001")

    mock_dl.assert_called_once_with("book_001")
    mock_ext.assert_called_once_with("book_001", "Test Book", b"%PDF")
    mock_up.assert_called_once_with("book_001", FAKE_MANUSCRIPT)
    assert mock_chunk_chapter.call_count == 2
    # starting_index is 0 for first chapter, 2 after the first chapter produced 2 chunks
    assert mock_chunk_chapter.call_args_list[0].kwargs["starting_index"] == 0
    assert mock_chunk_chapter.call_args_list[1].kwargs["starting_index"] == 2
    # upsert_chunks called exactly once, with flattened list of 3 chunks
    mock_upsert.assert_called_once()
    _, passed_chunks = mock_upsert.call_args.args
    assert len(passed_chunks) == 3
    assert [c.chunk_index for c in passed_chunks] == [0, 1, 2]


@patch("workers.book_processor_jobs.set_book_status")
@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.download_pdf", side_effect=RuntimeError("storage error"))
def test_process_book_sets_error_on_failure(mock_dl, mock_upsert, mock_status):
    from workers.book_processor_jobs import process_book_job

    with pytest.raises(RuntimeError, match="storage error"):
        process_book_job("book_001")

    mock_status.assert_called_once_with("book_001", "error")
    mock_upsert.assert_not_called()


@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.chunk_chapter")
@patch("workers.book_processor_jobs.download_manuscript", return_value=FAKE_MANUSCRIPT)
def test_rechunk_book_happy_path(mock_dl, mock_chunk_chapter, mock_upsert):
    from workers.book_processor_jobs import rechunk_book_job

    mock_chunk_chapter.side_effect = [
        [Chunk(chunk_index=0, chunk_kind="content", chapter_title="Chapter 1",
               chunk_hint="H.", text="First.")],
        [Chunk(chunk_index=1, chunk_kind="content", chapter_title="",
               chunk_hint="H.", text="Second.")],
    ]

    rechunk_book_job("book_001")

    mock_dl.assert_called_once_with("book_001")
    assert mock_chunk_chapter.call_count == 2
    mock_upsert.assert_called_once()
    _, passed_chunks = mock_upsert.call_args.args
    assert len(passed_chunks) == 2


@patch("workers.book_processor_jobs.set_book_status")
@patch("workers.book_processor_jobs.download_manuscript", side_effect=RuntimeError("not found"))
def test_rechunk_book_sets_error_on_failure(mock_dl, mock_status):
    from workers.book_processor_jobs import rechunk_book_job

    with pytest.raises(RuntimeError, match="not found"):
        rechunk_book_job("book_001")

    mock_status.assert_called_once_with("book_001", "error")
```

- [ ] **Step 8.3: Run worker task tests**

```bash
cd server && uv run pytest tests/services/test_worker_tasks.py -v
```

Expected: all 4 tests pass.

- [ ] **Step 8.4: Commit**

```bash
git add server/workers/book_processor_jobs.py server/tests/services/test_worker_tasks.py
git commit -m "refactor(workers): loop chapters through chunk_chapter and upsert once"
```

---

### Task 9: Update `test_storage.py` for new Manuscript shape

**Files:**
- Modify: `server/tests/services/test_storage.py`

- [ ] **Step 9.1: Patch the Manuscript constructor calls in `test_storage.py`**

Locate the two `Manuscript(...)` constructor calls in `server/tests/services/test_storage.py` (one in `TestUploadManuscript.test_uploads_json_to_correct_path`, one in `TestDownloadManuscript.test_parses_json_to_manuscript`) and replace each with:

```python
        manuscript = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[Chapter(title=None, text="Story text.")],
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
```

Also update the import at the top of the file to include `Chapter`:

```python
from workers.pdf_pipeline.models import Chapter, Chunk, Manuscript
```

And update the assertion in `TestDownloadManuscript.test_parses_json_to_manuscript` — the existing `assert result.text == "Story text."` line becomes:

```python
        assert result.chapters[0].text == "Story text."
```

- [ ] **Step 9.2: Run storage tests**

```bash
cd server && uv run pytest tests/services/test_storage.py -v
```

Expected: all tests pass.

- [ ] **Step 9.3: Commit**

```bash
git add server/tests/services/test_storage.py
git commit -m "test(pdf_pipeline): update storage tests for new Manuscript shape"
```

---

### Task 10: Run the full test suite, lint, and clean up

**Files:**
- None (verification only)

- [ ] **Step 10.1: Run the full pdf_pipeline test suite**

```bash
cd server && uv run pytest tests/services/ -v
```

Expected: all tests pass across test_models.py, test_extract.py, test_chunk.py, test_storage.py, and test_worker_tasks.py.

- [ ] **Step 10.2: Run ruff lint and format**

```bash
cd server && uv run ruff check workers/ tests/services/
cd server && uv run ruff format workers/ tests/services/
```

Expected: no lint errors. Format makes no changes (or trivial whitespace fixes).

- [ ] **Step 10.3: If `ty` is available, run type check**

```bash
cd server && uv run ty check workers/pdf_pipeline/ workers/book_processor_jobs.py || true
```

Expected: no new type errors introduced by this change. (The `|| true` guards against ty being unavailable; review any errors that show up.)

- [ ] **Step 10.4: Commit any formatting fixes**

```bash
git status
# If there are changes from ruff format:
git add -u server/
git commit -m "chore: apply ruff format to pdf_pipeline"
```

Skip if nothing changed.

---

### Task 11: Manual real-book fixture verification (run once before merge)

**Files:**
- None (manual verification, no code changes)

This task is not a unit-test task — it's the "spot-check" gate from the spec's Testing section. Do not skip.

- [ ] **Step 11.1: Obtain two public-domain fixture PDFs**

- *The Tale of Peter Rabbit* (Beatrix Potter, public domain) — short picture book with illustrations.
- A Harry Potter Book 1, Chapters 1–3 PDF (~15k words) — multi-chapter trade book with clear headings. If you do not have this file, you can substitute any public-domain children's book with clear "Chapter N" headings (e.g. *The Wonderful Wizard of Oz*, first 3 chapters).

Place both in a scratch directory outside the repo.

- [ ] **Step 11.2: Start the dev stack and upload each book via the UI**

```bash
docker compose up -d
```

Sign in, upload each PDF. Wait for `books.status='ready'`.

- [ ] **Step 11.3: Spot-check the short book (Peter Rabbit)**

Query Supabase (via SQL editor or CLI):

```sql
select chunk_index, chunk_kind, chapter_title, left(text, 60) as text_preview
from book_chunks
where book_id = '<peter_rabbit_book_id>'
order by chunk_index
limit 20;
```

Verify:
- No `chunk_kind='chapter_title'` rows (picture book has no chapter headings).
- `chapter_title` column is empty string for all rows.
- First row's `text` corresponds to the actual opening sentence of the book.

- [ ] **Step 11.4: Spot-check the multi-chapter book**

```sql
select chunk_index, chunk_kind, chapter_title, left(text, 60) as text_preview
from book_chunks
where book_id = '<hp1_book_id>'
order by chunk_index;
```

Verify:
- There is at least one `chunk_kind='chapter_title'` row per actual chapter in the source.
- `chapter_title` column matches the source headings verbatim.
- Sampled content chunks appear verbatim in the source PDF (no paraphrasing).
- `chunk_index` is monotonic with no gaps.

- [ ] **Step 11.5: Document any anomalies**

If any spot-check fails, open an issue with the book title, the affected chunk indices, and the expected vs. actual text. Do not merge until resolved.

- [ ] **Step 11.6: Tear down dev stack**

```bash
docker compose down
```

---

## Self-review

**Spec coverage:**
- Problem & Scope — addressed by the whole plan; no task references scope explicitly because scope is the *boundary*, not a deliverable.
- Data model (`Chapter`, `Manuscript`, `_ChapterTitles`, simplified `LLMChunk`) — Task 1.
- `_page_batches` — Task 2.
- `_slice_into_chapters` — Task 3.
- `_clean_batch` (prompt + rename) — Task 4.
- `_detect_chapters` — Task 5.
- `extract_manuscript` rewiring — Task 6.
- `chunk_chapter` + revised prompt — Task 7.
- Orchestration in `process_book_job` / `rechunk_book_job` — Task 8.
- Storage helpers unchanged — confirmed in Task 9 (only test fixture changes).
- Error handling unchanged — implicit in Task 8 (try/except shape preserved).
- Unit tests table — Tasks 1–8 each ship their tests.
- Real-book fixtures — Task 11.
- Rollout steps — Task 10 covers lint/tests; Task 11 is the manual gate.

**Placeholder scan:** No "TBD", "TODO", "handle edge cases" phrases. Every step has explicit code or commands.

**Type consistency:**
- `_page_batches(pages: list[PageContent], size: int) -> list[list[PageContent]]` — used consistently in Tasks 2 and 6.
- `_clean_batch(pages: list[PageContent]) -> str` — consistent in Tasks 4 and 6.
- `_detect_chapters(manuscript_text: str) -> list[str]` — consistent in Tasks 5 and 6.
- `_slice_into_chapters(text: str, titles: list[str]) -> list[Chapter]` — consistent in Tasks 3 and 6.
- `chunk_chapter(chapter: Chapter, starting_index: int) -> list[Chunk]` — consistent in Tasks 7 and 8.
- `Manuscript.chapters: list[Chapter]` — consistent everywhere.
- `Chapter.title: str | None`, `Chapter.text: str` — consistent.
- `LLMChunk` has only `chunk_hint` and `text` — consistent in Tasks 1, 7, 8.

No inconsistencies found.
