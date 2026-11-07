import { useState } from 'react';
import { Check, Copy, Loader2, Power } from 'lucide-react';
import { setSessionActive } from '@/lib/sessionRepository';
import type { Session } from '@/types/test';

interface SessionPanelProps {
  session: Session;
  onChange: (session: Session) => void;
}

export default function SessionPanel({ session, onChange }: SessionPanelProps) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${session.code}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Не вдалося скопіювати посилання. Скопіюйте його вручну.');
    }
  };

  const toggleActive = async () => {
    setError(null);
    setToggling(true);
    try {
      await setSessionActive(session.id, !session.is_active);
      onChange({ ...session, is_active: !session.is_active });
    } catch {
      setError('Не вдалося змінити стан сесії. Спробуйте ще раз.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-800">Код сесії для учнів</p>
          <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.3em] text-slate-900">{session.code}</p>
          <p className="mt-2 text-sm text-slate-600">
            {session.is_active ? 'Учні можуть приєднатися за кодом або посиланням.' : 'Прийом відповідей зупинено.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 md:w-96">
            <span className="min-w-0 flex-1 truncate px-2 text-sm text-slate-600">{joinUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Скопійовано' : 'Копіювати'}
            </button>
          </div>
          <button
            type="button"
            onClick={toggleActive}
            disabled={toggling}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white disabled:opacity-60"
          >
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            {session.is_active ? 'Зупинити прийом відповідей' : 'Відкрити прийом знову'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
