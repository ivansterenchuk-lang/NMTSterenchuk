import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchTestAttempts } from '@/lib/testRepository';
import type { TestAttempt } from '@/types/test';

export type LiveStatus = 'connecting' | 'live' | 'error';

function mergeAttempts(...lists: TestAttempt[][]): TestAttempt[] {
  const byId = new Map<string, TestAttempt>();
  for (const list of lists) {
    for (const attempt of list) byId.set(attempt.id, attempt);
  }
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function useLiveTestAttempts(testId: string, sessionId?: string) {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('connecting');

  useEffect(() => {
    let active = true;
    const filter = sessionId ? `session_id=eq.${sessionId}` : `test_id=eq.${testId}`;

    const channel = supabase
      .channel(`test-attempts-${sessionId ?? testId}`)
      .on<TestAttempt>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_attempts', filter },
        (payload) => {
          if (!active) return;
          setAttempts((prev) => mergeAttempts(prev, [payload.new]));
        },
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') setLiveStatus('live');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setLiveStatus('error');
      });

    fetchTestAttempts(testId, sessionId)
      .then((rows) => {
        if (!active) return;
        setAttempts((prev) => mergeAttempts(rows, prev));
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [testId, sessionId]);

  return { attempts, loaded, loadError, liveStatus };
}
