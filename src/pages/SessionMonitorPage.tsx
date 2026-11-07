import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import TestResultsPage from '@/pages/TestResultsPage';
import { fetchSession } from '@/lib/sessionRepository';
import { navigate } from '@/lib/router';
import type { Session } from '@/types/test';

interface SessionMonitorPageProps {
  sessionId: string;
}

export default function SessionMonitorPage({ sessionId }: SessionMonitorPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchSession(sessionId)
      .then((found) => {
        if (cancelled) return;
        setSession(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (status === 'loading') {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-slate-500">Завантаження...</p>;
  }
  if (status === 'missing' || !session) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-red-700">Сесію не знайдено.</p>
        <button
          type="button"
          onClick={() => navigate('/tests')}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          До списку тестів
        </button>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-red-700" role="alert">
        Не вдалося завантажити сесію. Оновіть сторінку.
      </p>
    );
  }

  return <TestResultsPage key={session.id} testId={session.test_id} session={session} onSessionChange={setSession} />;
}
