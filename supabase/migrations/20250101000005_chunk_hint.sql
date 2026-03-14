-- Add chunk_hint for semantic one-line chunk summaries.
-- Existing rows get empty string — backward-compatible.

alter table book_chunks
    add column if not exists chunk_hint text not null default '';
