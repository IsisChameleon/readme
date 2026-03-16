# Split PDF Extraction from Chunking: 2-Step Pipeline

## Problem

The current `process_pdf_from_supabase.py` script ties chunking to extraction — chunk
boundaries are determined by the page-batch window (3 pages at a time), not by narrative
meaning. This produces tiny, fragmented chunks (avg 33 words) that don't map to scenes or
ideas. Non-story content (copyright, marketing, glossary, author bio) also leaks through
because there is no dedicated cleaning step.

## Solution: Two Separate Scripts

### Step 1 — `extract_pdf.py` → `manuscript.json`

Extract the full story text from the PDF into a single clean document.

**Process:**
1. Extract each page — native text first, Gemini vision fallback when text is sparse (<25 words, e.g. image-heavy children's books)
2. Send all pages to Gemini with instructions to:
   - Concatenate into one continuous text
   - Strip front matter (title page, copyright, ISBN, dedication, publisher info)
   - Strip back matter (glossary, author bio, discussion guide, FAQs, marketing)
   - Fix OCR/extraction artifacts (stray mid-sentence capitals, broken words)
   - Preserve story text verbatim — no paraphrasing

**Output `manuscript.json`:**
```json
{
  "book_id": "beauty_and_the_beast_001",
  "title": "Beauty and the Beast",
  "source": { "type": "local_file", "path": "..." },
  "extraction": {
    "model": "gemini-2.5-flash",
    "pages_total": 12,
    "image_pages": 8
  },
  "text": "The father lost their home in a gamble..."
}
```

One field. One string. The whole story — nothing else.

---

### Step 2 — `chunk_text.py` → `chunks.json`

Split the manuscript into meaningful, TTS-ready chunks with a `chunk_hint` per chunk.

**Process:**
1. Read `manuscript.json`
2. Send full `text` to Gemini with instructions to:
   - Chunk by narrative beat (~150–250 words, LLM decides boundaries)
   - Never cut mid-sentence or mid-dialogue — group dialogue with its surrounding action
   - Ignore any non-story content that slipped through extraction (safety net)
   - For each chunk, generate a `chunk_hint`: one sentence describing what happens

**Output `chunks.json`:**
```json
{
  "book_id": "beauty_and_the_beast_001",
  "title": "Beauty and the Beast",
  "chunks": [
    {
      "chunk_id": "chunk_00000",
      "chunk_kind": "content",
      "chapter_title": "...",
      "chunk_hint": "The family loses their home; Beauty's patient, dutiful character is established.",
      "text": "The father lost their home in a gamble..."
    }
  ]
}
```

`chunk_hint` is a human-readable one-sentence summary useful for:
- Bot navigation ("skip to when Beauty arrives at the castle")
- Semantic search / retrieval (embeds well as natural language)
- Debugging

---

## What Gets Dropped

- `carryover_batches` in the output JSON — no longer relevant, chunking is not page-driven
- Page-boundary logic inside the chunker — step 2 never sees pages
- `pillow` and `pytesseract` dependencies — already removed in favour of Gemini vision

## Scalability

For large books (e.g. Harry Potter, ~100k words):
- Step 1 still batches page extraction internally but always produces one `manuscript.json`
- Step 2 may need to send the manuscript in overlapping sections if it exceeds the model's
  context window — chunker handles deduplication, the external interface stays the same

## Also: Add `chunk_hint` to Supabase

Add `chunk_hint text` column to `book_chunks` table and populate it from the chunks JSON
in `load_chunks_to_supabase.py`.
