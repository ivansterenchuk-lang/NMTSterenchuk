import { Check, X } from 'lucide-react';
import { getLeftLabel, getRightLabel, scoreMatchingQuestion } from '@/lib/matching';
import type { MatchingAnswer, MatchingQuestion } from '@/types/test';

interface MatchingQuestionInputProps {
  question: MatchingQuestion;
  index: number;
  answer: MatchingAnswer;
  onSelect: (leftId: string, rightId: string) => void;
  review: boolean;
  disabled: boolean;
}

export default function MatchingQuestionInput({
  question,
  index,
  answer,
  onSelect,
  review,
  disabled,
}: MatchingQuestionInputProps) {
  const { score, maxScore } = scoreMatchingQuestion(question, answer);
  const rightLabelById = Object.fromEntries(
    question.rightItems.map((item, j) => [item.id, getRightLabel(j)]),
  );
  const rightTextById = Object.fromEntries(question.rightItems.map((item) => [item.id, item.text]));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">Встановлення відповідності</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            {question.prompt || 'Установіть відповідність'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Для кожного номера оберіть відповідну літеру. Кожна літера використовується один раз.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Елемент</th>
              <th className="px-4 py-3 font-semibold">Ваша відповідь</th>
              {review && <th className="px-4 py-3 font-semibold">Результат</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {question.leftItems.map((left, i) => {
              const selected = answer[left.id] ?? '';
              const isCorrect = review && selected !== '' && selected === question.correctPairs[left.id];
              const correctLabel = rightLabelById[question.correctPairs[left.id]];
              const correctText = rightTextById[question.correctPairs[left.id]];

              return (
                <tr key={left.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-semibold text-slate-700">
                        {getLeftLabel(i)}
                      </span>
                      <span className="text-slate-900">{left.text}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={selected}
                      disabled={disabled}
                      onChange={(e) => onSelect(left.id, e.target.value)}
                      aria-label={`Відповідь для елемента ${getLeftLabel(i)}`}
                      className="w-full min-w-[12rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50 disabled:text-slate-600"
                    >
                      <option value="">Оберіть літеру</option>
                      {question.rightItems.map((right, j) => {
                        const takenByOther = Object.entries(answer).some(
                          ([leftId, rightId]) => leftId !== left.id && rightId === right.id,
                        );
                        return (
                          <option key={right.id} value={right.id} disabled={takenByOther}>
                            {getRightLabel(j)}. {right.text}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  {review && (
                    <td className="px-4 py-3">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                          Правильно
                        </span>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          <X className="h-3.5 w-3.5" />
                          Правильна відповідь: {correctLabel}. {correctText}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {review && (
        <p className="mt-4 text-sm font-medium text-slate-700">
          Бали за питання: {score} з {maxScore}
        </p>
      )}
    </section>
  );
}
