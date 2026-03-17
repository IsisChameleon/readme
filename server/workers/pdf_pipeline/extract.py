"""Step 1: Extract clean manuscript text from a PDF."""

from __future__ import annotations

import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from google.genai import types
from loguru import logger

from ._gemini import LLM_MODEL, generate_text
from .models import Manuscript, PageContent

MIN_TEXT_WORDS = 25


def _gemini_generate(prompt: str | list[types.Part | str]) -> str:
    """Thin wrapper over shared generate_text (allows easy mocking in tests)."""
    return generate_text(prompt)


def _extract_pages(pdf_bytes: bytes) -> list[PageContent]:
    """Extract text from each PDF page, with PNG fallback for sparse pages."""
    pages: list[PageContent] = []
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = Path(tmp.name)

    try:
        with fitz.open(str(tmp_path)) as doc:
            for idx, page in enumerate(doc):
                text = (page.get_text() or "").strip()
                image_bytes = None
                if len(text.split()) < MIN_TEXT_WORDS:
                    pixmap = page.get_pixmap(dpi=200, alpha=False)
                    image_bytes = pixmap.tobytes("png")
                pages.append(PageContent(page_number=idx + 1, text=text, image_bytes=image_bytes))
    finally:
        tmp_path.unlink(missing_ok=True)

    return pages


def _clean_text_with_llm(pages: list[PageContent]) -> str:
    """Send all page texts (and images) to Gemini for cleaning and concatenation."""
    parts: list[types.Part | str] = []

    parts.append(
        """You are cleaning extracted text from a children's book PDF.

Instructions:
- Concatenate all pages into one continuous story text.
- Strip front matter: title page, copyright, ISBN, dedication, publisher info.
- Strip back matter: glossary, author bio, discussion guide, FAQs, marketing, ads.
- Fix OCR/extraction artifacts: broken words, stray mid-sentence capitals, garbled text.
- Preserve the story text VERBATIM — do not paraphrase, summarize, or rewrite.
- Output ONLY the cleaned story text, nothing else. No commentary, no labels."""
    )

    for page in pages:
        if page.image_bytes:
            parts.append(f"\n[[PAGE {page.page_number} — image]]")
            parts.append(types.Part.from_bytes(data=page.image_bytes, mime_type="image/png"))
            if page.text.strip():
                parts.append(f"(extracted text hint: {page.text.strip()[:500]})")
        else:
            parts.append(f"\n[[PAGE {page.page_number}]]\n{page.text}")

    return _gemini_generate(parts)


def extract_manuscript(book_id: str, title: str, pdf_bytes: bytes) -> Manuscript:
    """Extract and clean a PDF into a Manuscript."""
    logger.info("Extracting pages | book_id={}", book_id)
    pages = _extract_pages(pdf_bytes)
    image_pages = sum(1 for p in pages if p.image_bytes)
    logger.info(
        "Extracted {} pages ({} image, {} text) | book_id={}",
        len(pages),
        image_pages,
        len(pages) - image_pages,
        book_id,
    )

    logger.info("Cleaning text with LLM | book_id={}", book_id)
    cleaned_text = _clean_text_with_llm(pages)

    return Manuscript(
        book_id=book_id,
        title=title,
        text=cleaned_text,
        extraction_model=LLM_MODEL,
        pages_total=len(pages),
        image_pages=image_pages,
    )
