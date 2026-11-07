import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Printer, Radio } from 'lucide-react';
import SessionPanel from '@/components/session/SessionPanel';
import { useLiveTestAttempts, type LiveStatus } from '@/hooks/useLiveTestAttempts';
import { printTestResult } from '@/lib/pdf/printTestResult';
import { navigate } from '@/lib/router';
import { fetchTest } from '@/lib/testRepository';
import type { Session, Test, TestAttempt } from '@/types/test';

interface TestResultsPageProps {
  testId: string;
  session?: Session;
  onSessionChange?: (session: Session) => void;
}

const LIVE_BADGE: Record<LiveStatus, { label: string; className: string; dotClassName: string }> = {
  connecting: {
    label: 'Підключення...',
    className: 'bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-400',
  },
  live: {
    label: 'Live',
    className: 'bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500 animate-pulse',
  },
  error: {
    label: 'Немає з\'єднання',
    className: 'bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  },
};

export default function TestResultsPage({ testId, session, onSessionChange }: TestResultsPageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [testStatus, setTestStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const { attempts, loaded, loadError, liveStatus } = useLiveTestAttempts(testId, session?.id);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTest(testId)
      .then((found) => {
        if (cancelled) return;
        setTest(found);
        setTestStatus(found ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setTestStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [testId]);

  const handlePrint = (attempt: TestAttempt) => {
    if (!test) return;
    setPdfError(null);
    try {
      printTestResult({
        testTitle: test.title,
        studentName: attempt.student_name,
        submittedAt: attempt.created_at,
        questions: test.questions,
        answers: attempt.answers,
      });
    } catch {
      setPdfError('Не вдалося відкрити вікно друку. Дозвольте спливаючі вікна для цього сайту та спробуйте ще раз.');
    }
  };

  if (testStatus === 'loading' || (!loaded && !loadError)) {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-slate-500">Завантаження...</p>;
  }
  if (testStatus === 'missing') {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-red-700">Тест не знайдено.</p>;
  }
  if (testStatus === 'error' || !test || loadError) {
    return (
      <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-red-700" role="alert">
        Не вдалося завантажити результати. Оновіть сторінку.
      </p>
    );
  }

  const badge = LIVE_BADGE[liveStatus];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/tests')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        До списку тестів
      </button>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Результати тесту</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{test.title}</h1>
        </div>
        <span
          className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-medium sm:self-auto ${badge.className}`}
          role="status"
          aria-live="polite"
        >
          <span className={`h-2 w-2 rounded-full ${badge.dotClassName}`} />
          <Radio className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      </div>

      {session && onSessionChange && (
        <div className="mt-6">
          <SessionPanel session={session} onChange={onSessionChange} />
        </div>
      )}

      {liveStatus === 'error' && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Оновлення в реальному часі тимчасово недоступні. Нові результати з'являтимуться після оновлення сторінки.
        </p>
      )}

      {pdfError && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pdfError}
        </p>
      )}

      {attempts.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 font-medium text-slate-800">Учні ще не проходили цей тест</p>
          <p className="mt-1 text-sm text-slate-500">Результати з'являться тут одразу після відправлення відповідей.</p>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Учень</th>
                <th className="px-5 py-3 font-semibold">Дата</th>
                <th className="px-5 py-3 font-semibold">Бали</th>
                <th className="px-5 py-3 text-right font-semibold">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">{attempt.student_name}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {new Date(attempt.created_at).toLocaleString('uk-UA', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-5 py-4 text-slate-900">
                    {attempt.score} <span className="text-slate-500">з {attempt.max_score}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handlePrint(attempt)}
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      <Printer className="h-4 w-4" />
                      Зберегти PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
