"""Custom frame types for the book reading state machine."""

from dataclasses import dataclass

from pipecat.frames.frames import DataFrame


@dataclass
class StartReadingFrame(DataFrame):
    book_id: str = ""
    chunk_index: int | None = None


@dataclass
class EndSessionFrame(DataFrame):
    reason: str = "user_goodbye"


@dataclass
class BookSelectedFrame(DataFrame):
    book_id: str = ""
    book_title: str = ""
