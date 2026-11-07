/*
# Enable Realtime for test attempts

1. Modified Tables
- `test_attempts`: added to the Supabase Realtime publication so that new student submissions are pushed to the teacher's live results page as they happen.

2. Security
- No changes to row level security or grants. The existing anon and authenticated SELECT policy on `test_attempts` also controls which change events a client receives.

3. Notes
- The statement is guarded, so re-running this migration does nothing if the table is already published.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'test_attempts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.test_attempts;
  END IF;
END $$;
