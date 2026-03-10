-- Add chunk_kind; drop page_start/page_end.
-- Existing rows default to 'content' — backward-compatible.

alter table book_chunks
    add column if not exists chunk_kind text not null default 'content';

alter table book_chunks drop column if exists page_start;
alter table book_chunks drop column if exists page_end;
