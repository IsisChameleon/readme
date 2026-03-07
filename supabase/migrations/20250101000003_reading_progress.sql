create table if not exists reading_progress (
    id text primary key default gen_random_uuid()::text,
    book_id text not null references books(id) on delete cascade,
    kid_id text not null,
    current_chunk_index integer not null default 0,
    updated_at timestamptz not null default now(),
    unique (book_id, kid_id)
);
