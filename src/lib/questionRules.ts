import { getMatchingContentKey, getMatchingQuestionErrors, scoreMatchingQuestion } from '@/lib/matching';
import { MAX_QUESTION_SCORE } from '@/lib/scoring';
import type {
  Answers,
  MatchingQuestion,
  NotebookQuestion,
  NotebookReviews,
  NotebookWork,
  Question,
} from '@/types/test';

export function isMatchingQuestion(question: Question): question is MatchingQuestion {
  return question.type === 'matching';
}

export function isNotebookQuestion(question: Question): question is NotebookQuestion {
  return question.type === 'notebook';
}

export function getQuestionErrors(question: Question): string[] {
  if (isMatchingQuestion(question)) return getMatchingQuestionErrors(question);

  const errors: string[] = [];
  if (!question.prompt.trim()) {
    errors.push('Додайте текст завдання.');
  }
  if (!Number.isInteger(question.maxScore) || question.maxScore < 1 || question.maxScore > MAX_QUESTION_SCORE) {
    errors.push(`Максимальний бал за завдання має бути цілим числом від 1 до ${MAX_QUESTION_SCORE}.`);
  }
  return errors;
}

export function getQuestionContentKey(question: Question): string {
  if (isMatchingQuestion(question)) return getMatchingContentKey(question);
  return JSON.stringify(['notebook', question.prompt.trim()]);
}

export function scoreQuestion(
  question: Question,
  answers: Answers,
  reviews: NotebookReviews,
): { score: number; maxScore: number } {
  if (isMatchingQuestion(question)) return scoreMatchingQuestion(question, answers[question.id]);
  return { score: reviews[question.id]?.score ?? 0, maxScore: question.maxScore };
}

export function isQuestionAnswered(question: Question, answers: Answers, work: NotebookWork): boolean {
  if (isMatchingQuestion(question)) {
    return question.leftItems.every((left) => Boolean(answers[question.id]?.[left.id]));
  }
  return (work[question.id]?.strokes.length ?? 0) > 0;
}
