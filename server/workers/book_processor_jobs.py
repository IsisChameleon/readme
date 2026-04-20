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
