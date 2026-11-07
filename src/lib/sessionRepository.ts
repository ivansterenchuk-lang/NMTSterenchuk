import { supabase } from '@/lib/supabase';
import type { Session, SessionShuffleOptions } from '@/types/test';

const SESSION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SESSION_CODE_LENGTH = 6;
const UNIQUE_VIOLATION = '23505';

export type SessionCodeStatus = 'active' | 'expired' | 'closed' | 'not_found';

function generateSessionCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SESSION_CODE_LENGTH));
  return Array.from(bytes, (byte) => SESSION_CODE_ALPHABET[byte % SESSION_CODE_ALPHABET.length]).join('');
}

const SESSION_COLUMNS = 'id, test_id, code, is_active, expires_at, shuffle_questions, shuffle_options, created_at';

export async function createSession(
  testId: string,
  expiresAt: string | null,
  shuffle: SessionShuffleOptions,
): Promise<Session> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        test_id: testId,
        code: generateSessionCode(),
        expires_at: expiresAt,
        shuffle_questions: shuffle.shuffleQuestions,
        shuffle_options: shuffle.shuffleOptions,
      })
      .select(SESSION_COLUMNS)
      .single();
    if (!error) return data as Session;
    if (error.code !== UNIQUE_VIOLATION) throw error;
  }
  throw new Error('Could not generate a unique session code');
}

export async function fetchSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Session | null) ?? null;
}

export async function fetchOwnSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Session[];
}

export async function fetchActiveSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Session[];
}

export async function setSessionActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('sessions').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function findActiveSession(code: string): Promise<{ sessionId: string; testId: string } | null> {
  const { data, error } = await supabase.rpc('find_active_session', { p_code: code.trim() });
  if (error) throw error;
  const row = (data as { session_id: string; test_id: string }[] | null)?.[0];
  return row ? { sessionId: row.session_id, testId: row.test_id } : null;
}

export async function fetchSessionShuffle(sessionId: string): Promise<SessionShuffleOptions> {
  const { data, error } = await supabase.rpc('get_session_shuffle', { p_session_id: sessionId });
  if (error) throw error;
  const row = (data as { shuffle_questions: boolean; shuffle_options: boolean }[] | null)?.[0];
  if (!row) throw new Error('Session not found');
  return { shuffleQuestions: row.shuffle_questions, shuffleOptions: row.shuffle_options };
}

export async function fetchSessionCodeStatus(code: string): Promise<SessionCodeStatus> {
  const { data, error } = await supabase.rpc('get_session_status', { p_code: code.trim() });
  if (error) throw error;
  if (data === 'active' || data === 'expired' || data === 'closed' || data === 'not_found') return data;
  throw new Error('Unexpected session status response');
}
