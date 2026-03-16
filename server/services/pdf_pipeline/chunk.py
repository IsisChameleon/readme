"""Step 2: Split manuscript text into semantic, TTS-ready chunks."""

from __future__ import annotations

from loguru import logger
from pydantic import BaseModel

from ._gemini import generate_structured
from .models import Chunk, LLMChunk, Manuscript


class _LLMChunkResponse(BaseModel):
    chunks: list[LLMChunk]


def _gemini_chunk(text: str) -> list[LLMChunk]:
    """Send full manuscript text to Gemini for semantic chunking."""
    if not text.strip():
        return []

    prompt = f"""You are chunking a children's book for text-to-speech narration.

Instructions:
- Split the text into chunks by narrative beat, roughly 150-250 words each.
- Never cut mid-sentence or mid-dialogue.
- Group dialogue with its surrounding action/narration.
- If you find chapter headings, emit a separate chunk with chunk_kind="chapter_title".
- For each content chunk, generate a chunk_hint: one sentence describing what happens.
- For chapter_title chunks, the chunk_hint should describe what the chapter is about.
- Strip any non-story content (copyright, marketing) that may have slipped through.
- Preserve the story text VERBATIM — do not paraphrase.

Text to chunk:

{text}"""

    result = generate_structured(prompt, _LLMChunkResponse)
    return result.chunks


def _assign_indices(llm_chunks: list[LLMChunk]) -> list[Chunk]:
    """Convert LLMChunks to Chunks with sequential indices."""
    return [
        Chunk(
            chunk_index=i,
            chunk_kind=c.chunk_kind,
            chapter_title=c.chapter_title,
            chunk_hint=c.chunk_hint,
            text=c.text,
        )
        for i, c in enumerate(llm_chunks)
    ]


def chunk_manuscript(manuscript: Manuscript) -> list[Chunk]:
    """Split a manuscript into semantic, TTS-ready chunks with hints."""
    logger.info("Chunking manuscript | book_id={}", manuscript.book_id)
    llm_chunks = _gemini_chunk(manuscript.text)
    chunks = _assign_indices(llm_chunks)
    logger.info("Produced {} chunks | book_id={}", len(chunks), manuscript.book_id)
    return chunks
