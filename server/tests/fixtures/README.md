# Test fixtures — pdf_pipeline

These fixtures let `tests/services/test_integration.py` run full-pipeline
tests against real PDFs without paying for Gemini API calls on every run.

## How it works

For each fixture book (e.g. `alice/`):

- A real PDF is checked in at `<fixture>/<book>.pdf`.
- The *recorded output* of every paid LLM call the pipeline makes is also
  checked in:
  - One cleaned-text string per 20-page batch: `clean_batch_01.txt`, `clean_batch_02.txt`, ...
  - The list of chapter titles detected from the concatenated manuscript: `detected_chapters.json`
  - The narrative-beat chunks for each chapter body: `chunks_chapter_00.json`, `chunks_chapter_01.json`, ...
  - The final flat `Chunk` list the pipeline produces: `expected_chunks.json`
  - The full `Manuscript` object for reference: `manuscript.json`

The integration test loads the PDF, mocks the three LLM entry points
(`_clean_batch`, `_detect_chapters`, `_gemini_chunk`) to return the recorded
values, runs the full `process_book_job`, and asserts the chunks handed to
`upsert_chunks` match `expected_chunks.json` exactly.

## What it catches

- Regressions in the pure `_slice_into_chapters` slicer (including the
  Alice-style fallback-match case).
- Regressions in `chunk_chapter` title-chunk emission and index assembly.
- Regressions in `process_book_job` orchestration.
- Regressions in how page extraction feeds into batching and `"\n\n"` joining.

## What it does NOT catch

- LLM-quality regressions: has the prompt stopped detecting chapters
  correctly? Has the model started paraphrasing? You still need a manual
  real-book run when you edit prompts or upgrade models.
- Anything the LLM would do differently in production than in the recording.

## When to re-record

Re-record when you change:

- The `_clean_batch` prompt
- The `_detect_chapters` prompt
- The `_gemini_chunk` prompt
- The Gemini model in `server/workers/pdf_pipeline/_gemini.py`
- The shape of `Manuscript`, `Chapter`, `LLMChunk`, or `Chunk`

Don't re-record when you change:

- Pure Python logic (slicer, page batcher, orchestration)
- Tests
- Storage or DB code
- Anything outside `pdf_pipeline/`

## How to re-record

```bash
cd server

# Alice fixture
uv run python scripts/record_fixtures.py \
    --pdf /path/to/alice.pdf \
    --title "Alice in Wonderland" \
    --out tests/fixtures/alice
```

Requirements:

- `GOOGLE_API_KEY` set in the environment (the script hits real Gemini).
- The PDF at `--pdf` must exist on disk.

The script overwrites fixture files in place. Review the diff before
committing — an unexpected change (e.g. detected chapter count changed)
usually means the prompt or model behavior has drifted.

## Adding a new fixture book

1. Place the PDF somewhere accessible (local path, not in the repo).
2. Create the fixture directory:

   ```bash
   mkdir server/tests/fixtures/<book_slug>
   ```

3. Run the record script with `--out tests/fixtures/<book_slug>`.
4. Add a new test case to `test_integration.py` that loads from that
   directory. Mirror the structure of `test_alice_end_to_end`; the fixture
   loaders in that file (`_load_cleaned_batches`, `_load_detected_chapters`,
   `_load_per_chapter_chunks`, `_load_expected_chunks`) already take the
   directory constant as input — generalize them if adding a second book.
5. Commit the new fixture directory.

## Fixture files reference

| File | Purpose |
|---|---|
| `<book>.pdf` | Source PDF, the only non-JSON/text input |
| `clean_batch_NN.txt` | Recorded output of `_clean_batch` for batch N (1-indexed) |
| `detected_chapters.json` | Recorded output of `_detect_chapters` (list of title strings) |
| `chunks_chapter_NN.json` | Recorded output of `_gemini_chunk` for chapter N (0-indexed) — list of `{chunk_hint, text}` dicts |
| `manuscript.json` | Full `Manuscript` reference — useful for inspecting what `_slice_into_chapters` produced |
| `expected_chunks.json` | Final flat list of `Chunk` dicts the pipeline should produce; the replay test asserts against this |
