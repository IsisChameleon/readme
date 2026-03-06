CREATE TABLE book_chunks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chapter_title TEXT NOT NULL DEFAULT '',
    page_start INTEGER,
    page_end INTEGER,
    text TEXT NOT NULL,
    UNIQUE (book_id, chunk_index)
);
CREATE INDEX idx_book_chunks_book_id ON book_chunks (book_id);
