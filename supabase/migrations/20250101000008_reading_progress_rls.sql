ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_progress_select_own_household" ON reading_progress
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE household_id = auth.uid()::text)
  );
