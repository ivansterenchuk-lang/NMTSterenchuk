/*
# Add optional time limit to tests

1. Modified Tables
- `tests`: new column `time_limit_minutes` (integer, nullable). NULL means no time limit.

2. Constraints
- When set, the limit must be between 1 and 600 minutes.

3. Notes
- Existing tests keep NULL, so they behave exactly as before.
- Enforcement happens in the student's browser (countdown and auto-submit).
*/

ALTER TABLE tests ADD COLUMN IF NOT EXISTS time_limit_minutes integer NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tests_time_limit_minutes_range'
  ) THEN
    ALTER TABLE tests ADD CONSTRAINT tests_time_limit_minutes_range
      CHECK (time_limit_minutes IS NULL OR time_limit_minutes BETWEEN 1 AND 600);
  END IF;
END $$;
