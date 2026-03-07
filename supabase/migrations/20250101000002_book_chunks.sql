create table if not exists book_chunks (
    id text primary key default gen_random_uuid()::text,
    book_id text not null references books(id) on delete cascade,
    chunk_index integer not null,
    chapter_title text not null default '',
    page_start integer,
    page_end integer,
    text text not null,
    unique (book_id, chunk_index)
);

create index if not exists idx_book_chunks_book_id on book_chunks (book_id);
