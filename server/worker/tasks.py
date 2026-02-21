from loguru import logger

try:
    import dramatiq
except ImportError:  # pragma: no cover - dependency is added in later step
    dramatiq = None


def _process_book_impl(book_id: str) -> None:
    logger.info("processing your book | book_id={}", book_id)


if dramatiq is not None:

    @dramatiq.actor
    def process_book(book_id: str) -> None:
        _process_book_impl(book_id)

else:

    def process_book(book_id: str) -> None:
        _process_book_impl(book_id)


def enqueue_process_book(book_id: str) -> str:
    send = getattr(process_book, "send", None)
    if callable(send):
        send(book_id)
        return "queued"

    logger.warning("Dramatiq is not configured; skipping enqueue for book_id={}", book_id)
    return "not_queued"
