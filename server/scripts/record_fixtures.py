"""One-off script to record Gemini LLM outputs as test fixtures.

Usage:
    cd server
    uv run python scripts/record_fixtures.py \\
        --pdf /path/to/alice.pdf \\
        --title "Alice in Wonderland" \\
        --out tests/fixtures/alice

Requires GOOGLE_API_KEY in the environment. Overwrites fixture files in place.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from loguru import logger

from workers.pdf_pipeline.chunk import _gemini_chunk, chunk_chapter
from workers.pdf_pipeline.extract import (
    _clean_batch,
    _detect_chapters,
    _extract_pages,
    _page_batches,
    _slice_into_chapters,
)
from workers.pdf_pipeline.models import Manuscript


def _write_cleaned_batches(out_dir: Path, batches: list[str]) -> None:
    for idx, text in enumerate(batches, start=1):
        (out_dir / f"clean_batch_{idx:02d}.txt").write_text(text)


def _write_detected_chapters(out_dir: Path, titles: list[str]) -> None:
    (out_dir / "detected_chapters.json").write_text(json.dumps(titles, indent=2))


def _write_per_chapter_chunks(out_dir: Path, per_chapter: list[list[dict]]) -> None:
    for idx, chunks in enumerate(per_chapter):
        (out_dir / f"chunks_chapter_{idx:02d}.json").write_text(json.dumps(chunks, indent=2))


def _write_manuscript(out_dir: Path, manuscript: Manuscript) -> None:
    (out_dir / "manuscript.json").write_text(manuscript.model_dump_json(indent=2))


def _write_expected_chunks(out_dir: Path, chunks: list[dict]) -> None:
    (out_dir / "expected_chunks.json").write_text(json.dumps(chunks, indent=2))


def record(pdf_path: Path, title: str, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    # Copy the PDF into the fixture directory so the replay test can load it
    copied_pdf = out_dir / pdf_path.name
    shutil.copy2(pdf_path, copied_pdf)
    logger.info("Copied PDF | src={} dst={}", pdf_path, copied_pdf)

    pdf_bytes = pdf_path.read_bytes()

    # 1. Extract pages + batch + clean (paid, one call per batch)
    logger.info("Extracting pages from PDF")
    pages = _extract_pages(pdf_bytes)
    logger.info("Extracted {} pages", len(pages))

    batches = _page_batches(pages, size=20)
    logger.info("Cleaning {} batches with Gemini (paid)", len(batches))
    cleaned_batches = [_clean_batch(batch) for batch in batches]
    _write_cleaned_batches(out_dir, cleaned_batches)
    logger.info("Wrote {} cleaned-batch fixtures", len(cleaned_batches))

    # 2. Detect chapters (paid, one call)
    manuscript_text = "\n\n".join(cleaned_batches)
    logger.info("Detecting chapters with Gemini (paid)")
    chapter_titles = _detect_chapters(manuscript_text)
    _write_detected_chapters(out_dir, chapter_titles)
    logger.info("Wrote {} detected titles", len(chapter_titles))

    # 3. Slice into chapters (free, pure)
    chapters = _slice_into_chapters(manuscript_text, chapter_titles)
    logger.info("Sliced into {} chapters", len(chapters))

    # 4. Chunk each chapter body (paid, one call per chapter)
    logger.info("Chunking {} chapter bodies with Gemini (paid)", len(chapters))
    per_chapter_llm_chunks: list[list[dict]] = []
    for chapter in chapters:
        llm_chunks = _gemini_chunk(chapter.text)
        per_chapter_llm_chunks.append([c.model_dump() for c in llm_chunks])
    _write_per_chapter_chunks(out_dir, per_chapter_llm_chunks)
    logger.info("Wrote {} per-chapter chunk fixtures", len(per_chapter_llm_chunks))

    # 5. Save the full manuscript for reference / reproduction
    manuscript = Manuscript(
        book_id="fixture_book",
        title=title,
        chapters=chapters,
        extraction_model="gemini-2.5-flash",
        pages_total=len(pages),
        image_pages=sum(1 for p in pages if p.image_bytes),
    )
    _write_manuscript(out_dir, manuscript)

    # 6. Produce the final flat chunk list the replay test will assert on.
    #    This uses chunk_chapter (which calls _gemini_chunk internally), but we
    #    already recorded every _gemini_chunk output — so the cheapest way is to
    #    reconstruct the chunk list from what we already have (no new paid calls).
    from workers.pdf_pipeline.models import LLMChunk

    final_chunks: list[dict] = []
    next_index = 0
    for chapter, llm_chunk_dicts in zip(chapters, per_chapter_llm_chunks, strict=True):
        # Replay _gemini_chunk with the recorded output for this chapter
        llm_chunks = [LLMChunk(**c) for c in llm_chunk_dicts]
        from unittest.mock import patch as _patch

        with _patch("workers.pdf_pipeline.chunk._gemini_chunk", return_value=llm_chunks):
            chunks = chunk_chapter(chapter, starting_index=next_index)
        next_index += len(chunks)
        final_chunks.extend(c.model_dump() for c in chunks)
    _write_expected_chunks(out_dir, final_chunks)
    logger.info("Wrote {} expected chunks", len(final_chunks))

    logger.info("Done | out_dir={}", out_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", type=Path, required=True, help="Source PDF path")
    parser.add_argument("--title", type=str, required=True, help="Book title")
    parser.add_argument("--out", type=Path, required=True, help="Fixture output directory")
    args = parser.parse_args()
    record(args.pdf, args.title, args.out)


if __name__ == "__main__":
    main()
