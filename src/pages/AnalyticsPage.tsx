import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { fetchAttemptsForTests, fetchTests } from '@/lib/testRepository';
import { WEAK_TOPIC_PERCENT, buildTopicMastery, type TopicMastery } from '@/lib/topicAnalytics';
import type { Test, TestAttempt } from '@/types/test';

interface AnalyticsPageProps {
  userId: string;
}

export default function AnalyticsPage({ userId }: AnalyticsPageProps) {
  const [data, setData] = useState<{ tests: Test[]; attempts: TestAttempt[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const allTests = await fetchTests();
        const ownTests = allTests.filter((test) => test.owner_id === userId);
        const attempts = await fetchAttemptsForTests(ownTests.map((test) => test.id));
        if (!cancelled) setData({ tests: ownTests, attempts });
      } catch {
        if (!cancelled) setLoadError('Не вдалося завантажити аналітику. Оновіть сторінку.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const topics = useMemo(
    () => (data ? buildTopicMastery(data.tests, data.attempts) : []),
    [data],
  );
  const weakCount = topics.filter((topic) => topic.isWeak).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-teal-700">Кабінет вчителя</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Аналітика за темами та предметами</h1>
      <p className="mt-2 text-sm text-slate-600">
        Відсоток балів, які клас набрав за кожною темою. Теми нижче {WEAK_TOPIC_PERCENT}% позначені як слабкі.
      </p>

      {loadError && (
        <p className="mt-8 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {!loadError && data === null && (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Завантаження...
        </p>
      )}

      {data !== null && topics.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">Поки немає даних для аналітики</p>
          <p className="mt-2 text-sm text-slate-500">Додайте тему до тесту в конструкторі, і результати його учнів зʼявляться тут.</p>
        </div>
      )}

      {topics.length > 0 && (
        <>
          {weakCount > 0 && (
            <p className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Слабких тем: {weakCount}. Варто повторити матеріал із класом.
            </p>
          )}
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {topics.map((topic) => (
              <TopicCard key={topic.topic} topic={topic} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TopicCard({ topic }: { topic: TopicMastery }) {
  const barColor = topic.isWeak ? 'bg-red-500' : 'bg-teal-600';
  const textColor = topic.isWeak ? 'text-red-600' : 'text-slate-900';

  return (
    <li
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        topic.isWeak ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">{topic.topic}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Тестів: {topic.tests.length}, відповідей учнів: {topic.attempts}
          </p>
        </div>
        <p className={`shrink-0 text-2xl font-semibold ${topic.percent === null ? 'text-slate-400' : textColor}`}>
          {topic.percent === null ? 'Немає даних' : `${topic.percent}%`}
        </p>
      </div>

      {topic.percent !== null && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={topic.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${topic.percent}%` }} />
        </div>
      )}

      {topic.isWeak && (
        <p className="mt-3 text-xs font-medium text-red-700">Слабка тема: засвоєння нижче {WEAK_TOPIC_PERCENT}%</p>
      )}

      <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        {topic.tests.map((test) => (
          <li key={test.testId} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="truncate text-slate-700">{test.title}</span>
            <span className="shrink-0 text-slate-500">
              {test.percent === null ? 'немає відповідей' : `${test.percent}% (${test.attempts})`}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}
