# Test conventions

## Directory structure mirrors source

Test files live at the same relative path as the source file they exercise.

```
server/workers/pdf_pipeline/chunk.py         →  server/tests/workers/pdf_pipeline/test_chunk.py
server/workers/pdf_pipeline/extract.py       →  server/tests/workers/pdf_pipeline/test_extract.py
server/workers/book_processor_jobs.py        →  server/tests/workers/test_book_processor_jobs.py
server/api/routers/books.py                  →  server/tests/api/routers/test_books.py
```

Do not use generic layer names like `tests/services/` or `tests/unit/`. The test path should tell you which source file it covers.

## File naming

- **Unit tests:** `test_<source_filename>.py` — one test file per source file.
- **Replay / end-to-end tests:** `test_<source_filename>_replay.py` or `test_<source_filename>_e2e.py` — names the driving function or file and the method (`replay`, `e2e`).
- Avoid vague names like `test_integration.py`, `test_helpers.py`, `test_misc.py`. A reader should be able to guess what's tested from the filename alone.

## Non-test assets (recordings, sample data)

Put them next to the test that uses them, in a descriptive subfolder:

```
server/tests/workers/recordings/              # recorded LLM outputs for replay tests
server/tests/workers/recordings/alice_in_wonderland/
```

Prefer concrete terms over generic ones:

- "recordings" (not "fixtures") when the content is captured LLM or service output.
- Book names, endpoint names, scenario names (not `case_1`, `sample`, `data`).

If a directory contains reusable test-time input, include a short `README.md` inside it explaining what it is, how it was generated, and when to re-generate.

## Recording-script naming

One-off tools that populate recordings live under `server/scripts/`, named for what they produce:

```
server/scripts/record_llm_outputs.py   # records Gemini outputs for replay tests
server/scripts/export_openapi.py       # exports OpenAPI schema to JSON
```

Not `record_fixtures.py`, `generate_data.py`, etc.

## Test class and method names

- Class: `Test<Subject>` where `<Subject>` is the function or class under test (e.g. `TestChunkChapter`, `TestSliceIntoChapters`).
- Method: `test_<what_happens_when>` — describes a behavior, not an implementation detail.
  - Good: `test_untitled_chapter_emits_only_content_chunks`
  - Bad: `test_1`, `test_chunk`, `test_happy_path` (too generic — happy path of what?)

## Mocking boundaries

Mock at the nearest seam to what you're testing. For the PDF pipeline:

- Unit tests mock the Gemini entry points (`_gemini_chunk`, `_clean_batch`, `_detect_chapters`) and assert on the code's behavior around them.
- Replay tests mock the same entry points but return **recorded real LLM outputs** from `recordings/`. This exercises the full orchestration, page extraction, slicing, and chunk assembly without paid API calls.
- Unit tests in `tests/workers/pdf_pipeline/test_storage.py` mock the Supabase client.

## When to add a new test file

- One new test file per new source file. If you're not sure whether a new source file deserves its own test file yet, keep tests inline in the most closely related existing test file and split later.

## Running

From `server/`:

```bash
uv run pytest                             # everything
uv run pytest tests/workers/              # just worker tests
uv run pytest tests/workers/pdf_pipeline/ # just pdf_pipeline unit tests
uv run pytest tests/workers/test_book_processor_jobs_replay.py -v  # just the replay test
```
