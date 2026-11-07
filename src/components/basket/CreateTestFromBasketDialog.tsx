import { useState, type FormEvent } from 'react';
import { ChevronDown, ChevronUp, Loader2, Trash2, X } from 'lucide-react';
import { createTest } from '@/lib/testRepository';
import type { BasketItem } from '@/types/test';

interface CreateTestFromBasketDialogProps {
  items: BasketItem[];
  onClose: () => void;
  onCreated: (usedItemIds: string[]) => void;
}

export default function CreateTestFromBasketDialog({ items, onClose, onCreated }: CreateTestFromBasketDialogProps) {
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState<BasketItem[]>(items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  const remove = (id: string) => setDraft((prev) => prev.filter((item) => item.id !== id));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Введіть назву нового тесту.');
      return;
    }
    if (draft.length === 0) {
      setError('Додайте хоча б одне питання.');
      return;
    }

    setSaving(true);
    try {
      await createTest({
        title: title.trim(),
        questions: draft.map((item) => item.question),
        scoringPreset: 'custom',
        timeLimitMinutes: null,
        topic: null,
      });
      onCreated(draft.map((item) => item.id));
    } catch {
      setError('Не вдалося створити тест. Спробуйте ще раз.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
        aria-label="Створити тест з обраного"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Створити тест з обраного</h2>
            <p className="mt-1 text-sm text-slate-500">Порядок питань можна змінити, зайві прибрати.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Назва нового тесту</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Контрольна з біології"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </label>

          <p className="mt-6 text-sm font-medium text-slate-700">Питання у тесті: {draft.length}</p>
          {draft.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Усі питання прибрано. Закрийте вікно, щоб повернути їх у кошик.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {draft.map((item, index) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-900">{item.question.prompt || 'Без тексту'}</p>
                    <p className="truncate text-xs text-slate-500">з тесту «{item.source_test_title}»</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white disabled:opacity-30"
                    aria-label="Перемістити вгору"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === draft.length - 1}
                    className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white disabled:opacity-30"
                    aria-label="Перемістити вниз"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Прибрати питання"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}

          {error && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={saving || draft.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Зберегти тест
          </button>
        </div>
      </form>
    </div>
  );
}
