create extension if not exists pgcrypto;

create table if not exists books (
    id uuid primary key default gen_random_uuid(),
    household_id uuid not null,
    title text not null,
    storage_path text not null unique,
    status text not null default 'uploaded',
    created_at timestamptz not null default now()
);

create index if not exists idx_books_status on books (status);
create index if not exists idx_books_household_id on books (household_id);
