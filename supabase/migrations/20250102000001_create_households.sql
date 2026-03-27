-- Create households table
create table if not exists public.households (
    id uuid primary key references auth.users(id) on delete cascade,
    name text,
    onboarding_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.households enable row level security;

-- RLS policies for households
create policy "households_select_own" on public.households 
    for select using (auth.uid() = id);

create policy "households_insert_own" on public.households 
    for insert with check (auth.uid() = id);

create policy "households_update_own" on public.households 
    for update using (auth.uid() = id);

-- Auto-create household on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.households (id, name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
    )
    on conflict (id) do nothing;
    
    return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- Update kids and books to reference households
-- Drop all policies that depend on household_id before type change
drop policy if exists "kids_dev_bypass" on kids;
drop policy if exists "kids_select_own_household" on kids;
drop policy if exists "reading_progress_dev_bypass" on reading_progress;
drop policy if exists "reading_progress_select_own_household" on reading_progress;

-- First, alter kids table to use uuid for household_id
alter table kids
    alter column household_id type uuid using household_id::uuid;

alter table kids
    add constraint kids_household_fk 
    foreign key (household_id) 
    references households(id) 
    on delete cascade;

-- Update books table similarly
alter table books 
    alter column household_id type uuid using household_id::uuid;

alter table books
    add constraint books_household_fk 
    foreign key (household_id) 
    references households(id) 
    on delete cascade;

-- Update RLS policies for kids to use uuid comparison
drop policy if exists "kids_select_own_household" on kids;

create policy "kids_select_own_household" on kids
    for select using (household_id = auth.uid());

create policy "kids_insert_own_household" on kids
    for insert with check (household_id = auth.uid());

create policy "kids_update_own_household" on kids
    for update using (household_id = auth.uid());

create policy "kids_delete_own_household" on kids
    for delete using (household_id = auth.uid());

-- Enable RLS on books
alter table books enable row level security;

create policy "books_select_own_household" on books
    for select using (household_id = auth.uid());

create policy "books_insert_own_household" on books
    for insert with check (household_id = auth.uid());

create policy "books_update_own_household" on books
    for update using (household_id = auth.uid());

create policy "books_delete_own_household" on books
    for delete using (household_id = auth.uid());

-- Re-create reading_progress policy with uuid comparison (was using ::text cast)
create policy "reading_progress_select_own_household" on reading_progress
    for select using (kid_id in (select id from kids where household_id = auth.uid()));
