/*
# Session expiry and answer gating

1. Modified Tables
- `sessions`: new column `expires_at` (timestamptz, nullable). NULL means the session stays open until the teacher closes it.

2. New Functions (all SECURITY DEFINER, search_path = public)
- `find_active_session(p_code)`: now also ignores sessions whose `expires_at` has passed. Same signature as before.
- `get_session_status(p_code)`: returns one of 'active', 'expired', 'closed', 'not_found' so the student sees the right message.
- `session_accepts_answers(p_session_id)`: returns true only when the session is open and not expired.

3. Security
- `find_active_session`, `get_session_status` and `session_accepts_answers` are callable by anon and authenticated only. PUBLIC has no EXECUTE.
- The INSERT policy on `test_attempts` now allows a row only when it has no session, or its session accepts answers. Closed or expired sessions can no longer receive answers, even via direct API calls.

4. Notes
- Attempts without a session (practice tests) are unaffected.
*/

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.find_active_session(p_code text)
RETURNS TABLE(session_id uuid, test_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
SELECT s.id, s.test_id
FROM public.sessions s
WHERE s.code = upper(p_code)
  AND s.is_active
  AND (s.expires_at IS NULL OR s.expires_at > now())
LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.get_session_status(p_code text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
SELECT CASE
  WHEN NOT EXISTS (SELECT 1 FROM public.sessions s WHERE s.code = upper(p_code)) THEN 'not_found'
  WHEN EXISTS (SELECT 1 FROM public.sessions s WHERE s.code = upper(p_code) AND NOT s.is_active) THEN 'closed'
  WHEN EXISTS (SELECT 1 FROM public.sessions s WHERE s.code = upper(p_code) AND s.expires_at <= now()) THEN 'expired'
  ELSE 'active'
END
$function$;

CREATE OR REPLACE FUNCTION public.session_accepts_answers(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.id = p_session_id
    AND s.is_active
    AND (s.expires_at IS NULL OR s.expires_at > now())
)
$function$;

REVOKE EXECUTE ON FUNCTION public.find_active_session(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_session_status(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.session_accepts_answers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_active_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.session_accepts_answers(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_attempts" ON test_attempts;
CREATE POLICY "anon_insert_attempts" ON test_attempts FOR INSERT
TO anon, authenticated
WITH CHECK (session_id IS NULL OR public.session_accepts_answers(session_id));
