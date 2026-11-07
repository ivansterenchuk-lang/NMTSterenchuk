import type { Session } from '@/types/test';

export type PresetDuration = 'unlimited' | 'hour' | 'end_of_day' | 'day';
export type SessionDurationKey = PresetDuration | 'custom';

export const SESSION_DURATION_OPTIONS: { key: SessionDurationKey; label: string }[] = [
  { key: 'unlimited', label: 'Без обмежень (закрити вручну)' },
  { key: 'hour', label: '1 година' },
  { key: 'end_of_day', label: 'До кінця дня' },
  { key: 'day', label: '24 години' },
  { key: 'custom', label: 'Точна дата і час' },
];

export type SessionState = 'open' | 'expired' | 'closed';

export function getPresetExpiresAt(key: PresetDuration, now: Date = new Date()): string | null {
  switch (key) {
    case 'unlimited':
      return null;
    case 'hour':
      return new Date(now.getTime() + 60 * 60_000).toISOString();
    case 'day':
      return new Date(now.getTime() + 24 * 60 * 60_000).toISOString();
    case 'end_of_day': {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.toISOString();
    }
  }
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getSessionState(session: Pick<Session, 'is_active' | 'expires_at'>, now: number): SessionState {
  if (!session.is_active) return 'closed';
  if (session.expires_at && Date.parse(session.expires_at) <= now) return 'expired';
  return 'open';
}
