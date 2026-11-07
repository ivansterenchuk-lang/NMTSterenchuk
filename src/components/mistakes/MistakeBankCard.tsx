import { Plus } from 'lucide-react';
import { getLeftLabel, getRightLabel } from '@/lib/matching';
import type { MistakeBankEntry } from '@/lib/mistakeBank';
import type { MatchingQuestion } from '@/types/test';

interface MistakeBankCardProps {
  entry: MistakeBankEntry;
  index: number;
  onAdd: () => void;
}

function getRightIndexMap(question: MatchingQuestion): Record<string, number> {
  return Object.fromEntries(question.rightItems.map((item, j) => [item.id, j]));
}

export default function MistakeBankCard({ entry, index, onAdd }: MistakeBankCardProps) {
  const { question } = entry;
  const rightIndexById = getRightIndexMap(question);
  const rightTextById = Object.fromEntries(question.rightItems.map((item) => [item.id, item.text]));
  const wrongPercent = Math.round((entry.wrongCount / entry.answeredCount) * 100);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Питання {index + 1} · {entry.testTitle}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{question.prompt || 'Без тексту завдання'}</h3>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
          Помилок: {entry.wrongCount} з {entry.answeredCount} ({wrongPercent}%)
        </span>
      </div>

      <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
        {question.leftItems.map((left, i) => {
          const correctId = question.correctPairs[left.id];
          const correctText = rightTextById[correctId] ?? '';
          const correctLabel = getRightLabel(rightIndexById[correctId] ?? 0);
          return (
            <li key={left.id} className="flex flex-wrap items-baseline gap-x-2 px-4 py-2.5 text-slate-700">
              <span className="font-semibold text-slate-900">
                {getLeftLabel(i)}. {left.text}
              </span>
              <span className="text-slate-400">→</span>
              <span>
                {correctLabel}. {correctText}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Додати до сесії або тесту
        </button>
      </div>
    </li>
  );
}
