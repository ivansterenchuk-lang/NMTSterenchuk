export type QuestionType = 'single' | 'multiple' | 'matching' | 'sequence';

// Список предметів
export const SUBJECTS = [
  'Історія України',
  'Всесвітня історія',
  'Правознавство',
  'Математика',
  'Українська мова',
  'Українська література',
  'Біологія',
  'Географія',
  'Фізика',
  'Хімія',
  'Англійська мова'
];

// Словник для типів питань
export const KIND_LABELS: Record<string, string> = {
  single: 'Одна правильна відповідь',
  multiple: 'Кілька правильних відповідей',
  matching: 'Встановлення відповідності',
  sequence: 'Встановлення послідовності'
};

// Варіант відповіді для звичайних тестів
export type Option = {
  text: string;
  isCorrect: boolean;
  image?: string; // ДОДАНО: підтримка зображень для варіантів
};

// Елемент для відповідності та послідовності (може мати текст та картинку)
export type RichItem = {
  text: string;
  image?: string;
};

export type Question = {
  id: number;
  subject: string;
  text: string;
  image?: string; // ДОДАНО: підтримка зображень для самого питання
  type?: QuestionType;
  
  // Для звичайних та множинних тестів
  options?: Option[];
  
  // Для відповідності (підтримує як старі рядки, так і нові об'єкти з картинками)
  leftColumn?: (string | RichItem)[];
  rightColumn?: (string | RichItem)[];
  correctMatches?: Record<number, string>;
  
  // Для послідовності (підтримує як старі рядки, так і нові об'єкти з картинками)
  sequenceItems?: (string | RichItem)[];
  
  comment?: string;
};

// Функція для перемішування варіантів (поки що просто повертає копію)
export const makeDisplayOrder = <T,>(items: T[]): T[] => {
  return [...items];
};

// Функція для розрахунку максимального балу за питання
export const maxPoints = (q: Question): number => {
  if (q.type === 'matching' && q.leftColumn) return q.leftColumn.length;
  if (q.type === 'sequence' && q.sequenceItems) return q.sequenceItems.length;
  return 1; // За замовчуванням 1 бал
};
export type Answer = any;