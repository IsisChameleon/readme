from loguru import logger

from workers.pdf_pipeline import (
    chunk_manuscript,
    download_manuscript,
    download_pdf,
    extract_manuscript,
    set_book_status,
    upload_manuscript,
    upsert_chunks,
)


def process_book_job(book_id: str) -> None:
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


def rechunk_book_job(book_id: str) -> None:
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
