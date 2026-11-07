/*
# Add anti-cheating flags, test topics, and a shuffle lookup

1. Modified tables
- `sessions`: new `shuffle_questions` and `shuffle_options` boolean columns (default false). When true, each student sees questions and answer options in a unique random order.
- `tests`: new `topic` text column (nullable, 1-80 characters). The teacher uses it to group results in the analytics dashboard.

2. New function
- `get_session_shuffle(p_session_id uuid)` returns the two shuffle flags for one session. Students joining with a code need these flags, but they cannot read the sessions table directly.

3. Security
- The function is SECURITY DEFINER with a fixed search_path. It is callable by `anon` and `authenticated` only, which matches the existing session lookup functions.
- No existing policies change.

4. Notes
- Existing sessions and tests keep working: both flags default to false and topic defaults to null.
*/

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS shuffle_options boolean NOT NULL DEFAULT false;

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS topic text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tests_topic_length'
  ) THEN
    ALTER TABLE public.tests
      ADD CONSTRAINT tests_topic_length CHECK (topic IS NULL OR char_length(topic) BETWEEN 1 AND 80);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_session_shuffle(p_session_id uuid)
RETURNS TABLE (shuffle_questions boolean, shuffle_options boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.shuffle_questions, s.shuffle_options
  FROM public.sessions s
  WHERE s.id = p_session_id
$$;

REVOKE EXECUTE ON FUNCTION public.get_session_shuffle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_session_shuffle(uuid) TO anon, authenticated;
