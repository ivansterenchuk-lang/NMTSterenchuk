import { scoreMatchingQuestion } from '@/lib/matching';
import { isMatchingQuestion } from '@/lib/questionRules';
import type { MatchingQuestion, Test, TestAttempt } from '@/types/test';

export interface MistakeBankEntry {
  key: string;
  testId: string;
  testTitle: string;
  question: MatchingQuestion;
  answeredCount: number;
  wrongCount: number;
}

export function buildMistakeBank(tests: Test[], attempts: TestAttempt[]): MistakeBankEntry[] {
  const testsById = new Map(tests.map((test) => [test.id, test]));
  const entries = new Map<string, MistakeBankEntry>();

  for (const attempt of attempts) {
    const test = testsById.get(attempt.test_id);
    if (!test) continue;

    for (const question of test.questions) {
      if (!isMatchingQuestion(question)) continue;
      const { score, maxScore } = scoreMatchingQuestion(question, attempt.answers[question.id]);
      const key = `${test.id}:${question.id}`;
      const entry = entries.get(key) ?? {
        key,
        testId: test.id,
        testTitle: test.title,
        question,
        answeredCount: 0,
        wrongCount: 0,
      };
      entry.answeredCount += 1;
      if (score < maxScore) entry.wrongCount += 1;
      entries.set(key, entry);
    }
  }

  return [...entries.values()]
    .filter((entry) => entry.wrongCount > 0)
    .sort((a, b) => b.wrongCount / b.answeredCount - a.wrongCount / a.answeredCount);
}
