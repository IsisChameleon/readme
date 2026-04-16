"""Unit tests for pdf_pipeline models."""

from workers.pdf_pipeline.models import (
    Chapter,
    Chunk,
    LLMChunk,
    Manuscript,
    PageContent,
    _ChapterTitles,
)


class TestPageContent:
    def test_create_text_only(self):
        page = PageContent(page_number=1, text="Hello world")
        assert page.page_number == 1
        assert page.text == "Hello world"
        assert page.image_bytes is None

    def test_create_with_image(self):
        page = PageContent(page_number=2, text="", image_bytes=b"\x89PNG")
        assert page.image_bytes == b"\x89PNG"


class TestChapter:
    def test_titled(self):
        c = Chapter(title="The Boy Who Lived", text="Mr. and Mrs. Dursley...")
        assert c.title == "The Boy Who Lived"

    def test_untitled(self):
        c = Chapter(title=None, text="Once upon a time...")
        assert c.title is None


class TestManuscript:
    def test_create(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[Chapter(title=None, text="Once upon a time.")],
            extraction_model="gemini-2.5-flash",
            pages_total=10,
            image_pages=3,
        )
        assert m.book_id == "book_001"
        assert len(m.chapters) == 1
        assert m.chapters[0].text == "Once upon a time."

    def test_serialization_roundtrip(self):
        m = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[
                Chapter(title="Chapter 1", text="Body one."),
                Chapter(title="Chapter 2", text="Body two."),
            ],
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        data = m.model_dump_json()
        m2 = Manuscript.model_validate_json(data)
        assert m2 == m


class TestChapterTitles:
    def test_empty(self):
        t = _ChapterTitles(titles=[])
        assert t.titles == []

    def test_populated(self):
        t = _ChapterTitles(titles=["Chapter 1", "Chapter 2"])
        assert len(t.titles) == 2


class TestLLMChunk:
    def test_create(self):
        c = LLMChunk(chunk_hint="The hero arrives.", text="He walked into town.")
        assert c.chunk_hint == "The hero arrives."


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

    def test_chapter_title_kind(self):
        c = Chunk(
            chunk_index=1,
            chunk_kind="chapter_title",
            chapter_title="Chapter 2",
            chunk_hint="Start of chapter: Chapter 2",
            text="Chapter 2",
        )
        assert c.chunk_kind == "chapter_title"
