import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Printer, Send } from 'lucide-react';
import MatchingQuestionInput from '@/components/take/MatchingQuestionInput';
import NotebookQuestionInput from '@/components/take/NotebookQuestionInput';
import TestTimer from '@/components/take/TestTimer';
import { useNow } from '@/hooks/useNow';
import {
  getAttemptKey,
  loadStoredAttempt,
  persistAttempt,
  type EndReason,
  type SubmittedAttempt,
} from '@/lib/attemptStorage';
import { printTestResult } from '@/lib/pdf/printTestResult';
import { createAttemptSeed, arrangeQuestionsForAttempt, NO_SHUFFLE } from '@/lib/questionOrder';
import { isMatchingQuestion, isQuestionAnswered, scoreQuestion } from '@/lib/questionRules';
import { navigate } from '@/lib/router';
import { getTestMaxScore } from '@/lib/scoring';
import { fetchSessionCodeStatus } from '@/lib/sessionRepository';
import { fetchTest, saveTestAttempt } from '@/lib/testRepository';
import type {
  Answers,
  NotebookStroke,
  NotebookWork,
  SessionShuffleOptions,
  Test,
} from '@/types/test';

interface TakeTestPageProps {
  testId: string;
  sessionId?: string;
  sessionCode?: string;
  shuffle?: SessionShuffleOptions;
}

const UNNAMED_STUDENT = 'Без імені';
const SESSION_POLL_MS = 10_000;
const SAVE_RETRY_MS = 5_000;

const AUTO_SUBMIT_MESSAGES: Record<Exclude<EndReason, 'manual'>, string> = {
  time: 'Час вийшов! Ваші поточні відповіді було автоматично збережено та надіслано викладачу.',
  session_closed: 'Вчитель завершив сесію. Ваші поточні відповіді було автоматично збережено та надіслано викладачу.',
  session_expired: 'Термін дії сесії закінчився. Ваші поточні відповіді було автоматично збережено та надіслано викладачу.',
};

export default function TakeTestPage({ testId, sessionId, sessionCode, shuffle = NO_SHUFFLE }: TakeTestPageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [seed, setSeed] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [notebooks, setNotebooks] = useState<NotebookWork>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmittedAttempt | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const now = useNow();
  const sendingRef = useRef(false);

  const storageKey = getAttemptKey(testId, sessionId);
  const review = result !== null;
  const displayedQuestions = useMemo(
    () => (test ? arrangeQuestionsForAttempt(test.questions, seed, shuffle) : []),
    [test, seed, shuffle],
  );

  useEffect(() => {
    let cancelled = false;
    fetchTest(testId)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setStatus('missing');
          return;
        }
        const stored = loadStoredAttempt(storageKey);
        setTest(found);
        setSeed(stored?.seed ?? createAttemptSeed());
        setStudentName(stored?.studentName ?? '');
        setAnswers(stored?.answers ?? {});
        setNotebooks(stored?.notebooks ?? {});
        setResult(stored?.submitted ?? null);
        setDeadline(
          stored?.deadline ?? (found.time_limit_minutes ? Date.now() + found.time_limit_minutes * 60_000 : null),
        );
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [testId, storageKey]);

  useEffect(() => {
    if (status !== 'ready') return;
    persistAttempt(storageKey, { deadline, seed, studentName, answers, notebooks, submitted: result });
  }, [status, storageKey, deadline, seed, studentName, answers, notebooks, result]);

  const remainingMs = deadline === null || review ? null : Math.max(0, deadline - now);
  const timeIsUp = remainingMs === 0;

  const sendSubmission = useCallback(
    async (submitted: SubmittedAttempt) => {
      if (!test || sendingRef.current) return;
      sendingRef.current = true;
      try {
        await saveTestAttempt({
          testId: test.id,
          sessionId: sessionId ?? null,
          studentName: studentName.trim() || UNNAMED_STUDENT,
          answers,
          notebooks,
          score: submitted.score,
          maxScore: submitted.maxScore,
        });
        setResult({ ...submitted, saved: true });
      } catch {
        setResult({ ...submitted, failedSends: submitted.failedSends + 1 });
      } finally {
        sendingRef.current = false;
      }
    },
    [test, sessionId, studentName, answers, notebooks],
  );

  useEffect(() => {
    if (!result || result.saved) return;
    const retry = () => void sendSubmission(result);
    const timer = window.setTimeout(retry, SAVE_RETRY_MS);
    window.addEventListener('online', retry);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', retry);
    };
  }, [result, sendSubmission]);

  const submitAnswers = useCallback(
    async (endReason: EndReason) => {
      if (!test || result) return;
      setFormError(null);

      if (endReason === 'manual') {
        if (!studentName.trim()) {
          setFormError('Введіть ваше ім\'я, щоб відправити тест.');
          return;
        }
        const unanswered = test.questions.some((question) => !isQuestionAnswered(question, answers, notebooks));
        if (unanswered) {
          setFormError('Дайте відповідь на всі пункти тесту.');
          return;
        }
      }

      const totals = test.questions.reduce(
        (acc, question) => {
          const { score, maxScore } = scoreQuestion(question, answers, {});
          return { score: acc.score + score, maxScore: acc.maxScore + maxScore };
        },
        { score: 0, maxScore: 0 },
      );

      const submitted: SubmittedAttempt = {
        ...totals,
        endReason,
        submittedAt: new Date().toISOString(),
        saved: false,
        failedSends: 0,
      };
      setResult(submitted);
      await sendSubmission(submitted);
    },
    [test, result, studentName, answers, notebooks, sendSubmission],
  );

  useEffect(() => {
    if (timeIsUp) void submitAnswers('time');
  }, [timeIsUp, submitAnswers]);

  useEffect(() => {
    if (!sessionCode || review) return;
    const checkSession = async () => {
      try {
        const codeStatus = await fetchSessionCodeStatus(sessionCode);
        if (codeStatus === 'closed') void submitAnswers('session_closed');
        if (codeStatus === 'expired') void submitAnswers('session_expired');
      } catch {
        // The next scheduled check retries when the connection is unstable.
      }
    };
    const id = window.setInterval(checkSession, SESSION_POLL_MS);
    return () => window.clearInterval(id);
  }, [sessionCode, review, submitAnswers]);

  const selectAnswer = (questionId: string, leftId: string, rightId: string) =>
    setAnswers((prev) => {
      const questionAnswer = { ...(prev[questionId] ?? {}) };
      if (rightId) {
        questionAnswer[leftId] = rightId;
      } else {
        delete questionAnswer[leftId];
      }
      return { ...prev, [questionId]: questionAnswer };
    });

  const updateNotebook = (questionId: string, strokes: NotebookStroke[]) =>
    setNotebooks((prev) => ({ ...prev, [questionId]: { strokes } }));

  const handlePrintPdf = () => {
    if (!test || !result) return;
    setPdfError(null);
    try {
      printTestResult({
        testTitle: test.title,
        studentName: studentName.trim() || UNNAMED_STUDENT,
        submittedAt: result.submittedAt,
        questions: test.questions,
        answers,
        reviews: {},
      });
    } catch {
      setPdfError('Не вдалося відкрити вікно друку. Дозвольте спливаючі вікна для цього сайту та спробуйте ще раз.');
    }
  };

  if (status === 'loading') {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-slate-500">Завантаження...</p>;
  }
  if (status === 'missing') {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-red-700">Тест не знайдено.</p>;
  }
  if (status === 'error' || !test) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-red-700" role="alert">
        Не вдалося завантажити тест. Оновіть сторінку.
      </p>
    );
  }

  const testMaxScore = getTestMaxScore(test.questions);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {!sessionId && (
        <button
          type="button"
          onClick={() => navigate('/tests')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          До списку тестів
        </button>
      )}

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">{test.title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Максимальний бал за тест: <span className="font-semibold text-slate-900">{testMaxScore}</span>
        {test.time_limit_minutes !== null && (
          <span className="ml-3">Час на проходження: {test.time_limit_minutes} хв</span>
        )}
      </p>

      {result && (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <p className="text-sm font-medium text-teal-800">Ваш результат</p>
          <p className="mt-1 text-4xl font-semibold text-slate-900">
            {result.score} <span className="text-2xl text-slate-500">з {result.maxScore}</span>
          </p>
          {result.endReason !== 'manual' && (
            <p className="mt-3 text-sm font-medium text-slate-800">{AUTO_SUBMIT_MESSAGES[result.endReason]}</p>
          )}
          {result.saved ? (
            <p className="mt-3 text-sm text-teal-800">Відповіді надіслано викладачу.</p>
          ) : (
            <p className="mt-3 text-sm text-amber-800">
              {result.failedSends === 0
                ? 'Надсилаємо відповіді викладачу...'
                : 'Немає зв\'язку з сервером. Відповіді збережено на цьому пристрої, і ми надішлемо їх автоматично, щойно з\'єднання відновиться.'}
            </p>
          )}
          <div className="mt-5 flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm ring-1 ring-teal-200 transition-colors hover:bg-teal-100"
            >
              <Printer className="h-4 w-4" />
              Зберегти PDF
            </button>
            {pdfError && (
              <p className="text-sm text-red-700" role="alert">
                {pdfError}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ваше ім'я</span>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            disabled={review}
            placeholder="Наприклад: Олена Коваль"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
          />
        </label>
      </div>

      <div className="mt-6 space-y-6">
        {displayedQuestions.map((question, index) =>
          isMatchingQuestion(question) ? (
            <MatchingQuestionInput
              key={question.id}
              question={question}
              index={index}
              answer={answers[question.id] ?? {}}
              onSelect={(leftId, rightId) => selectAnswer(question.id, leftId, rightId)}
              review={review}
              disabled={review}
            />
          ) : (
            <NotebookQuestionInput
              key={question.id}
              question={question}
              index={index}
              page={notebooks[question.id]}
              onChange={(strokes) => updateNotebook(question.id, strokes)}
              disabled={review}
            />
          ),
        )}
      </div>

      {!review && (
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:items-end">
          {formError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}
          <button
            type="button"
            onClick={() => submitAnswers('manual')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            <Send className="h-4 w-4" />
            Відправити відповіді
          </button>
        </div>
      )}

      {remainingMs !== null && <TestTimer remainingMs={remainingMs} />}
    </div>
  );
}
