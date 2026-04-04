-- One-time fix: replace 'test_household' string with a valid UUID
-- so the household migration can cast household_id to uuid type.
-- Run against dev Supabase DB before re-running migrations.

DO $$
DECLARE
    replacement_id uuid := gen_random_uuid();
BEGIN
    UPDATE kids  SET household_id = replacement_id::text WHERE household_id = 'test_household';
    UPDATE books SET household_id = replacement_id::text WHERE household_id = 'test_household';
    RAISE NOTICE 'Replaced test_household with %', replacement_id;
END $$;
