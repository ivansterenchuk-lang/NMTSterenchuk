import { Check } from 'lucide-react';
import { SCORING_PRESET_OPTIONS } from '@/lib/scoring';
import type { ScoringPreset } from '@/types/test';

interface ScoringPresetPickerProps {
  value: ScoringPreset;
  onChange: (preset: ScoringPreset) => void;
}

const PRESETS = Object.keys(SCORING_PRESET_OPTIONS) as ScoringPreset[];

export default function ScoringPresetPicker({ value, onChange }: ScoringPresetPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700" id="scoring-preset-label">
        Система оцінювання
      </p>
      <div role="radiogroup" aria-labelledby="scoring-preset-label" className="mt-3 grid gap-3 md:grid-cols-2">
        {PRESETS.map((preset) => {
          const option = SCORING_PRESET_OPTIONS[preset];
          const selected = value === preset;
          return (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(preset)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
