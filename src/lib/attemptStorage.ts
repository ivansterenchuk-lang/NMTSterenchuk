import type { Answers, NotebookWork } from '@/types/test';

export type EndReason = 'manual' | 'time' | 'session_closed' | 'session_expired';

export interface SubmittedAttempt {
  score: number;
  maxScore: number;
  endReason: EndReason;
  submittedAt: string;
  saved: boolean;
  failedSends: number;
}

export interface StoredAttempt {
  deadline: number | null;
  seed: number;
  studentName: string;
  answers: Answers;
  notebooks: NotebookWork;
  submitted: SubmittedAttempt | null;
}

export function getAttemptKey(testId: string, sessionId: string | undefined): string {
  return `attempt:${testId}:${sessionId ?? 'practice'}`;
}

export function loadStoredAttempt(key: string): StoredAttempt | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAttempt;
  } catch {
    return null;
  }
}

export function persistAttempt(key: string, record: StoredAttempt): void {
  sessionStorage.setItem(key, JSON.stringify(record));
}
