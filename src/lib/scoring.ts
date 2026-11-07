import type { Question, ScoringPreset } from '@/types/test';

export const NMT_MATCHING_MAX_SCORE = 4;
export const NMT_TEST_MAX_SCORE = 54;
export const MAX_QUESTION_SCORE = 100;

export const SCORING_PRESET_OPTIONS: Record<ScoringPreset, { label: string; description: string }> = {
  nmt: {
    label: 'За стандартами НМТ (Історія України)',
    description: 'Завдання на відповідність оцінюються максимум у 4 бали. Для всього тесту очікується 54 бали.',
  },
  custom: {
    label: 'Власна система оцінювання',
    description: 'Ви самі вказуєте максимум балів для кожного питання.',
  },
};

export function getTestMaxScore(questions: Question[]): number {
  return questions.reduce((sum, question) => sum + question.maxScore, 0);
}
