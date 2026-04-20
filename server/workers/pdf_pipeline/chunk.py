"""Step 2: Split a Chapter's body into semantic, TTS-ready chunks."""

from __future__ import annotations

from loguru import logger
from pydantic import BaseModel

from ._gemini import generate_structured
from .models import Chapter, Chunk, LLMChunk


class _LLMChunkResponse(BaseModel):
    chunks: list[LLMChunk]


def _gemini_chunk(text: str) -> list[LLMChunk]:
    """Send one chapter's body text to Gemini; return content chunks only."""
    if not text.strip():
        return []

    prompt = f"""You are chunking one chapter of a children's book for text-to-speech narration.

The chapter heading itself is NOT in the text you're given — do not emit a
chapter_title chunk. Emit only content chunks.

Instructions:
- Split the text into chunks by narrative beat, roughly 150-250 words each.
- Never cut mid-sentence or mid-dialogue.
- Group dialogue with its surrounding action/narration.
- For each chunk, generate a chunk_hint: one sentence describing what happens.
- Strip any non-story content (copyright, marketing, ads) that may have slipped
  through extraction.
- Preserve the story text VERBATIM — do not paraphrase.

Text to chunk:

{text}"""

    result = generate_structured(prompt, _LLMChunkResponse)
    return result.chunks


def chunk_chapter(chapter: Chapter, starting_index: int) -> list[Chunk]:
    """Produce the final Chunk list for one chapter, including a chapter_title
    chunk if the chapter is titled."""
    chunks: list[Chunk] = []
    idx = starting_index

    if chapter.title:
        chunks.append(
            Chunk(
                chunk_index=idx,
                chunk_kind="chapter_title",
                chapter_title=chapter.title,
                chunk_hint=f"Start of chapter: {chapter.title}",
                text=chapter.title,
            )
        )
        idx += 1

    body = _gemini_chunk(chapter.text)
    logger.info(
        "Chunked chapter | title={} body_chunks={}", chapter.title or "(untitled)", len(body)
    )
    for c in body:
        chunks.append(
            Chunk(
                chunk_index=idx,
                chunk_kind="content",
                chapter_title=chapter.title or "",
                chunk_hint=c.chunk_hint,
                text=c.text,
            )
        )
        idx += 1

    return chunks
