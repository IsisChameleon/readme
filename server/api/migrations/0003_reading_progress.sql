CREATE TABLE reading_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    kid_id TEXT NOT NULL,
    current_chunk_index INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (book_id, kid_id)
);
