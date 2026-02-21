create table if not exists books (
    id text primary key,
    household_id text not null,
    title text not null,
    storage_path text not null unique,
    status text not null default 'processing',
    created_at timestamptz not null default now()
);

create index if not exists idx_books_status on books (status);
create index if not exists idx_books_household_id on books (household_id);
