/*
# Teacher accounts, live sessions, and question basket

1. New Tables
- `sessions`: a live run of a test started by a teacher. `id`, `test_id` (the test), `owner_id` (the teacher), `code` (unique 6-character join code), `is_active` (students can join only while true), `created_at`.
- `basket_items`: questions a teacher collected from the library for building a new test. `id`, `owner_id`, `question_id`, `question` (full question copy), `source_test_title`, `created_at`. A question can be in a basket only once per teacher.

2. Modified Tables
- `tests`: new `owner_id` column (the teacher who created the test). Existing tests keep an empty owner and stay visible in the library but can no longer be edited or deleted.
- `test_attempts`: new nullable `session_id` linking a submission to the live session it came from.

3. Functions
- `find_active_session(code)`: lets students look up an active session by its code. Returns only the session id and test id, never other teachers' data.

4. Security
- Tests: everyone (including students without an account) can read tests. Only the owning teacher can create, edit, or delete their tests.
- Test attempts: students can submit answers without an account. Only the teacher who owns the test can read the submissions, so the live monitoring and PDF export stay private.
- Sessions and basket items: only their owner can read and change them.
- Students never read the sessions table directly; they use the lookup function.

5. Notes
- All statements are safe to run again.
*/

ALTER TABLE tests ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tests ALTER COLUMN owner_id SET DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_test_id_idx ON sessions(test_id);
CREATE INDEX IF NOT EXISTS sessions_owner_id_idx ON sessions(owner_id);

ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES sessions(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS test_attempts_session_id_idx ON test_attempts(session_id);

CREATE TABLE IF NOT EXISTS basket_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  question jsonb NOT NULL,
  source_test_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, question_id)
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE basket_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON tests FROM anon, authenticated;
GRANT SELECT ON tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tests TO authenticated;

REVOKE ALL ON test_attempts FROM anon, authenticated;
GRANT INSERT ON test_attempts TO anon, authenticated;
GRANT SELECT ON test_attempts TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;
GRANT SELECT, INSERT, DELETE ON basket_items TO authenticated;

DROP POLICY IF EXISTS "anon_select_tests" ON tests;
DROP POLICY IF EXISTS "anon_insert_tests" ON tests;
DROP POLICY IF EXISTS "anon_update_tests" ON tests;
DROP POLICY IF EXISTS "anon_delete_tests" ON tests;
DROP POLICY IF EXISTS "public_select_tests" ON tests;
DROP POLICY IF EXISTS "owner_insert_tests" ON tests;
DROP POLICY IF EXISTS "owner_update_tests" ON tests;
DROP POLICY IF EXISTS "owner_delete_tests" ON tests;

CREATE POLICY "public_select_tests" ON tests FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "owner_insert_tests" ON tests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_update_tests" ON tests FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_delete_tests" ON tests FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "anon_select_test_attempts" ON test_attempts;
DROP POLICY IF EXISTS "anon_insert_test_attempts" ON test_attempts;
DROP POLICY IF EXISTS "anon_delete_test_attempts" ON test_attempts;
DROP POLICY IF EXISTS "anon_insert_attempts" ON test_attempts;
DROP POLICY IF EXISTS "owner_select_test_attempts" ON test_attempts;

CREATE POLICY "anon_insert_attempts" ON test_attempts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "owner_select_test_attempts" ON test_attempts FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tests t
      WHERE t.id = test_attempts.test_id AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner_select_sessions" ON sessions;
DROP POLICY IF EXISTS "owner_insert_sessions" ON sessions;
DROP POLICY IF EXISTS "owner_update_sessions" ON sessions;
DROP POLICY IF EXISTS "owner_delete_sessions" ON sessions;

CREATE POLICY "owner_select_sessions" ON sessions FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner_insert_sessions" ON sessions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM tests t WHERE t.id = test_id AND t.owner_id = auth.uid())
  );
CREATE POLICY "owner_update_sessions" ON sessions FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_delete_sessions" ON sessions FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_select_basket" ON basket_items;
DROP POLICY IF EXISTS "owner_insert_basket" ON basket_items;
DROP POLICY IF EXISTS "owner_delete_basket" ON basket_items;

CREATE POLICY "owner_select_basket" ON basket_items FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "owner_insert_basket" ON basket_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_delete_basket" ON basket_items FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.find_active_session(p_code text)
RETURNS TABLE (session_id uuid, test_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.test_id
  FROM public.sessions s
  WHERE s.code = upper(p_code) AND s.is_active
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.find_active_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_active_session(text) TO anon, authenticated;
