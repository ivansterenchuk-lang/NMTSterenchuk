import { SUBJECTS, type Question, type SubjectId } from './nmt';

export type PublicTest = {
  id: string;
  title: string;
  author: string;
  subject: SubjectId;
  tags: string[];
  updated: string;
  questions: Question[];
  isOwn?: boolean;
};

export const normalize = (s: string): string =>
  s.toLowerCase().replace(/[’ʼ`´‘]/g, "'").replace(/\s+/g, ' ').trim();

export const tokenize = (q: string): string[] => normalize(q).split(' ').filter(Boolean);

// Код сесії без дефісів, пробілів та регістру: «NMT-1234» == «nmt1234»
export const stripCode = (s: string): string => s.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/g, '');

// ---------- Пошук сесій ----------
export interface SessionLike {
  id: string;
  title: string;
  tag: string;
}

export function sessionMatches(s: SessionLike, query: string): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const hay = normalize(`${s.id} ${s.title} ${s.tag}`);
  const code = stripCode(s.id);
  return tokens.every(t => {
    const c = stripCode(t);
    return hay.includes(t) || (c.length > 0 && code.includes(c));
  });
}

// Менше число — вище в списку: точний код, початок коду, частина коду, решта
export function sessionRank(s: SessionLike, query: string): number {
  const q = stripCode(query);
  const code = stripCode(s.id);
  if (!q) return 3;
  if (code === q) return 0;
  if (code.startsWith(q)) return 1;
  if (code.includes(q)) return 2;
  return 3;
}

// ---------- Пошук тестів ----------
export function questionText(q: Question): string {
  const parts: string[] = [q.title, q.passage ?? ''];
  switch (q.kind) {
    case 'single':
    case 'multi':
      parts.push(...q.options);
      break;
    case 'matching':
      parts.push(...q.rows, ...q.cols);
      break;
    case 'sequence':
      parts.push(...q.items);
      break;
    case 'open':
      parts.push(...q.answers);
      break;
  }
  return parts.join(' ');
}

export interface TestHit {
  test: PublicTest;
  score: number;
  snippets: Question[]; // найкращі питання-збіги
  matchedCount: number;
}

export function searchTests(tests: PublicTest[], query: string, subject: SubjectId | 'all'): TestHit[] {
  const tokens = tokenize(query);
  const hits: TestHit[] = [];

  for (const test of tests) {
    if (subject !== 'all' && test.subject !== subject) continue;

    if (tokens.length === 0) {
      hits.push({ test, score: 0, snippets: [], matchedCount: 0 });
      continue;
    }

    const title = normalize(test.title);
    const head = normalize(`${test.title} ${test.author} ${test.tags.join(' ')} ${SUBJECTS[test.subject].label}`);
    const qTexts = test.questions.map(q => normalize(questionText(q)));
    const all = `${head} ${qTexts.join(' ')}`;

    // кожне слово запиту має зустрітися десь у тесті
    if (!tokens.every(t => all.includes(t))) continue;

    let score = 0;
    for (const t of tokens) {
      if (title.includes(t)) score += 10;
      if (head.includes(t)) score += 4;
      score += qTexts.filter(x => x.includes(t)).length;
    }

    const scored = test.questions
      .map((q, i) => ({ q, n: tokens.filter(t => qTexts[i].includes(t)).length }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n);

    hits.push({
      test,
      score,
      snippets: scored.slice(0, 3).map(x => x.q),
      matchedCount: scored.length
    });
  }

  return hits.sort((a, b) => b.score - a.score);
}