CREATE TABLE kids (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kids_household_id ON kids(household_id);

ALTER TABLE kids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kids_select_own_household" ON kids
  FOR SELECT USING (household_id = auth.uid()::text);
