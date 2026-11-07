import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { fetchActiveSessions } from '@/lib/sessionRepository';
import { appendQuestionToTest } from '@/lib/testRepository';
import type { Question, Session, Test } from '@/types/test';

interface AddToTargetDialogProps {
  question: Question;
  ownTests: Test[];
  onClose: () => void;
}

interface Target {
  key: string;
  testId: string;
  title: string;
  subtitle: string;
}

type AddResult = 'added' | 'duplicate';

export default function AddToTargetDialog({ question, ownTests, onClose }: AddToTargetDialogProps) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AddResult>>({});
  const [busyTestId, setBusyTestId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveSessions()
      .then(setSessions)
      .catch(() => setLoadError('Не вдалося завантажити активні сесії.'));
  }, []);

  const testsById = useMemo(() => new Map(ownTests.map((test) => [test.id, test])), [ownTests]);

  const sessionTargets: Target[] = (sessions ?? []).flatMap((session) => {
    const test = testsById.get(session.test_id);
    if (!test) return [];
    return [{ key: `session:${session.id}`, testId: test.id, title: test.title, subtitle: `Активна сесія · код ${session.code}` }];
  });

  const testTargets: Target[] = ownTests.map((test) => ({
    key: `test:${test.id}`,
    testId: test.id,
    title: test.title,
    subtitle: `Тест · ${test.questions.length} питань`,
  }));

  const handleAdd = async (testId: string) => {
    setBusyTestId(testId);
    setActionError(null);
    try {
      const result = await appendQuestionToTest(testId, question);
      setResults((prev) => ({ ...prev, [testId]: result }));
    } catch {
      setActionError('Не вдалося додати питання. Спробуйте ще раз.');
    } finally {
      setBusyTestId(null);
    }
  };

  const renderTarget = (target: Target) => {
    const result = results[target.testId];
    const busy = busyTestId === target.testId;
    const locked = result !== undefined || busyTestId !== null;
    return (
      <li key={target.key}>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{target.title}</p>
            <p className="text-xs text-slate-500">{target.subtitle}</p>
          </div>
          {result === 'added' && (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Додано
            </span>
          )}
          {result === 'duplicate' && (
            <span className="shrink-0 text-sm text-slate-500">Уже є в цьому тесті</span>
          )}
          {result === undefined && (
            <button
              type="button"
              onClick={() => handleAdd(target.testId)}
              disabled={locked}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Додати
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-to-target-title">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-700">Повторне опрацювання</p>
            <h2 id="add-to-target-title" className="mt-1 text-xl font-semibold text-slate-900">
              Додати питання
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {question.prompt || 'Без тексту завдання'}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Питання копіюється в тест. Учні побачать його, коли почнуть проходити цей тест або сесію чи оновлять сторінку.
        </p>

        {actionError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {actionError}
          </p>
        )}

        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Активні сесії</h3>
          {loadError && <p className="mt-3 text-sm text-red-700">{loadError}</p>}
          {!loadError && sessions === null && <p className="mt-3 text-sm text-slate-500">Завантаження...</p>}
          {sessions !== null && sessionTargets.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">Зараз немає активних сесій.</p>
          )}
          <ul className="mt-3 space-y-2">{sessionTargets.map(renderTarget)}</ul>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Мої тести</h3>
          {testTargets.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">У вас ще немає тестів.</p>
          ) : (
            <ul className="mt-3 space-y-2">{testTargets.map(renderTarget)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
