/*
# Add electronic notebook work and teacher reviews to test attempts

1. Modified Tables
- `test_attempts`
  - `notebooks` (jsonb, not null, default '{}'): the student's handwritten work per notebook question. Keys are question ids; values hold the drawn strokes.
  - `notebook_reviews` (jsonb, not null, default '{}'): the teacher's review per notebook question. Holds the awarded score and the red annotation strokes.

2. Security
- Students (anon key) already insert attempts, which covers the new `notebooks` column.
- Adds an UPDATE policy so only the owner of the test can change an attempt that belongs to it.
- Grants UPDATE only on `score` and `notebook_reviews`, so the teacher cannot alter the student's answers or the maximum score.

3. Important Notes
- Existing attempts receive empty objects for both columns and remain valid.
- The teacher's review updates the attempt's total `score`, so results, analytics, and mistake bank stay consistent.
*/

ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS notebooks jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS notebook_reviews jsonb NOT NULL DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "owner_update_test_attempts" ON test_attempts;
CREATE POLICY "owner_update_test_attempts" ON test_attempts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tests t
    WHERE t.id = test_attempts.test_id AND t.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM tests t
    WHERE t.id = test_attempts.test_id AND t.owner_id = auth.uid()
  ));

GRANT UPDATE (score, notebook_reviews) ON test_attempts TO authenticated;
