import { Trash2 } from 'lucide-react';
import { MAX_QUESTION_SCORE } from '@/lib/scoring';
import type { NotebookQuestion } from '@/types/test';

interface NotebookQuestionEditorProps {
  question: NotebookQuestion;
  index: number;
  onChange: (question: NotebookQuestion) => void;
  onRemove: () => void;
}

export default function NotebookQuestionEditor({ question, index, onChange, onRemove }: NotebookQuestionEditorProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            Питання {index + 1} · Розв'язання в електронному зошиті
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Учень розв'язує задачу на полотні. Бал виставляєте ви після перегляду роботи.
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Видалити питання"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-slate-700">Текст завдання</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={3}
          placeholder="Наприклад: Знайдіть площу трикутника зі сторонами 3, 4 та 5 см"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </label>

      <label className="mt-5 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Максимальний бал за завдання</span>
        <input
          type="number"
          min={1}
          max={MAX_QUESTION_SCORE}
          value={question.maxScore}
          onChange={(e) => onChange({ ...question, maxScore: Number(e.target.value) })}
          className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </label>
    </section>
  );
}
