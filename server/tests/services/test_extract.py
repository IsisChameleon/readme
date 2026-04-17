"""Unit tests for pdf_pipeline extraction."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from workers.pdf_pipeline.extract import (
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


class TestCleanBatch:
    @patch("workers.pdf_pipeline.extract._gemini_generate")
    def test_returns_cleaned_text(self, mock_gemini):
        from workers.pdf_pipeline.extract import _clean_batch

        mock_gemini.return_value = "Once upon a time there was a story."
        pages = [
            PageContent(page_number=1, text="Copyright 2024.\nOnce upon a time"),
            PageContent(page_number=2, text="there was a story.\nAbout the author..."),
        ]
        result = _clean_batch(pages)
        assert result == "Once upon a time there was a story."
        mock_gemini.assert_called_once()

    @patch("workers.pdf_pipeline.extract._gemini_generate")
    def test_image_page_includes_image_part(self, mock_gemini):
        from workers.pdf_pipeline.extract import _clean_batch

        mock_gemini.return_value = "ok"
        pages = [PageContent(page_number=1, text="short", image_bytes=b"\x89PNG")]
        _clean_batch(pages)
        # The parts list passed to the LLM should be non-trivial (prompt + marker + image)
        called_parts = mock_gemini.call_args.args[0]
        assert any("[[PAGE 1 — image]]" in p for p in called_parts if isinstance(p, str))


class TestExtractManuscript:
    @patch("workers.pdf_pipeline.extract._detect_chapters")
    @patch("workers.pdf_pipeline.extract._clean_batch")
    @patch("workers.pdf_pipeline.extract._extract_pages")
    def test_titled_chapters_end_to_end(self, mock_pages, mock_clean, mock_detect):
        mock_pages.return_value = [
            PageContent(page_number=1, text="Hello world " * 20),
            PageContent(page_number=2, text="short", image_bytes=b"\x89PNG"),
        ]
        mock_clean.return_value = "Chapter 1\nBody one.\n\nChapter 2\nBody two."
        mock_detect.return_value = ["Chapter 1", "Chapter 2"]

        result = extract_manuscript("book_001", "Test Book", b"%PDF-fake")

        assert isinstance(result, Manuscript)
        assert result.book_id == "book_001"
        assert result.title == "Test Book"
        assert result.pages_total == 2
        assert result.image_pages == 1
        assert [c.title for c in result.chapters] == ["Chapter 1", "Chapter 2"]
        assert result.chapters[0].text == "Body one."
        assert result.chapters[1].text == "Body two."

    @patch("workers.pdf_pipeline.extract._detect_chapters")
    @patch("workers.pdf_pipeline.extract._clean_batch")
    @patch("workers.pdf_pipeline.extract._extract_pages")
    def test_no_chapters_produces_single_untitled(self, mock_pages, mock_clean, mock_detect):
        mock_pages.return_value = [PageContent(page_number=1, text="Body " * 40)]
        mock_clean.return_value = "Once upon a time there was a rabbit."
        mock_detect.return_value = []

        result = extract_manuscript("book_002", "Picture Book", b"%PDF-fake")

        assert len(result.chapters) == 1
        assert result.chapters[0].title is None
        assert result.chapters[0].text == "Once upon a time there was a rabbit."

    @patch("workers.pdf_pipeline.extract._detect_chapters")
    @patch("workers.pdf_pipeline.extract._clean_batch")
    @patch("workers.pdf_pipeline.extract._extract_pages")
    def test_multiple_batches_are_joined(self, mock_pages, mock_clean, mock_detect):
        # 25 pages -> two batches with size=20 (20 + 5)
        mock_pages.return_value = [
            PageContent(page_number=i + 1, text=f"page {i}") for i in range(25)
        ]
        mock_clean.side_effect = [
            "Chapter 1\nFirst batch body.",
            "Chapter 2\nSecond batch body.",
        ]
        mock_detect.return_value = ["Chapter 1", "Chapter 2"]

        result = extract_manuscript("book_003", "Two Batch Book", b"%PDF-fake")

        assert mock_clean.call_count == 2
        # Cleaned text from both batches is joined with "\n\n"
        joined_text_passed_to_detect = mock_detect.call_args.args[0]
        assert (
            joined_text_passed_to_detect
            == "Chapter 1\nFirst batch body.\n\nChapter 2\nSecond batch body."
        )
        assert [c.title for c in result.chapters] == ["Chapter 1", "Chapter 2"]
        assert result.chapters[0].text == "First batch body."
        assert result.chapters[1].text == "Second batch body."


from workers.pdf_pipeline.extract import _page_batches  # noqa: E402


class TestPageBatches:
    def _pages(self, n: int) -> list[PageContent]:
        return [PageContent(page_number=i + 1, text=f"p{i}") for i in range(n)]

    def test_single_batch_when_smaller_than_size(self):
        batches = list(_page_batches(self._pages(5), size=20))
        assert len(batches) == 1
        assert len(batches[0]) == 5

    def test_exact_multiple(self):
        batches = list(_page_batches(self._pages(40), size=20))
        assert [len(b) for b in batches] == [20, 20]

    def test_last_batch_smaller(self):
        batches = list(_page_batches(self._pages(45), size=20))
        assert [len(b) for b in batches] == [20, 20, 5]

    def test_empty_input(self):
        batches = list(_page_batches([], size=20))
        assert batches == []

    def test_preserves_order_and_content(self):
        pages = self._pages(25)
        flat = [p for batch in _page_batches(pages, size=10) for p in batch]
        assert flat == pages


from workers.pdf_pipeline.extract import _slice_into_chapters  # noqa: E402
from workers.pdf_pipeline.models import Chapter  # noqa: E402


class TestSliceIntoChapters:
    def test_no_titles_returns_single_untitled_chapter(self):
        text = "Once upon a time there was a rabbit."
        chapters = _slice_into_chapters(text, [])
        assert chapters == [Chapter(title=None, text="Once upon a time there was a rabbit.")]

    def test_no_titles_strips_whitespace(self):
        chapters = _slice_into_chapters("   body text  \n", [])
        assert chapters[0].text == "body text"

    def test_titles_found_slice_correctly(self):
        text = "Chapter 1\nBody one here.\n\nChapter 2\nBody two here."
        chapters = _slice_into_chapters(text, ["Chapter 1", "Chapter 2"])
        assert len(chapters) == 2
        assert chapters[0].title == "Chapter 1"
        assert chapters[0].text == "Body one here."
        assert chapters[1].title == "Chapter 2"
        assert chapters[1].text == "Body two here."

    def test_opening_prelude_becomes_untitled_chapter(self):
        text = "Preface words before anything.\n\nChapter 1\nBody here."
        chapters = _slice_into_chapters(text, ["Chapter 1"])
        assert len(chapters) == 2
        assert chapters[0].title is None
        assert chapters[0].text == "Preface words before anything."
        assert chapters[1].title == "Chapter 1"
        assert chapters[1].text == "Body here."

    def test_hallucinated_title_is_skipped(self):
        text = "Chapter 1\nBody one.\n\nChapter 2\nBody two."
        chapters = _slice_into_chapters(text, ["Chapter 1", "Chapter XYZ Not In Text", "Chapter 2"])
        assert [c.title for c in chapters] == ["Chapter 1", "Chapter 2"]

    def test_all_titles_hallucinated_falls_back_to_single_untitled(self):
        text = "Just some body text with no real chapter headings."
        chapters = _slice_into_chapters(text, ["Chapter 99"])
        assert chapters == [Chapter(title=None, text=text)]

    def test_empty_string_title_is_skipped(self):
        text = "Chapter 1\nBody here."
        chapters = _slice_into_chapters(text, ["", "Chapter 1"])
        assert len(chapters) == 1
        assert chapters[0].title == "Chapter 1"
        assert chapters[0].text == "Body here."

    def test_duplicate_title_strings_match_monotonically(self):
        text = "Chapter 1\nFirst body.\n\nChapter 1\nSecond body."
        chapters = _slice_into_chapters(text, ["Chapter 1", "Chapter 1"])
        assert len(chapters) == 2
        assert chapters[0].text == "First body."
        assert chapters[1].text == "Second body."

    def test_title_substring_in_body_is_skipped(self):
        # The word "Magic" appears mid-paragraph before the actual chapter heading.
        text = "She felt the Magic in the air.\n\nMagic\nThe real chapter starts here."
        chapters = _slice_into_chapters(text, ["Magic"])
        assert len(chapters) == 2
        assert chapters[0].title is None
        assert "She felt the Magic in the air." in chapters[0].text
        assert chapters[1].title == "Magic"
        assert chapters[1].text == "The real chapter starts here."


class TestDetectChapters:
    @patch("workers.pdf_pipeline.extract.generate_structured")
    def test_returns_title_list(self, mock_structured):
        from workers.pdf_pipeline.extract import _detect_chapters
        from workers.pdf_pipeline.models import _ChapterTitles

        mock_structured.return_value = _ChapterTitles(
            titles=["The Boy Who Lived", "The Vanishing Glass"]
        )
        titles = _detect_chapters("...manuscript text...")
        assert titles == ["The Boy Who Lived", "The Vanishing Glass"]

    @patch("workers.pdf_pipeline.extract.generate_structured")
    def test_no_chapters_returns_empty_list(self, mock_structured):
        from workers.pdf_pipeline.extract import _detect_chapters
        from workers.pdf_pipeline.models import _ChapterTitles

        mock_structured.return_value = _ChapterTitles(titles=[])
        assert _detect_chapters("Picture book with no chapters.") == []

    @patch("workers.pdf_pipeline.extract.generate_structured")
    def test_passes_manuscript_text_as_prompt(self, mock_structured):
        from workers.pdf_pipeline.extract import _detect_chapters
        from workers.pdf_pipeline.models import _ChapterTitles

        mock_structured.return_value = _ChapterTitles(titles=[])
        manuscript = "Chapter 1\nOnce upon a time..."
        _detect_chapters(manuscript)

        called_prompt = mock_structured.call_args.args[0]
        assert manuscript in called_prompt
