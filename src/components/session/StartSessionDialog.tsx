import { useState } from 'react';
import { Loader2, Radio, X } from 'lucide-react';
import {
  SESSION_DURATION_OPTIONS,
  getPresetExpiresAt,
  toDateTimeLocalValue,
  type SessionDurationKey,
} from '@/lib/sessionExpiry';
import type { SessionShuffleOptions } from '@/types/test';

interface StartSessionDialogProps {
  testTitle: string;
  busy: boolean;
  onConfirm: (expiresAt: string | null, shuffle: SessionShuffleOptions) => void;
  onClose: () => void;
}

export default function StartSessionDialog({ testTitle, busy, onConfirm, onClose }: StartSessionDialogProps) {
  const [duration, setDuration] = useState<SessionDurationKey>('unlimited');
  const [customValue, setCustomValue] = useState(() => toDateTimeLocalValue(new Date(Date.now() + 60 * 60_000)));
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minCustomValue = toDateTimeLocalValue(new Date());
  const shuffle = { shuffleQuestions, shuffleOptions };

  const handleConfirm = () => {
    if (duration !== 'custom') {
      setError(null);
      onConfirm(getPresetExpiresAt(duration), shuffle);
      return;
    }
    const closesAt = new Date(customValue);
    if (!customValue || Number.isNaN(closesAt.getTime()) || closesAt.getTime() <= Date.now()) {
      setError('Оберіть дату і час у майбутньому.');
      return;
    }
    setError(null);
    onConfirm(closesAt.toISOString(), shuffle);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-session-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-teal-700">Нова сесія</p>
            <h2 id="start-session-title" className="mt-1 truncate text-xl font-semibold text-slate-900">
              {testTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-slate-700">Скільки часу сесія буде відкрита для учнів</legend>
          <div className="mt-3 space-y-2">
            {SESSION_DURATION_OPTIONS.map((option) => {
              const selected = duration === option.key;
              return (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    selected ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="session-duration"
                    value={option.key}
                    checked={selected}
                    onChange={() => setDuration(option.key)}
                    className="h-4 w-4 accent-teal-600"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {duration === 'custom' && (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Сесія закриється</span>
            <input
              type="datetime-local"
              value={customValue}
              min={minCustomValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
        )}

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-slate-700">Захист від списування</legend>
          <div className="mt-3 space-y-2">
            <ShuffleToggle
              label="Випадковий порядок питань"
              description="Кожен учень бачить питання у своєму порядку"
              checked={shuffleQuestions}
              onChange={setShuffleQuestions}
            />
            <ShuffleToggle
              label="Перемішувати варіанти відповідей"
              description="Елементи обох колонок у кожного учня стоять по-різному"
              checked={shuffleOptions}
              onChange={setShuffleOptions}
            />
          </div>
        </fieldset>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
            Розпочати сесію
          </button>
        </div>
      </div>
    </div>
  );
}

interface ShuffleToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ShuffleToggle({ label, description, checked, onChange }: ShuffleToggleProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
        checked ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-teal-600"
      />
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
    </label>
  );
}
