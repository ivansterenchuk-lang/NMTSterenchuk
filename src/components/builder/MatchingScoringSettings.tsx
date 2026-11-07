import { NMT_MATCHING_MAX_SCORE, MAX_QUESTION_SCORE } from '@/lib/scoring';
import type { MatchingQuestion, ScoringMode, ScoringPreset } from '@/types/test';

interface MatchingScoringSettingsProps {
  question: MatchingQuestion;
  scoringPreset: ScoringPreset;
  onChange: (question: MatchingQuestion) => void;
}

const SCORING_MODES: { value: ScoringMode; label: string }[] = [
  { value: 'partial', label: 'Часткове нарахування за кожний правильний елемент' },
  { value: 'all_or_nothing', label: 'Бал нараховується тільки за 100% правильну відповідь' },
];

export default function MatchingScoringSettings({ question, scoringPreset, onChange }: MatchingScoringSettingsProps) {
  const isNmt = scoringPreset === 'nmt';

  return (
    <div className="mt-6 grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-2">
      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Максимальний бал за завдання</span>
          {isNmt ? (
            <p className="mt-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
              {NMT_MATCHING_MAX_SCORE} бали (за стандартом НМТ)
            </p>
          ) : (
            <input
              type="number"
              min={1}
              max={MAX_QUESTION_SCORE}
              step={1}
              value={question.maxScore}
              onChange={(e) => onChange({ ...question, maxScore: Number(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          )}
        </label>
        {question.scoringMode === 'partial' && (
          <p className="mt-2 text-xs text-slate-500">Бали округлюються до цілого числа.</p>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Як нараховувати бали</legend>
        <div className="mt-2 space-y-2">
          {SCORING_MODES.map((mode) => (
            <label
              key={mode.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <input
                type="radio"
                name={`scoring-mode-${question.id}`}
                value={mode.value}
                checked={question.scoringMode === mode.value}
                onChange={() => onChange({ ...question, scoringMode: mode.value })}
                className="mt-0.5 h-4 w-4 accent-teal-600"
              />
              <span>{mode.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
