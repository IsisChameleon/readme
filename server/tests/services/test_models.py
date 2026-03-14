"""Unit tests for pdf_pipeline models."""

from services.pdf_pipeline.models import Chunk, LLMChunk, Manuscript, PageContent


class TestPageContent:
    def test_create_text_only(self):
        page = PageContent(page_number=1, text="Hello world")
        assert page.page_number == 1
        assert page.text == "Hello world"
        assert page.image_bytes is None

    def test_create_with_image(self):
        page = PageContent(page_number=2, text="", image_bytes=b"\x89PNG")
        assert page.image_bytes == b"\x89PNG"


class TestManuscript:
    def test_create(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            text="Once upon a time.",
            extraction_model="gemini-2.5-flash",
            pages_total=10,
            image_pages=3,
        )
        assert m.book_id == "book_001"
        assert m.text == "Once upon a time."

    def test_serialization_roundtrip(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            text="Story text here.",
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        data = m.model_dump_json()
        m2 = Manuscript.model_validate_json(data)
        assert m2 == m


class TestLLMChunk:
    def test_create(self):
        c = LLMChunk(
            chunk_kind="content",
            chapter_title="Chapter 1",
            chunk_hint="The hero arrives.",
            text="He walked into town.",
        )
        assert c.chunk_kind == "content"
        assert c.chunk_hint == "The hero arrives."

    def test_chapter_title_kind(self):
        c = LLMChunk(
            chunk_kind="chapter_title",
            chapter_title="Chapter 2",
            chunk_hint="New chapter begins.",
            text="Chapter 2",
        )
        assert c.chunk_kind == "chapter_title"


class TestChunk:
    def test_create_with_index(self):
        c = Chunk(
            chunk_index=0,
            chunk_kind="content",
            chapter_title="Chapter 1",
            chunk_hint="Opening scene.",
            text="Once upon a time.",
        )
        assert c.chunk_index == 0
        assert c.chunk_hint == "Opening scene."
