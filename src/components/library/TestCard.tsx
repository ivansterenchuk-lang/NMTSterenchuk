import { ChevronDown, Pencil, Plus, Radio, Trash2, BarChart3, Check, CheckCircle2, ListChecks, Link2, ListOrdered, FileText, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import StartSessionDialog from '@/components/session/StartSessionDialog';
import { createSession } from '@/lib/sessionRepository';
import { navigate } from '@/lib/router';
import type { Question, SessionShuffleOptions, Test } from '@/types/test';
import { getQuestionErrors, isMatchingQuestion } from '@/lib/questionRules';

// 🔧 Хелпер для вибору іконки за типом питання
const getQuestionIcon = (type?: string, isMatching?: boolean) => {
  if (isMatching || type === 'matching') return <Link2 className="w-4 h-4 text-purple-600 shrink-0" />;
  switch (type) {
    case 'single': return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'multiple': return <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'sequence': return <ListOrdered className="w-4 h-4 text-amber-600 shrink-0" />;
    default: return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  }
};

// 🔧 Хелпер для текстової назви типу питання
const getQuestionTypeLabel = (type?: string, isMatching?: boolean) => {
  if (isMatching || type === 'matching') return 'Встановлення відповідності';
  switch (type) {
    case 'single': return 'Одна правильна відповідь';
    case 'multiple': return 'Множинний вибір';
    case 'sequence': return 'Послідовність';
    default: return 'Розв\'язання в зошиті';
  }
};

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
        const isMatching = isMatchingQuestion(question);
        
        return (
          <li key={question.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getQuestionIcon((question as any).type, isMatching)}
                <p className="text-xs font-bold text-slate-700">
                  Питання {index + 1} · {getQuestionTypeLabel((question as any).type, isMatching)}
                  {isMatching && question.leftItems ? ` · пар: ${question.leftItems.length}` : ''}
                </p>
              </div>
              <p className="truncate text-sm text-slate-900">{question.prompt || 'Без тексту'}</p>
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
  onRename?: (testId: string, newTitle: string) => void; // 🔥 Додано для редагування назви
  busy: boolean;
  onError: (message: string) => void;
}

export default function TestCard({
  test,
  isOwner,
  inBasket,
  onAddToBasket,
  onDelete,
  onRename,
  busy,
  onError,
}: TestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  
  // 🔥 Стан для редагування назви
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(test.title);

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

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle.trim() !== test.title) {
      if (onRename) {
        onRename(test.id, editedTitle.trim());
      } else {
        console.warn('Функція onRename не передана в TestCard');
      }
    } else {
      setEditedTitle(test.title); // Відкат, якщо порожньо
    }
    setIsEditingTitle(false);
  };

  // 🔥 Статистика питань
  const stats = test.questions.reduce((acc, q) => {
    const type = isMatchingQuestion(q) ? 'matching' : ((q as any).type || 'notebook');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          
          {/* 🔥 Блок назви з редагуванням */}
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  autoFocus
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') { setEditedTitle(test.title); setIsEditingTitle(false); }
                  }}
                  className="text-lg font-semibold text-slate-900 border-b-2 border-teal-500 outline-none bg-transparent flex-1 py-0.5"
                />
                <button onClick={handleTitleSave} className="text-teal-600 hover:text-teal-800"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => { setEditedTitle(test.title); setIsEditingTitle(false); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <div className="group flex items-center gap-2 cursor-pointer" onClick={() => isOwner && setIsEditingTitle(true)} title={isOwner ? "Натисніть, щоб змінити назву" : ""}>
                <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">{test.title}</h2>
                {isOwner && <Pencil className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            )}
            
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                isOwner ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isOwner ? 'Мій тест' : 'Бібліотека'}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>Створено {new Date(test.created_at).toLocaleDateString('uk-UA')}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium text-slate-700">Всього питань: {test.questions.length}</span>
          </div>

          {/* 🔥 Пункт 9: Компактна статистика типів питань */}
          {test.questions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {stats.single > 0 && <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100"><CheckCircle2 className="w-3 h-3"/> Одна відп.: {stats.single}</span>}
              {stats.multiple > 0 && <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100"><ListChecks className="w-3 h-3"/> Множинний: {stats.multiple}</span>}
              {stats.matching > 0 && <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-100"><Link2 className="w-3 h-3"/> Відповідність: {stats.matching}</span>}
              {stats.sequence > 0 && <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100"><ListOrdered className="w-3 h-3"/> Послідовність: {stats.sequence}</span>}
              {stats.notebook > 0 && <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200"><FileText className="w-3 h-3"/> Зошит: {stats.notebook}</span>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isOwner && (
            <button
              type="button"
              onClick={() => setSessionDialogOpen(true)}
              disabled={starting || busy}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-slate-400"
            >
              <Radio className="h-4 w-4" />
              Розпочати
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