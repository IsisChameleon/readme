# Ingestion Batching (P0.1b)

**Date:** 2026-04-16
**Status:** design spec (pending implementation plan)
**Parent scope:** [`2026-04-16-beta-readiness-scope.md`](../plans/2026-04-16-beta-readiness-scope.md) §P0.1b

## Problem

Today's PDF pipeline fails on long books because both LLM stages must emit roughly all of the input text back as output, and Gemini's 65,536-token output cap blows before the input-context cap does.

- `server/workers/pdf_pipeline/extract.py:45-70` — `_clean_text_with_llm` sends every page to one Gemini call and demands a verbatim concatenated manuscript.
- `server/workers/pdf_pipeline/chunk.py:16-38` — `_gemini_chunk` sends the whole manuscript to one Gemini call and demands every chunk's text verbatim.

Picture books pass. HP1 (~77k words) fails at the chunk stage. Anything above roughly 40–50k words fails at one or both stages.

## Scope

- Beta-readiness fix for `server/workers/pdf_pipeline/`.
- No changes to the bot, the reader UI, upload path, or `book_chunks` table schema.
- No new model provider (stay on `gemini-2.5-flash`). Provider swap is out of scope and handled separately in P0.1a.
- No progressive-read UX. DB writes remain atomic at the end of the job.
- No concurrency across batches.
- Target book range: picture books (1 page) through trade-size chapter books (several hundred pages). No explicit upper cap in the batcher itself; a separate upload-time size gate can be added later if needed (UI-side, independent of this work).

## Solution

Batch the LLM work and split the responsibilities cleanly:

- **Extract (batched)** runs one LLM call per 20-page group to clean the text. Each batch returns a flat string; batches concatenate into the full manuscript text. One job per call — cleaning only, no chapter detection.
- **Chapter detection (one call per book)** runs a dedicated Gemini call on the full manuscript text, returning a list of chapter-heading strings verbatim. One job per call — structural detection only.
- **Slice** is pure code: for each detected title, string-search its first occurrence (monotonically) in the manuscript text and cut. Produces `list[Chapter]`.
- **Chunk (batched)** runs one LLM call per chapter body. Chapter-title chunks are emitted by our code (not the LLM) using the known `Chapter.title`.

Data model changes make chapters first-class in the persisted manuscript. The `book_chunks` table shape is unchanged, so the bot is untouched. `upsert_chunks` stays atomic — chunks are collected in memory across chapters and written in one call at the end (same behavior as today).

## Architecture

### Data model

```python
# models.py

class PageContent(BaseModel):
    """Internal to extraction — unchanged."""
    page_number: int
    text: str
    image_bytes: bytes | None = None

class Chapter(BaseModel):
    """First-class chapter; persisted inside manuscript.json.
    Order is determined by list position — no explicit index field."""
    title: str | None                   # None for untitled/single-chapter books
    text: str                           # verbatim body (no heading in the text)

class Manuscript(BaseModel):
    """Output of Stage 1. Persisted to Supabase Storage."""
    book_id: str
    title: str
    chapters: list[Chapter]             # ordered, always >= 1
    extraction_model: str
    pages_total: int
    image_pages: int

class _ChapterTitles(BaseModel):
    """Internal structured-output wrapper for the chapter-detection call."""
    titles: list[str]

class LLMChunk(BaseModel):
    """Raw chunker output. Kind/title removed — handled at caller."""
    chunk_hint: str
    text: str

class Chunk(BaseModel):
    """Final chunk for DB insertion — unchanged."""
    chunk_index: int
    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str
```

### Pipeline flow

```
process_book_job(book_id)
  ├─ download_pdf(book_id)                    [unchanged]
  ├─ extract_manuscript(book_id, title, pdf)  [batched internally]
  │    ├─ _extract_pages(pdf)                  # PyMuPDF per page (unchanged)
  │    ├─ _page_batches(pages, size=20)        # pure fn
  │    ├─ for each batch: _clean_batch(...)    # LLM call => str (cleaned text)
  │    ├─ manuscript_text = "\n\n".join(cleaned_batches)
  │    ├─ _detect_chapters(manuscript_text)    # LLM call => list[str]
  │    └─ _slice_into_chapters(text, titles)   # pure fn => list[Chapter]
  ├─ upload_manuscript(book_id, manuscript)   [new manuscript.json shape]
  ├─ all_chunks = []
  ├─ for each chapter in manuscript.chapters:
  │    └─ all_chunks += chunk_chapter(chapter, starting_index=len(all_chunks))
  └─ upsert_chunks(book_id, all_chunks)       [atomic — unchanged]

on exception:
  set_book_status(book_id, 'error')
  raise
```

`rechunk_book_job` runs the same sequence from the chunk loop onward, reading the persisted manuscript instead of re-extracting.

### Module changes

| File | Change |
|---|---|
| `models.py` | Replace `Manuscript.text: str` with `chapters: list[Chapter]`; add `Chapter` and `_ChapterTitles`; simplify `LLMChunk` |
| `extract.py` | Add `_page_batches`, `_clean_batch` (flat text), `_detect_chapters` (structured), `_slice_into_chapters`; rewire `extract_manuscript` |
| `chunk.py` | Replace `chunk_manuscript` with per-chapter `chunk_chapter`; simplify prompt (chapter detection removed) |
| `storage.py` | No change — `upsert_chunks` stays atomic |
| `book_processor_jobs.py` | Loop over `manuscript.chapters`, collect chunks, call `upsert_chunks` once at end |
| `_gemini.py` | No change |

## Stage 1 — extract

### Batching

`_page_batches(pages, size=20)` groups the PyMuPDF page list into consecutive 20-page windows. Last group may be smaller. No overlap.

At typical trade-book density (~250 words/page) a 20-page batch ≈ 5k input words, producing ≈ 7k output tokens — well within the 65k cap with headroom for OCR expansion. Picture books fit in a single batch.

### `_clean_batch(pages) -> str` — one LLM call per batch

Plain-text output via `generate_text`. Same cleaning job as the original single-call version, just scoped to a page range.

**Prompt shape:**

```
You are cleaning a page range from a children's book PDF. This may be the entire
book or only part of it.

Instructions:
- Concatenate all pages into one continuous story text.
- Strip front matter: title page, copyright, ISBN, dedication, publisher info.
- Strip back matter: glossary, author bio, discussion guide, FAQs, marketing.
- Fix OCR/extraction artifacts: broken words, stray mid-sentence capitals, garbled text.
- Preserve the story text VERBATIM — do not paraphrase, summarize, or rewrite.
- Output ONLY the cleaned story text, nothing else. No commentary, no labels.
```

The prompt does not branch on "first / middle / last batch." The cleaning rules fire only when the relevant content is actually in the input, so they are safe to include in every batch. Pages are passed with the existing `[[PAGE N]]` text / image-part shape used today.

### `_detect_chapters(manuscript_text) -> list[str]` — one LLM call per book

Runs once on the concatenated cleaned manuscript, after all extract batches finish. Structured output via `generate_structured` with response type `_ChapterTitles`.

**Prompt shape:**

```
You are analyzing the cleaned text of a children's book to find chapter headings.

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
```

The manuscript passes through a single Gemini call. Even HP-scale books (~110k input tokens) fit comfortably in Gemini's 1M input context. Output is tiny (~40 strings of ~5 words each).

### `_slice_into_chapters(text, titles) -> list[Chapter]` — pure function

```python
def _slice_into_chapters(text: str, titles: list[str]) -> list[Chapter]:
    if not titles:
        return [Chapter(title=None, text=text.strip())]

    # Locate each title monotonically (skip hallucinated titles not found in text)
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
    # Opening untitled chapter (anything before the first heading)
    first_title, first_idx = found[0]
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

**Edge cases handled:**
- Zero titles detected → single untitled chapter (picture book / chapterless trade book).
- Hallucinated title not present in text → logged, skipped, no chapter emitted.
- Opening prose before the first heading (preface / prologue text) → becomes an untitled opening chapter.
- Duplicate titles in the source → the monotonic cursor ensures each is matched to a distinct occurrence.

### `extract_manuscript` — new body

```python
def extract_manuscript(book_id, title, pdf_bytes) -> Manuscript:
    pages = _extract_pages(pdf_bytes)
    batches = list(_page_batches(pages, size=20))
    cleaned_batches = [_clean_batch(b) for b in batches]
    manuscript_text = "\n\n".join(cleaned_batches)
    chapter_titles = _detect_chapters(manuscript_text)
    chapters = _slice_into_chapters(manuscript_text, chapter_titles)
    return Manuscript(
        book_id=book_id,
        title=title,
        chapters=chapters,
        extraction_model=LLM_MODEL,
        pages_total=len(pages),
        image_pages=sum(1 for p in pages if p.image_bytes),
    )
```

## Stage 2 — chunk

### Per-chapter chunking

```python
def chunk_chapter(chapter: Chapter, starting_index: int) -> list[Chunk]:
    chunks: list[Chunk] = []
    idx = starting_index

    if chapter.title:
        chunks.append(Chunk(
            chunk_index=idx,
            chunk_kind="chapter_title",
            chapter_title=chapter.title,
            chunk_hint=f"Start of chapter: {chapter.title}",
            text=chapter.title,
        ))
        idx += 1

    body = _gemini_chunk(chapter.text)
    for c in body:
        chunks.append(Chunk(
            chunk_index=idx,
            chunk_kind="content",
            chapter_title=chapter.title or "",
            chunk_hint=c.chunk_hint,
            text=c.text,
        ))
        idx += 1

    return chunks
```

Untitled chapters (picture books) emit only content chunks — no `chunk_kind="chapter_title"` chunk. This matches today's behavior for chapterless books.

### Revised `_gemini_chunk` prompt

```
You are chunking one chapter of a children's book for text-to-speech narration.

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
```

Structured output type becomes:

```python
class _LLMChunkResponse(BaseModel):
    chunks: list[LLMChunk]   # where LLMChunk is now just { chunk_hint, text }
```

### Orchestration

```python
def process_book_job(book_id: str) -> None:
    logger.info("Starting book processing | book_id={}", book_id)
    try:
        pdf_bytes, title = download_pdf(book_id)
        manuscript = extract_manuscript(book_id, title, pdf_bytes)
        upload_manuscript(book_id, manuscript)

        all_chunks: list[Chunk] = []
        for chapter in manuscript.chapters:
            all_chunks.extend(chunk_chapter(chapter, starting_index=len(all_chunks)))
        upsert_chunks(book_id, all_chunks)

        logger.info("Book processing complete | book_id={}", book_id)
    except Exception:
        logger.exception("Book processing failed | book_id={}", book_id)
        set_book_status(book_id, "error")
        raise
```

`rechunk_book_job` follows the identical shape starting from the chunk loop, reading the manuscript from storage instead of extracting it.

## Storage helpers

No changes to `storage.py`. `upsert_chunks(book_id, chunks)` is called once per run with the full chunk list, same as today (`server/workers/pdf_pipeline/storage.py:66-98`): delete existing chunks → insert all → update status to `ready` → reset reading_progress. `manuscript.json` upload path convention also unchanged.

## Error handling

No new error-handling strategy. Existing behavior preserved exactly:

- Gemini 429s → `tenacity` retries up to 6× with exponential backoff (`_gemini.py:47-53`).
- Any uncaught exception → `books.status='error'`, re-raise, Modal handles function-level retry per its config.
- Corrupt PDF, malformed LLM JSON, DB error → fall through the same path.

Because `upsert_chunks` remains the single, atomic DB touch point, a failure before that call leaves `book_chunks` untouched for the book. No partial-state cleanup needed.

### Idempotency

Safe to re-run. `upsert_chunks` deletes existing chunks before inserting the new set, so a retry produces the same end state as a clean run.

## Testing

### Unit tests

Extend existing mocked-LLM pattern in `server/tests/services/`.

| Test | Verifies |
|---|---|
| `_page_batches` | correct sizing, last batch smaller, empty input |
| `_clean_batch` (mocked LLM) | returns flat string; pages formatted with `[[PAGE N]]` / image parts as today |
| `_detect_chapters` (mocked LLM) | structured response parses into `_ChapterTitles`; empty response ⇒ `[]` |
| `_slice_into_chapters` | zero titles ⇒ one untitled chapter; titles found ⇒ correct slices; hallucinated title (not in text) ⇒ skipped with warning; opening prelude before first heading ⇒ untitled opening chapter; duplicate title strings ⇒ monotonic matching to distinct occurrences |
| `chunk_chapter` (mocked LLM) | chapter_title chunk emitted iff `title` present; indices monotonic from `starting_index` |
| `chunk_chapter` (mocked LLM) | untitled chapter emits only content chunks |
| `process_book_job` happy path (mocked stages) | chunks from all chapters collected in order; `upsert_chunks` called once with monotonic indices |
| `process_book_job` exception path (mocked stages) | `set_book_status('error')` called; `upsert_chunks` not called |

### Real-book fixtures (run once, not in CI)

| Book | Properties | What it covers |
|---|---|---|
| *Peter Rabbit* (public domain, ~2k words) | short, no chapters, illustrations → image fallback | single-batch extract, single untitled chapter, no title chunk |
| HP1 chapters 1–3 (~15k words) | multi-chapter, multi-batch extract, clear headings | multi-batch extract + concat, chapter-detection call, per-chapter chunking with title chunks |

Manual spot-check:
- Chapter titles in DB match source verbatim.
- `chunk_kind="chapter_title"` chunks appear at chapter boundaries.
- Sampled content chunk text appears verbatim in the source PDF.

Re-run only if prompts change materially.

## Rollout

No users → no feature flag, no staged rollout.

1. Merge to feature branch, run unit tests.
2. Deploy to dev Modal.
3. Run both fixture books through dev, spot-check results.
4. Exercise upload flow via the UI with a third PDF (a public-domain seed book from P0.2 is a natural candidate).
5. Merge to main → dev.
6. Promote to prod on next release.

## What gets removed

- `Manuscript.text: str` — replaced by `chapters: list[Chapter]`.
- `LLMChunk.chunk_kind` and `LLMChunk.chapter_title` — moved to caller.
- Chapter-detection clause in the chunker prompt — chapter detection lives in its own dedicated pass, chunking only splits chapter bodies into narrative beats.

## Out of scope

- Concurrency / parallel batches (sequential only).
- Checkpointing for partial-batch retry (whole-job retry only).
- Progressive-read UX and any supporting DB-write changes.
- Chapter-aware reading-progress remap on rechunk (still resets to 0).
- Word-window fallback for a hypothetical no-chapter huge book (errors loudly; add only if encountered).
- Observability beyond loguru (P0.4 handles session-level metrics).
- Upload-time page-count/size cap (UI-side, independent of this work).

## Open questions

None at spec time. Target book size, model choice, batch granularity, retry granularity, and test matrix were all resolved during brainstorming.
