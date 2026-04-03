-- Create storage buckets for book PDFs (one per environment)
insert into storage.buckets (id, name, public)
values
    ('readme_dev',  'readme_dev',  false),
    ('readme_prod', 'readme_prod', false)
on conflict (id) do nothing;
