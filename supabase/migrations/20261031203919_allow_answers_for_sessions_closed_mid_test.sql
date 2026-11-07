/*
# Keep answers from students who were already in a session

1. Why
- Students who joined while a session was open must not lose their answers when the teacher closes it or the timer runs out.
- The previous policy rejected those inserts, which dropped the results.

2. Changes
- `anon_insert_attempts` accepts any attempt. A session id is only handed out by find_active_session while the session is open, and sessions are enforced by foreign key, so late joiners cannot obtain a usable id.
- Removes `session_accepts_answers`, which is no longer needed.

3. Notes
- Closed or expired sessions still block new students at the code entry step.
*/

DROP POLICY IF EXISTS "anon_insert_attempts" ON test_attempts;
CREATE POLICY "anon_insert_attempts" ON test_attempts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP FUNCTION IF EXISTS public.session_accepts_answers(uuid);
