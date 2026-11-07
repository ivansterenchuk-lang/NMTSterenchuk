import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { navigate } from '@/lib/router';
import { fetchTests } from '@/lib/testRepository';
import { getTestMaxScore } from '@/lib/scoring';
import type { Test } from '@/types/test';

export default function PracticePage() {
  const [tests, setTests] = useState<Test[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTests()
      .then((found) => {
        if (!cancelled) setTests(found);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Не вдалося завантажити тести. Оновіть сторінку.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-teal-700">Для учнів</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Самостійне тренування</h1>
      <p className="mt-2 text-sm text-slate-600">
        Оберіть тест і проходьте його без коду сесії. Після кожної відповіді ви одразу побачите, де помилилися, і
        правильний варіант. Результат не надсилається вчителю.
      </p>

      {loadError && (
        <p className="mt-8 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!loadError && tests === null && (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Завантаження...
        </p>
      )}

      {tests !== null && tests.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">Тестів поки немає</p>
          <p className="mt-2 text-sm text-slate-500">Зачекайте, поки вчитель додасть тести.</p>
        </div>
      )}

      {tests !== null && tests.length > 0 && (
        <ul className="mt-8 space-y-3">
          {tests.map((test) => (
            <li key={test.id}>
              <button
                type="button"
                onClick={() => navigate(`/practice/${test.id}`)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-slate-900">{test.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {test.topic ? `${test.topic} · ` : ''}
                    Питань: {test.questions.length}, максимум балів: {getTestMaxScore(test.questions)}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
