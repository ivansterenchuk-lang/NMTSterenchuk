import { Loader2, Radio } from 'lucide-react';
import { formatCountdown } from '@/lib/countdown';
import { navigate } from '@/lib/router';
import { getSessionState } from '@/lib/sessionExpiry';
import type { Session } from '@/types/test';

const SOON_THRESHOLD_MS = 10 * 60_000;

interface SessionListItemProps {
  session: Session;
  testTitle: string;
  now: number;
  closing: boolean;
  onClose: (session: Session) => void;
}

function formatClosesAt(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionListItem({ session, testTitle, now, closing, onClose }: SessionListItemProps) {
  const state = getSessionState(session, now);
  const remainingMs = session.expires_at ? Date.parse(session.expires_at) - now : null;

  let badgeClass = 'bg-slate-100 text-slate-600';
  let statusText = 'Завершена';
  if (state === 'expired') {
    statusText = 'Термін минув';
  } else if (state === 'open' && remainingMs === null) {
    badgeClass = 'bg-teal-50 text-teal-800';
    statusText = 'Відкрита · без обмежень';
  } else if (state === 'open' && remainingMs !== null) {
    badgeClass = remainingMs <= SOON_THRESHOLD_MS ? 'bg-amber-50 text-amber-800' : 'bg-teal-50 text-teal-800';
    statusText = `Відкрита · лишилось ${formatCountdown(remainingMs)}`;
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="truncate text-base font-semibold text-slate-900">{testTitle}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-semibold tracking-widest text-slate-800">
            {session.code}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${badgeClass}`}>{statusText}</span>
          {session.expires_at && state !== 'closed' && (
            <span className="text-xs text-slate-500">до {formatClosesAt(session.expires_at)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/sessions/${session.id}`)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <Radio className="h-4 w-4" />
          Відкрити панель
        </button>
        {state === 'open' && (
          <button
            type="button"
            onClick={() => onClose(session)}
            disabled={closing}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {closing && <Loader2 className="h-4 w-4 animate-spin" />}
            Завершити сесію
          </button>
        )}
      </div>
    </li>
  );
}
