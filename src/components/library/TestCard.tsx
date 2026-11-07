import { ChevronDown, Pencil, Plus, Radio, Trash2, BarChart3, Check } from 'lucide-react';
import { useState } from 'react';
import StartSessionDialog from '@/components/session/StartSessionDialog';
import { createSession } from '@/lib/sessionRepository';
import { navigate } from '@/lib/router';
import type { Question, SessionShuffleOptions, Test } from '@/types/test';
import { getQuestionErrors, isMatchingQuestion } from '@/lib/questionRules';

interface QuestionPreviewProps {
  questions: Question[];
  inBasket: Set<string>;
  onAdd: (question: Question) => void;
}

function QuestionPreview({ questions, inBasket, onAdd }: QuestionPreviewProps) {
  if (questions.length === 0) {
    return <p className="text-sm text-slate-500">У цьому тесті ще немає питань.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
      {questions.map((question, index) => {
        const added = inBasket.has(question.id);
        const hasErrors = getQuestionErrors(question).length > 0;
        return (
          <li key={question.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-teal-700">
                {isMatchingQuestion(question)
                  ? `Питання ${index + 1} · Встановлення відповідності · пар: ${question.leftItems.length}`
                  : `Питання ${index + 1} · Розв'язання в зошиті`}
              </p>
              <p className="mt-1 truncate text-sm text-slate-900">{question.prompt || 'Без тексту'}</p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(question)}
              disabled={added || hasErrors}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default disabled:bg-transparent disabled:text-slate-500 enabled:bg-teal-50 enabled:text-teal-800 enabled:hover:bg-teal-100"
            >
              {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {added ? 'У кошику' : hasErrors ? 'Питання неповне' : 'Додати в кошик'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface TestCardProps {
  test: Test;
  isOwner: boolean;
  inBasket: Set<string>;
  onAddToBasket: (question: Question, sourceTestTitle: string) => void;
  onDelete: (test: Test) => void;
  busy: boolean;
  onError: (message: string) => void;
}

export default function TestCard({
  test,
  isOwner,
  inBasket,
  onAddToBasket,
  onDelete,
  busy,
  onError,
}: TestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const startSession = async (expiresAt: string | null, shuffle: SessionShuffleOptions) => {
    setStarting(true);
    try {
      const session = await createSession(test.id, expiresAt, shuffle);
      navigate(`/sessions/${session.id}`);
    } catch {
      onError('Не вдалося розпочати сесію. Спробуйте ще раз.');
      setStarting(false);
      setSessionDialogOpen(false);
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-slate-900">{test.title}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                isOwner ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isOwner ? 'Мій тест' : 'Бібліотека'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Питань: {test.questions.length} · Створено {new Date(test.created_at).toLocaleDateString('uk-UA')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => setSessionDialogOpen(true)}
              disabled={starting || busy}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-slate-400"
            >
              <Radio className="h-4 w-4" />
              Розпочати сесію
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/tests/${test.id}`)}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Пройти тест
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tests/${test.id}/results`)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-teal-700"
          >
            <BarChart3 className="h-4 w-4" />
            Результати
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/tests/${test.id}/edit`)}
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-700"
                aria-label="Редагувати тест"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(test)}
                disabled={busy}
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label="Видалити тест"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Питання
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <QuestionPreview
            questions={test.questions}
            inBasket={inBasket}
            onAdd={(question) => onAddToBasket(question, test.title)}
          />
        </div>
      )}

      {sessionDialogOpen && (
        <StartSessionDialog
          testTitle={test.title}
          busy={starting}
          onConfirm={startSession}
          onClose={() => setSessionDialogOpen(false)}
        />
      )}
    </li>
  );
}
