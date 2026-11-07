/*
# Add scoring presets and per-question points

1. Modified Tables
- `tests`
  - `scoring_preset` (text, not null, default 'custom'): 'nmt' applies the national test (НМТ) history rules, 'custom' lets the teacher set points per question.
- `tests.questions` (jsonb): existing matching questions get two new fields.
- `basket_items.question` (jsonb): saved question copies get the same two new fields.

2. New fields on each matching question
- `maxScore` (integer): points available for the whole question. Existing questions receive the number of left-column items, which matches the old scoring (one point per correct pair).
- `scoringMode` (text): 'partial' awards points for each correct pair; 'all_or_nothing' awards full points only when every pair is correct. Existing questions use 'partial'.

3. Security
- No new tables. Existing row level security policies and grants already cover these columns.

4. Important notes
- Points are whole numbers because the attempt score columns are integers.
- The backfill only touches questions that do not yet have the new fields, so it is safe to re-run.
*/

ALTER TABLE tests ADD COLUMN IF NOT EXISTS scoring_preset text NOT NULL DEFAULT 'custom';

ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_scoring_preset_check;
ALTER TABLE tests ADD CONSTRAINT tests_scoring_preset_check CHECK (scoring_preset IN ('nmt', 'custom'));

UPDATE tests
SET questions = (
  SELECT jsonb_agg(
    CASE
      WHEN q ? 'maxScore' AND q ? 'scoringMode' THEN q
      ELSE q || jsonb_build_object(
        'maxScore', GREATEST(1, jsonb_array_length(q -> 'leftItems')),
        'scoringMode', 'partial'
      )
    END
    ORDER BY ord
  )
  FROM jsonb_array_elements(tests.questions) WITH ORDINALITY AS t(q, ord)
)
WHERE jsonb_typeof(questions) = 'array'
  AND jsonb_array_length(questions) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(tests.questions) e
    WHERE NOT (e ? 'maxScore' AND e ? 'scoringMode')
  );

UPDATE basket_items
SET question = question || jsonb_build_object(
  'maxScore', GREATEST(1, jsonb_array_length(question -> 'leftItems')),
  'scoringMode', 'partial'
)
WHERE NOT (question ? 'maxScore' AND question ? 'scoringMode');
