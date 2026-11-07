import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import MatchingQuestionInput from '@/components/take/MatchingQuestionInput';
import { scoreMatchingQuestion } from '@/lib/matching';
import { isMatchingQuestion } from '@/lib/questionRules';
import { navigate } from '@/lib/router';
import { fetchTest } from '@/lib/testRepository';
import type { Answers, MatchingAnswer, Test } from '@/types/test';

interface PracticeTestPageProps {
  testId: string;
}

export default function PracticeTestPage({ testId }: PracticeTestPageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetchTest(testId)
      .then((found) => {
        if (cancelled) return;
        setTest(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [testId]);

  const practiceQuestions = useMemo(() => (test ? test.questions.filter(isMatchingQuestion) : []), [test]);
  const notebookCount = test ? test.questions.length - practiceQuestions.length : 0;

  const summary = useMemo(() => {
    return practiceQuestions.reduce(
      (acc, question) => {
        if (!checked[question.id]) return acc;
        const result = scoreMatchingQuestion(question, answers[question.id]);
        return {
          checkedCount: acc.checkedCount + 1,
          score: acc.score + result.score,
          maxScore: acc.maxScore + result.maxScore,
        };
      },
      { checkedCount: 0, score: 0, maxScore: 0 },
    );
  }, [practiceQuestions, answers, checked]);

  const selectAnswer = (questionId: string, leftId: string, rightId: string) =>
    setAnswers((prev) => {
      const questionAnswer: MatchingAnswer = { ...(prev[questionId] ?? {}) };
      if (rightId) {
        questionAnswer[leftId] = rightId;
      } else {
        delete questionAnswer[leftId];
      }
      return { ...prev, [questionId]: questionAnswer };
    });

  const checkQuestion = (questionId: string) => setChecked((prev) => ({ ...prev, [questionId]: true }));

  const retryQuestion = (questionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: {} }));
    setChecked((prev) => ({ ...prev, [questionId]: false }));
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/practice')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        До списку тренувань
      </button>

      <p className="mt-6 text-sm font-medium text-teal-700">Самостійне тренування</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{test.title}</h1>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Перевірено питань: <span className="font-semibold text-slate-900">{summary.checkedCount} з {practiceQuestions.length}</span>
        </p>
        <p className="text-sm text-slate-600">
          Бали: <span className="text-2xl font-semibold text-slate-900">{summary.score}</span>
          <span className="text-slate-500"> з {summary.maxScore}</span>
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {practiceQuestions.map((question, index) => {
          const isChecked = Boolean(checked[question.id]);
          const answer = answers[question.id] ?? {};
          const allAnswered = question.leftItems.every((left) => Boolean(answer[left.id]));

          return (
            <div key={question.id} className="space-y-3">
              <MatchingQuestionInput
                question={question}
                index={index}
                answer={answer}
                onSelect={(leftId, rightId) => selectAnswer(question.id, leftId, rightId)}
                review={isChecked}
                disabled={isChecked}
              />
              <div className="flex justify-end">
                {isChecked ? (
                  <button
                    type="button"
                    onClick={() => retryQuestion(question.id)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Спробувати ще раз
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkQuestion(question.id)}
                    disabled={!allAnswered}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Check className="h-4 w-4" />
                    Перевірити відповідь
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {notebookCount > 0 && (
        <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          У цьому тесті є завдання в електронному зошиті ({notebookCount}). Їх перевіряє вчитель після сесії, тож у тренуванні вони не показані.
        </p>
      )}
    </div>
  );
}
