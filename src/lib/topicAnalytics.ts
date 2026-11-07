import type { Test, TestAttempt } from '@/types/test';

export const WEAK_TOPIC_PERCENT = 60;
export const UNTITLED_TOPIC = 'Без теми';

export interface TestMastery {
  testId: string;
  title: string;
  attempts: number;
  percent: number | null;
}

export interface TopicMastery {
  topic: string;
  attempts: number;
  percent: number | null;
  isWeak: boolean;
  tests: TestMastery[];
}

interface Totals {
  score: number;
  maxScore: number;
  attempts: number;
}

function addAttempt(totals: Totals, attempt: TestAttempt): Totals {
  return {
    score: totals.score + attempt.score,
    maxScore: totals.maxScore + attempt.max_score,
    attempts: totals.attempts + 1,
  };
}

function toPercent(totals: Totals): number | null {
  if (totals.attempts === 0 || totals.maxScore <= 0) return null;
  return Math.round((totals.score / totals.maxScore) * 100);
}

export function buildTopicMastery(tests: Test[], attempts: TestAttempt[]): TopicMastery[] {
  const attemptsByTest = new Map<string, TestAttempt[]>();
  for (const attempt of attempts) {
    const list = attemptsByTest.get(attempt.test_id) ?? [];
    list.push(attempt);
    attemptsByTest.set(attempt.test_id, list);
  }

  const topics = new Map<string, { totals: Totals; tests: TestMastery[] }>();
  for (const test of tests) {
    const topic = test.topic?.trim() || UNTITLED_TOPIC;
    const entry = topics.get(topic) ?? { totals: { score: 0, maxScore: 0, attempts: 0 }, tests: [] };

    const testAttempts = attemptsByTest.get(test.id) ?? [];
    const testTotals = testAttempts.reduce(addAttempt, { score: 0, maxScore: 0, attempts: 0 });
    entry.totals = {
      score: entry.totals.score + testTotals.score,
      maxScore: entry.totals.maxScore + testTotals.maxScore,
      attempts: entry.totals.attempts + testTotals.attempts,
    };
    entry.tests.push({
      testId: test.id,
      title: test.title,
      attempts: testTotals.attempts,
      percent: toPercent(testTotals),
    });
    topics.set(topic, entry);
  }

  return Array.from(topics, ([topic, entry]) => {
    const percent = toPercent(entry.totals);
    return {
      topic,
      attempts: entry.totals.attempts,
      percent,
      isWeak: percent !== null && percent < WEAK_TOPIC_PERCENT,
      tests: entry.tests,
    };
  }).sort((a, b) => {
    if (a.percent === null) return 1;
    if (b.percent === null) return -1;
    return a.percent - b.percent;
  });
}
