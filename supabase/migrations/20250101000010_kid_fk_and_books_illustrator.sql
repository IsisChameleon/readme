-- Add missing foreign key from reading_progress.kid_id to kids.id
ALTER TABLE reading_progress
  ADD CONSTRAINT reading_progress_kid_id_fkey
  FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE;

-- Add illustrator column to books
ALTER TABLE books ADD COLUMN illustrator TEXT;
