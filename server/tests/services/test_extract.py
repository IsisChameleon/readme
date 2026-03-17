"""Unit tests for pdf_pipeline extraction."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from workers.pdf_pipeline.extract import (
    _clean_text_with_llm,
    _extract_pages,
    extract_manuscript,
)
from workers.pdf_pipeline.models import Manuscript, PageContent


class TestExtractPages:
    @patch("workers.pdf_pipeline.extract.fitz")
    def test_text_page_no_image(self, mock_fitz):
        """Page with >= 25 words should not get image_bytes."""
        doc = MagicMock()
        page = MagicMock()
        page.get_text.return_value = " ".join(["word"] * 30)
        doc.__iter__ = MagicMock(return_value=iter([page]))
        doc.__len__ = MagicMock(return_value=1)
        mock_fitz.open.return_value.__enter__ = MagicMock(return_value=doc)
        mock_fitz.open.return_value.__exit__ = MagicMock(return_value=False)

        pages = _extract_pages(b"%PDF-fake")
        assert len(pages) == 1
        assert pages[0].image_bytes is None
        assert "word" in pages[0].text

    @patch("workers.pdf_pipeline.extract.fitz")
    def test_sparse_page_gets_image(self, mock_fitz):
        """Page with < 25 words should get image_bytes from render."""
        doc = MagicMock()
        page = MagicMock()
        page.get_text.return_value = "short text"
        pixmap = MagicMock()
        pixmap.tobytes.return_value = b"\x89PNG-fake"
        page.get_pixmap.return_value = pixmap
        doc.__iter__ = MagicMock(return_value=iter([page]))
        doc.__len__ = MagicMock(return_value=1)
        mock_fitz.open.return_value.__enter__ = MagicMock(return_value=doc)
        mock_fitz.open.return_value.__exit__ = MagicMock(return_value=False)

        pages = _extract_pages(b"%PDF-fake")
        assert len(pages) == 1
        assert pages[0].image_bytes == b"\x89PNG-fake"


class TestCleanTextWithLLM:
    @patch("workers.pdf_pipeline.extract._gemini_generate")
    def test_returns_cleaned_text(self, mock_gemini):
        mock_gemini.return_value = "Once upon a time there was a story."
        pages = [
            PageContent(page_number=1, text="Copyright 2024.\nOnce upon a time"),
            PageContent(page_number=2, text="there was a story.\nAbout the author..."),
        ]
        result = _clean_text_with_llm(pages)
        assert result == "Once upon a time there was a story."
        mock_gemini.assert_called_once()


class TestExtractManuscript:
    @patch("workers.pdf_pipeline.extract._clean_text_with_llm")
    @patch("workers.pdf_pipeline.extract._extract_pages")
    def test_returns_manuscript(self, mock_pages, mock_clean):
        mock_pages.return_value = [
            PageContent(page_number=1, text="Hello world " * 20),
            PageContent(page_number=2, text="short", image_bytes=b"\x89PNG"),
        ]
        mock_clean.return_value = "Hello world. The end."

        result = extract_manuscript("book_001", "Test Book", b"%PDF-fake")

        assert isinstance(result, Manuscript)
        assert result.book_id == "book_001"
        assert result.title == "Test Book"
        assert result.text == "Hello world. The end."
        assert result.pages_total == 2
        assert result.image_pages == 1
