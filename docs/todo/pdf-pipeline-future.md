# PDF Pipeline — Future TODOs

## Cheaper vision model for OCR fallback
- Currently using Gemini vision for pages with sparse text (< 25 words)
- Investigate cheaper alternatives (e.g. cloud vision APIs, open-source OCR models)
- Gemini vision may be overkill for straightforward text extraction from image-heavy pages

## Cleaning pass for large books
- Current design sends all pages to Gemini in a single cleaning call
- For large books (~100k words, e.g. Harry Potter), this may exceed context window
- Need a batched cleaning strategy that still produces one continuous manuscript
- Options: overlapping page windows with deduplication, or chapter-aware splitting

## Chapter-aware reading progress remapping on rechunk
- When rechunking a book, reading_progress.current_chunk_index may point to wrong content
- Currently: reset to 0 on rechunk
- Better: look up the chapter_title of the old chunk, find the first new chunk in that chapter
- Falls back to 0 if chapter not found or book has no real chapters
