import { createItemId, getMatchingQuestionErrors, MAX_MATCHING_ITEMS } from '@/lib/matching';
import { NMT_MATCHING_MAX_SCORE } from '@/lib/scoring';
import type { MatchingItem, MatchingQuestion, ScoringPreset } from '@/types/test';

export interface ImportedQuestions {
  questions: MatchingQuestion[];
  errors: string[];
}

export interface ImportRecord {
  prompt: string;
  left: string;
  right: string;
  line: number;
}

const PROMPT_LINE = /^питання\s*[:.]\s*(.+)$/i;
const PAIR_WITH_PIPE = /^(.*?)\s*\|\s*(.+)$/;
const PAIR_WITH_DASH = /^(.*?)\s+[-–]\s+(.+)$/;
const DISTRACTOR_LINE = /^[-–]\s*(.+)$/;
const CSV_HEADER_PROMPT = /^питання$/i;

export async function readImportFile(file: File, scoringPreset: ScoringPreset): Promise<ImportedQuestions> {
  const text = await file.text();
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  return buildQuestions(isCsv ? parseCsvText(text) : parseTextFormat(text), scoringPreset);
}

export function parseTextFormat(text: string): ImportRecord[] {
  let prompt = '';
  const records: ImportRecord[] = [];

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    const lineNumber = index + 1;

    const promptMatch = line.match(PROMPT_LINE);
    if (promptMatch) {
      prompt = promptMatch[1].trim();
      return;
    }

    const distractorMatch = line.match(DISTRACTOR_LINE);
    if (distractorMatch) {
      records.push({ prompt, left: '', right: distractorMatch[1].trim(), line: lineNumber });
      return;
    }

    const pairMatch = line.match(line.includes('|') ? PAIR_WITH_PIPE : PAIR_WITH_DASH);
    if (pairMatch) {
      records.push({ prompt, left: pairMatch[1].trim(), right: pairMatch[2].trim(), line: lineNumber });
      return;
    }

    records.push({ prompt, left: '', right: '', line: lineNumber });
  });

  return records;
}

export function parseCsvText(text: string): ImportRecord[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  let prompt = '';
  const records: ImportRecord[] = [];

  lines.forEach((line, index) => {
    const [cellPrompt = '', left = '', right = ''] = parseCsvLine(line, delimiter).map((cell) => cell.trim());
    if (index === 0 && CSV_HEADER_PROMPT.test(cellPrompt)) return;
    if (cellPrompt) prompt = cellPrompt;
    records.push({ prompt, left, right, line: index + 1 });
  });

  return records;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

interface PromptGroup {
  prompt: string;
  records: ImportRecord[];
}

function groupByPrompt(records: ImportRecord[], errors: string[]): PromptGroup[] {
  const groups: PromptGroup[] = [];
  for (const record of records) {
    if (!record.left && !record.right) {
      errors.push(`Рядок ${record.line} не розпізнано. Очікується формат «ліво - право».`);
      continue;
    }
    const existing = groups.find((group) => group.prompt === record.prompt);
    if (existing) {
      existing.records.push(record);
    } else {
      groups.push({ prompt: record.prompt, records: [record] });
    }
  }
  return groups;
}

export function buildQuestions(records: ImportRecord[], scoringPreset: ScoringPreset): ImportedQuestions {
  const errors: string[] = [];
  const questions: MatchingQuestion[] = [];

  for (const { prompt, records: group } of groupByPrompt(records, errors)) {
    const label = prompt ? `«${prompt.slice(0, 40)}»` : `у рядку ${group[0].line}`;
    if (!prompt) {
      errors.push(`Питання ${label}: не вказано текст питання.`);
      continue;
    }

    const leftItems: MatchingItem[] = [];
    const rightItems: MatchingItem[] = [];
    const rightIdByText = new Map<string, string>();
    const rightTextByLeft = new Map<string, string>();
    let hasConflict = false;

    for (const record of group) {
      if (record.right && !rightIdByText.has(record.right)) {
        const id = createItemId();
        rightIdByText.set(record.right, id);
        rightItems.push({ id, text: record.right });
      }
      if (!record.left) continue;

      const previousRight = rightTextByLeft.get(record.left);
      if (previousRight === undefined) {
        leftItems.push({ id: createItemId(), text: record.left });
        rightTextByLeft.set(record.left, record.right);
      } else if (previousRight !== record.right) {
        errors.push(`Питання ${label}: елемент «${record.left}» має дві різні правильні відповіді.`);
        hasConflict = true;
        break;
      }
    }
    if (hasConflict) continue;

    if (leftItems.length > MAX_MATCHING_ITEMS || rightItems.length > MAX_MATCHING_ITEMS) {
      errors.push(`Питання ${label}: у колонці більше ${MAX_MATCHING_ITEMS} елементів.`);
      continue;
    }

    const correctPairs: Record<string, string> = {};
    leftItems.forEach((left) => {
      correctPairs[left.id] = rightIdByText.get(rightTextByLeft.get(left.text) ?? '') ?? '';
    });

    const question: MatchingQuestion = {
      id: createItemId(),
      type: 'matching',
      prompt,
      leftItems,
      rightItems,
      correctPairs,
      maxScore: scoringPreset === 'nmt' ? NMT_MATCHING_MAX_SCORE : 1,
      scoringMode: 'partial',
    };

    const questionErrors = getMatchingQuestionErrors(question);
    if (questionErrors.length > 0) {
      errors.push(`Питання ${label}: ${questionErrors[0]}`);
      continue;
    }
    questions.push(question);
  }

  return { questions, errors };
}
