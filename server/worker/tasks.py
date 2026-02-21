import dramatiq
from dramatiq.brokers.redis import RedisBroker
from loguru import logger

try:
    from shared.config import DRAMATIQ_BROKER_URL
except ImportError:
    from server.shared.config import DRAMATIQ_BROKER_URL  # type: ignore

dramatiq.set_broker(RedisBroker(url=DRAMATIQ_BROKER_URL))


def _process_book_impl(book_id: str) -> None:
    logger.info("processing your book | book_id={}", book_id)


@dramatiq.actor
def process_book(book_id: str) -> None:
    _process_book_impl(book_id)


def enqueue_process_book(book_id: str) -> bool:
    try:
        process_book.send(book_id)
        return True
    except Exception:
        logger.exception("Failed to enqueue book processing | book_id={}", book_id)
        return False
