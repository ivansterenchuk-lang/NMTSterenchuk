import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SessionListItem from '@/components/session/SessionListItem';
import { useNow } from '@/hooks/useNow';
import { fetchOwnSessions, setSessionActive } from '@/lib/sessionRepository';
import { fetchTests } from '@/lib/testRepository';
import { getSessionState } from '@/lib/sessionExpiry';
import type { Session, Test } from '@/types/test';

export default function SessionsPage() {
  const now = useNow();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [testsById, setTestsById] = useState<Map<string, Test>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOwnSessions(), fetchTests()])
      .then(([ownSessions, tests]) => {
        if (cancelled) return;
        setSessions(ownSessions);
        setTestsById(new Map(tests.map((test) => [test.id, test])));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Не вдалося завантажити сесії. Оновіть сторінку.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { openSessions, endedSessions } = useMemo(() => {
    const list = sessions ?? [];
    return {
      openSessions: list.filter((session) => getSessionState(session, now) === 'open'),
      endedSessions: list.filter((session) => getSessionState(session, now) !== 'open'),
    };
  }, [sessions, now]);

  const handleClose = async (session: Session) => {
    setClosingId(session.id);
    setActionError(null);
    try {
      await setSessionActive(session.id, false);
      setSessions((prev) => prev?.map((item) => (item.id === session.id ? { ...item, is_active: false } : item)) ?? null);
    } catch {
      setActionError('Не вдалося завершити сесію. Спробуйте ще раз.');
    } finally {
      setClosingId(null);
    }
  };

  const renderList = (items: Session[]) => (
    <ul className="space-y-3">
      {items.map((session) => (
        <SessionListItem
          key={session.id}
          session={session}
          testTitle={testsById.get(session.test_id)?.title ?? 'Тест без назви'}
          now={now}
          closing={closingId === session.id}
          onClose={handleClose}
        />
      ))}
    </ul>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-teal-700">Кабінет вчителя</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Сесії</h1>
      <p className="mt-2 text-sm text-slate-600">Тут видно, які сесії відкриті для учнів, скільки часу їм лишилось і як їх завершити достроково.</p>

      {actionError && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {loadError && (
        <p className="mt-8 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!loadError && sessions === null && (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Завантаження...
        </p>
      )}

      {sessions !== null && sessions.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">Сесій ще немає</p>
          <p className="mt-2 text-sm text-slate-500">Розпочніть сесію з будь-якого вашого тесту у вкладці "Тести".</p>
        </div>
      )}

      {sessions !== null && sessions.length > 0 && (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Відкриті ({openSessions.length})
            </h2>
            {openSessions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Зараз немає відкритих сесій.</p>
            ) : (
              <div className="mt-3">{renderList(openSessions)}</div>
            )}
          </section>

          {endedSessions.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Завершені або з минулим терміном ({endedSessions.length})
              </h2>
              <div className="mt-3">{renderList(endedSessions)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
