import { useEffect, useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import AddToTargetDialog from '@/components/mistakes/AddToTargetDialog';
import MistakeBankCard from '@/components/mistakes/MistakeBankCard';
import { buildMistakeBank, type MistakeBankEntry } from '@/lib/mistakeBank';
import { fetchAttemptsForTests, fetchTests } from '@/lib/testRepository';
import type { Test, TestAttempt } from '@/types/test';

interface MistakeBankPageProps {
  userId: string;
}

export default function MistakeBankPage({ userId }: MistakeBankPageProps) {
  const [tests, setTests] = useState<Test[] | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<MistakeBankEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTests()
      .then(async (allTests) => {
        const ownTests = allTests.filter((test) => test.owner_id === userId);
        const testAttempts = await fetchAttemptsForTests(ownTests.map((test) => test.id));
        if (cancelled) return;
        setTests(ownTests);
        setAttempts(testAttempts);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Не вдалося завантажити банк помилок. Оновіть сторінку.');
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const entries = useMemo(
    () => (tests && attempts ? buildMistakeBank(tests, attempts) : []),
    [tests, attempts],
  );

  const isLoading = tests === null && !loadError;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Аналіз результатів</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Банк помилок</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Питання, на які учні відповіли неправильно в ваших тестах. Додайте їх до тесту або активної сесії, щоб учні
          опрацювали їх повторно.
        </p>
      </div>

      {loadError && (
        <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      {isLoading && <p className="mt-10 text-sm text-slate-500">Завантаження...</p>}

      {!isLoading && !loadError && entries.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 font-medium text-slate-800">Помилок поки немає</p>
          <p className="mt-1 text-sm text-slate-500">
            Тут з'являться питання, на які учні відповіли неправильно.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <p className="mt-8 text-sm text-slate-500">Питань з помилками: {entries.length}</p>
          <ul className="mt-4 grid gap-4">
            {entries.map((entry, index) => (
              <MistakeBankCard key={entry.key} entry={entry} index={index} onAdd={() => setActiveEntry(entry)} />
            ))}
          </ul>
        </>
      )}

      {activeEntry && tests && (
        <AddToTargetDialog
          question={activeEntry.question}
          ownTests={tests}
          onClose={() => setActiveEntry(null)}
        />
      )}
    </div>
  );
}
