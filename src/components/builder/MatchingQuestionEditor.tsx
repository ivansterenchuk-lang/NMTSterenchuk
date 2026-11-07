import { Plus, Trash2 } from 'lucide-react';
import MatchingScoringSettings from '@/components/builder/MatchingScoringSettings';
import {
  MAX_MATCHING_ITEMS,
  createItemId,
  getLeftLabel,
  getMatchingQuestionErrors,
  getRightLabel,
} from '@/lib/matching';
import type { MatchingQuestion, ScoringPreset } from '@/types/test';

interface MatchingQuestionEditorProps {
  question: MatchingQuestion;
  index: number;
  scoringPreset: ScoringPreset;
  onChange: (question: MatchingQuestion) => void;
  onRemove: () => void;
}

export default function MatchingQuestionEditor({
  question,
  index,
  scoringPreset,
  onChange,
  onRemove,
}: MatchingQuestionEditorProps) {
  const errors = getMatchingQuestionErrors(question);

  const updateLeftText = (id: string, text: string) =>
    onChange({
      ...question,
      leftItems: question.leftItems.map((item) => (item.id === id ? { ...item, text } : item)),
    });

  const updateRightText = (id: string, text: string) =>
    onChange({
      ...question,
      rightItems: question.rightItems.map((item) => (item.id === id ? { ...item, text } : item)),
    });

  const addLeftItem = () =>
    onChange({
      ...question,
      leftItems: [...question.leftItems, { id: createItemId(), text: '' }],
    });

  const addRightItem = () =>
    onChange({
      ...question,
      rightItems: [...question.rightItems, { id: createItemId(), text: '' }],
    });

  const removeLeftItem = (id: string) => {
    const correctPairs = Object.fromEntries(
      Object.entries(question.correctPairs).filter(([leftId]) => leftId !== id),
    );
    onChange({
      ...question,
      leftItems: question.leftItems.filter((item) => item.id !== id),
      correctPairs,
    });
  };

  const removeRightItem = (id: string) => {
    const correctPairs = Object.fromEntries(
      Object.entries(question.correctPairs).filter(([, rightId]) => rightId !== id),
    );
    onChange({
      ...question,
      rightItems: question.rightItems.filter((item) => item.id !== id),
      correctPairs,
    });
  };

  const setPair = (leftId: string, rightId: string) => {
    const correctPairs = { ...question.correctPairs };
    if (rightId) {
      correctPairs[leftId] = rightId;
    } else {
      delete correctPairs[leftId];
    }
    onChange({ ...question, correctPairs });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-medium text-teal-700">Встановлення відповідності</p>
            <p className="text-xs text-slate-500">Учень з'єднує елементи лівої колонки з правою</p>
          </div>
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
        <input
          type="text"
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          placeholder="Наприклад: Установіть відповідність між країною та столицею"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </label>

      <MatchingScoringSettings question={question} scoringPreset={scoringPreset} onChange={onChange} />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Ліва колонка</h4>
            <span className="text-xs text-slate-500">
              {question.leftItems.length} / {MAX_MATCHING_ITEMS}
            </span>
          </div>
          <div className="space-y-3">
            {question.leftItems.map((item, i) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    {getLeftLabel(i)}
                  </span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateLeftText(item.id, e.target.value)}
                    placeholder="Текст елемента"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeLeftItem(item.id)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Видалити елемент"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <label className="mt-2 flex items-center gap-2 pl-9">
                  <span className="shrink-0 text-xs text-slate-500">Правильна відповідь:</span>
                  <select
                    value={question.correctPairs[item.id] ?? ''}
                    onChange={(e) => setPair(item.id, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">Не вибрано</option>
                    {question.rightItems.map((right, j) => (
                      <option key={right.id} value={right.id}>
                        {getRightLabel(j)}. {right.text || '(без тексту)'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLeftItem}
            disabled={question.leftItems.length >= MAX_MATCHING_ITEMS}
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Додати елемент
          </button>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Права колонка</h4>
            <span className="text-xs text-slate-500">
              {question.rightItems.length} / {MAX_MATCHING_ITEMS}
            </span>
          </div>
          <div className="space-y-3">
            {question.rightItems.map((item, j) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  {getRightLabel(j)}
                </span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateRightText(item.id, e.target.value)}
                  placeholder="Текст відповіді"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => removeRightItem(item.id)}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Видалити відповідь"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRightItem}
            disabled={question.rightItems.length >= MAX_MATCHING_ITEMS}
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <Plus className="h-4 w-4" />
            Додати відповідь
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Зайві відповіді (без пари) допускаються і зроблять завдання складнішим.
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="mt-6 space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
