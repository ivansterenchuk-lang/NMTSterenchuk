import { MAX_TIME_LIMIT_MINUTES } from '@/lib/countdown';

interface TimeLimitSettingsProps {
  enabled: boolean;
  minutes: string;
  onToggle: (enabled: boolean) => void;
  onMinutesChange: (minutes: string) => void;
}

const QUICK_MINUTES = [15, 30, 45, 60];

export default function TimeLimitSettings({ enabled, minutes, onToggle, onMinutesChange }: TimeLimitSettingsProps) {
  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700" id="time-limit-label">
            Обмеження часу на проходження
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Коли час вийде, тест відправиться автоматично з відповідями, які учень встиг дати.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="time-limit-label"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-teal-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="number"
                min={1}
                max={MAX_TIME_LIMIT_MINUTES}
                step={1}
                value={minutes}
                onChange={(e) => onMinutesChange(e.target.value)}
                className="w-28 rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              хвилин
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_MINUTES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onMinutesChange(String(value))}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    minutes === String(value)
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {value} хв
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
