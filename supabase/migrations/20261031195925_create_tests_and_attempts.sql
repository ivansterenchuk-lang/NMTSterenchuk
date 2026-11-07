/*
# Create tests and test attempts

1. New Tables
- `tests`: a teacher-built test. `id` (uuid, primary key), `title` (text), `questions` (jsonb list of questions, currently matching questions), `created_at` (timestamp).
- `test_attempts`: a student's submitted answers. `id` (uuid, primary key), `test_id` (references tests), `student_name` (text), `answers` (jsonb), `score` (int), `max_score` (int), `created_at` (timestamp).

2. Security
- Row level security enabled on both tables.
- The app has no sign-in, so anon and authenticated roles get the needed verbs. Data is intentionally shared.

3. Notes
- Deleting a test also deletes its attempts (cascade).
*/

CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score int NOT NULL DEFAULT 0,
  max_score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_attempts_test_id_idx ON test_attempts(test_id);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON tests TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON test_attempts TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_tests" ON tests;
CREATE POLICY "anon_select_tests" ON tests FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tests" ON tests;
CREATE POLICY "anon_insert_tests" ON tests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tests" ON tests;
CREATE POLICY "anon_update_tests" ON tests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tests" ON tests;
CREATE POLICY "anon_delete_tests" ON tests FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_test_attempts" ON test_attempts;
CREATE POLICY "anon_select_test_attempts" ON test_attempts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_test_attempts" ON test_attempts;
CREATE POLICY "anon_insert_test_attempts" ON test_attempts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_test_attempts" ON test_attempts;
CREATE POLICY "anon_delete_test_attempts" ON test_attempts FOR DELETE
  TO anon, authenticated USING (true);
