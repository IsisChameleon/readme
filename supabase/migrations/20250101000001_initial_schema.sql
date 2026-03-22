-- Consolidated initial schema
-- (merged from 10 incremental migrations, never applied outside localhost)

-- ── Books ──────────────────────────────────────────────────────────
create table if not exists books (
    id text primary key,
    household_id text not null,
    title text not null,
    author text not null default 'Unknown',
    illustrator text,
    storage_path text not null unique,
    status text not null default 'processing',
    cover_image_url text,
    created_at timestamptz not null default now()
);

create index if not exists idx_books_status on books (status);
create index if not exists idx_books_household_id on books (household_id);

-- ── Kids ───────────────────────────────────────────────────────────
create table if not exists kids (
    id text primary key default gen_random_uuid()::text,
    household_id text not null,
    name text not null,
    avatar text,
    color text,
    created_at timestamptz default now()
);

create index if not exists idx_kids_household_id on kids (household_id);

alter table kids enable row level security;

create policy "kids_select_own_household" on kids
    for select using (household_id = auth.uid()::text);

-- ── Book Chunks ────────────────────────────────────────────────────
create table if not exists book_chunks (
    id text primary key default gen_random_uuid()::text,
    book_id text not null references books(id) on delete cascade,
    chunk_index integer not null,
    chapter_title text not null default '',
    chunk_kind text not null default 'content',
    chunk_hint text not null default '',
    text text not null,
    unique (book_id, chunk_index)
);

create index if not exists idx_book_chunks_book_id on book_chunks (book_id);

-- ── Reading Progress ───────────────────────────────────────────────
create table if not exists reading_progress (
    id text primary key default gen_random_uuid()::text,
    book_id text not null references books(id) on delete cascade,
    kid_id text not null references kids(id) on delete cascade,
    current_chunk_index integer not null default 0,
    updated_at timestamptz not null default now(),
    unique (book_id, kid_id)
);

alter table reading_progress enable row level security;

create policy "reading_progress_select_own_household" on reading_progress
    for select using (
        kid_id in (select id from kids where household_id = auth.uid()::text)
    );
