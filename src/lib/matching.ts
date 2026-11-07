import type { MatchingAnswer, MatchingQuestion } from '@/types/test';
import { MAX_QUESTION_SCORE } from '@/lib/scoring';

export const MAX_MATCHING_ITEMS = 10;

export function createItemId(): string {
  return crypto.randomUUID();
}

const RIGHT_LABELS = 'АБВГҐДЕЄЖЗИІЇКЛМНОПРСТУФХЦЧШЩЮЯ';

export function getLeftLabel(index: number): string {
  return String(index + 1);
}

export function getRightLabel(index: number): string {
  return RIGHT_LABELS[index] ?? String(index + 1);
}

export function getMatchingQuestionErrors(question: MatchingQuestion): string[] {
  const errors: string[] = [];

  if (!question.prompt.trim()) {
    errors.push('Додайте текст завдання.');
  }

  if (question.leftItems.length < 1) {
    errors.push('Додайте хоча б один елемент у ліву колонку.');
  }

  if (question.rightItems.length < question.leftItems.length) {
    errors.push('У правій колонці має бути не менше елементів, ніж у лівій.');
  }

  if (question.leftItems.some((item) => !item.text.trim()) || question.rightItems.some((item) => !item.text.trim())) {
    errors.push('Заповніть текст у всіх елементах колонок.');
  }

  if (!Number.isInteger(question.maxScore) || question.maxScore < 1 || question.maxScore > MAX_QUESTION_SCORE) {
    errors.push(`Максимальний бал за завдання має бути цілим числом від 1 до ${MAX_QUESTION_SCORE}.`);
  }

  const rightIds = new Set(question.rightItems.map((item) => item.id));
  const usedRightIds = new Set<string>();
  for (const left of question.leftItems) {
    const rightId = question.correctPairs[left.id];
    if (!rightId || !rightIds.has(rightId)) {
      errors.push(`Для елемента ${getLeftLabel(question.leftItems.indexOf(left))} не вибрано правильну відповідь.`);
    } else if (usedRightIds.has(rightId)) {
      errors.push('Одна й та сама відповідь не може бути правильною для двох елементів.');
    } else {
      usedRightIds.add(rightId);
    }
  }

  return errors;
}

export function getMatchingContentKey(question: MatchingQuestion): string {
  const rightTextById = new Map<string, string>(
    question.rightItems.map((item) => [item.id, item.text.trim()]),
  );
  return JSON.stringify([
    question.prompt.trim(),
    question.leftItems.map((left) => [left.text.trim(), rightTextById.get(question.correctPairs[left.id]) ?? null]),
  ]);
}

export function scoreMatchingQuestion(
  question: MatchingQuestion,
  answer: MatchingAnswer | undefined,
): { score: number; maxScore: number } {
  const total = question.leftItems.length;
  const correct = question.leftItems.filter((left) => {
    const chosen = answer?.[left.id];
    return chosen !== undefined && chosen === question.correctPairs[left.id];
  }).length;

  if (question.scoringMode === 'all_or_nothing') {
    return { score: total > 0 && correct === total ? question.maxScore : 0, maxScore: question.maxScore };
  }

  const score = total > 0 ? Math.round((correct * question.maxScore) / total) : 0;
  return { score, maxScore: question.maxScore };
}
