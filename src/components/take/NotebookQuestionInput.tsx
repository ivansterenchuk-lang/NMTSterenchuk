import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import type { NotebookPage, NotebookQuestion, NotebookStroke } from '@/types/test';

interface NotebookQuestionInputProps {
  question: NotebookQuestion;
  index: number;
  page: NotebookPage | undefined;
  onChange: (strokes: NotebookStroke[]) => void;
  disabled: boolean;
}

export default function NotebookQuestionInput({ question, index, page, onChange, disabled }: NotebookQuestionInputProps) {
  const strokes = page?.strokes ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Розв'язання в зошиті</p>
          <h2 className="mt-1 whitespace-pre-line text-base font-semibold text-slate-900">
            {question.prompt || 'Розв\'яжіть завдання в зошиті'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Пишіть і малюйте на сторінці. Роботу зберігає вчитель, бал виставляє після перевірки.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <NotebookCanvas
          label={`Розв'язання: ${question.prompt}`}
          strokes={strokes}
          onChange={disabled ? undefined : onChange}
        />
      </div>
    </section>
  );
}
