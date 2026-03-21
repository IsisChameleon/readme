-- Seed data for local development
-- household_id = 'dev' matches the fallback when no auth is present

INSERT INTO kids (id, household_id, name, avatar, color) VALUES
  ('kid-emma', 'dev', 'Emma', 'E', '#F472B6'),
  ('kid-liam', 'dev', 'Liam', 'L', '#60A5FA');

INSERT INTO books (id, household_id, title, storage_path, status) VALUES
  ('book-caterpillar', 'dev', 'The Very Hungry Caterpillar', 'households/dev/books/book-caterpillar/caterpillar.pdf', 'ready'),
  ('book-wild-things', 'dev', 'Where the Wild Things Are', 'households/dev/books/book-wild-things/wild-things.pdf', 'ready'),
  ('book-goodnight', 'dev', 'Goodnight Moon', 'households/dev/books/book-goodnight/goodnight.pdf', 'processing');

-- Sample reading progress for Emma
INSERT INTO reading_progress (book_id, kid_id, current_chunk_index) VALUES
  ('book-caterpillar', 'kid-emma', 3);
