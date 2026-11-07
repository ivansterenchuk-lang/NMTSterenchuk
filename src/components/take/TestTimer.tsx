import { Timer } from 'lucide-react';
import { formatCountdown } from '@/lib/countdown';

interface TestTimerProps {
  remainingMs: number;
}

const LOW_TIME_MS = 60_000;

export default function TestTimer({ remainingMs }: TestTimerProps) {
  const low = remainingMs <= LOW_TIME_MS;
  return (
    <div
      role="timer"
      aria-label={`Залишилось ${formatCountdown(remainingMs)}`}
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-colors ${
        low ? 'animate-pulse bg-red-600 text-white' : 'bg-slate-900 text-white'
      }`}
    >
      <Timer className="h-4 w-4" />
      <span>Залишилось</span>
      <span className="tabular-nums">{formatCountdown(remainingMs)}</span>
    </div>
  );
}
