import { getLeftLabel, getRightLabel, scoreMatchingQuestion } from '@/lib/matching';
import { isMatchingQuestion, scoreQuestion } from '@/lib/questionRules';
import type { Answers, MatchingAnswer, MatchingQuestion, NotebookReviews, Question } from '@/types/test';

export interface TestResultPrintInput {
  testTitle: string;
  studentName: string;
  submittedAt: string;
  questions: Question[];
  answers: Answers;
  reviews: NotebookReviews;
}

const FONT_STACK = "Arial, 'Helvetica Neue', Helvetica, sans-serif";
const COLORS = {
  brand: '#0f766e',
  brandSoft: '#f0fdfa',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#047857',
  successSoft: '#ecfdf5',
  danger: '#b91c1c',
  dangerSoft: '#fef2f2',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
}

function sanitizeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'result';
}

function summaryCard(label: string, value: string): string {
  return `
    <div style="flex:1;border:1px solid ${COLORS.border};border-radius:10px;padding:14px 16px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.muted};">${label}</div>
      <div style="margin-top:6px;font-size:16px;font-weight:600;color:${COLORS.text};">${value}</div>
    </div>`;
}

function questionSection(question: MatchingQuestion, index: number, answer: MatchingAnswer | undefined): string {
  const { score, maxScore } = scoreMatchingQuestion(question, answer);
  const rightIndexById = Object.fromEntries(question.rightItems.map((item, j) => [item.id, j]));
  const rightTextById = Object.fromEntries(question.rightItems.map((item) => [item.id, item.text]));

  const rows = question.leftItems
    .map((left, i) => {
      const chosenId = answer?.[left.id];
      const correctId = question.correctPairs[left.id];
      const isCorrect = chosenId !== undefined && chosenId === correctId;
      const chosenText =
        chosenId !== undefined
          ? `${getRightLabel(rightIndexById[chosenId])}. ${escapeHtml(rightTextById[chosenId])}`
          : '—';
      const correctText = `${getRightLabel(rightIndexById[correctId])}. ${escapeHtml(rightTextById[correctId])}`;
      const status = isCorrect
        ? `<span style="color:${COLORS.success};font-weight:600;">Правильно</span>`
        : `<span style="color:${COLORS.danger};font-weight:600;">Помилка</span>`;
      const rowBackground = isCorrect ? COLORS.successSoft : COLORS.dangerSoft;

      return `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:10px 12px;border-top:1px solid ${COLORS.border};font-weight:600;color:${COLORS.text};">${getLeftLabel(i)}. ${escapeHtml(left.text)}</td>
          <td style="padding:10px 12px;border-top:1px solid ${COLORS.border};color:${COLORS.text};background:${rowBackground};">${chosenText}</td>
          <td style="padding:10px 12px;border-top:1px solid ${COLORS.border};color:${COLORS.text};">${correctText}</td>
          <td style="padding:10px 12px;border-top:1px solid ${COLORS.border};">${status}</td>
        </tr>`;
    })
    .join('');

  return `
    <section style="margin-top:22px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
        <h2 style="margin:0;font-size:15px;color:${COLORS.text};">Питання ${index + 1}. ${escapeHtml(question.prompt)}</h2>
        <span style="font-size:13px;font-weight:600;color:${COLORS.brand};white-space:nowrap;">${score} з ${maxScore}</span>
      </div>
      <table style="width:100%;margin-top:10px;border-collapse:collapse;border:1px solid ${COLORS.border};font-size:12px;">
        <thead>
          <tr style="background:${COLORS.brandSoft};color:${COLORS.brand};text-align:left;">
            <th style="padding:9px 12px;font-weight:600;">Елемент</th>
            <th style="padding:9px 12px;font-weight:600;">Відповідь учня</th>
            <th style="padding:9px 12px;font-weight:600;">Правильна відповідь</th>
            <th style="padding:9px 12px;font-weight:600;">Результат</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function notebookSection(question: Question, index: number, reviews: NotebookReviews): string {
  const review = reviews[question.id];
  const maxScore = question.type === 'notebook' ? question.maxScore : 0;
  const scoreLabel =
    review?.score === null || review?.score === undefined ? 'очікує перевірки' : `${review.score} з ${maxScore}`;

  return `
    <section style="margin-top:22px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;">
        <h2 style="margin:0;font-size:15px;color:${COLORS.text};">Питання ${index + 1}. ${escapeHtml(question.prompt)}</h2>
        <span style="font-size:13px;font-weight:600;color:${COLORS.brand};white-space:nowrap;">${scoreLabel}</span>
      </div>
      <p style="margin:8px 0 0;font-size:12px;color:${COLORS.muted};">Розв'язання в електронному зошиті. Записи та помітки доступні у кабінеті вчителя.</p>
    </section>`;
}

function buildReportHtml(input: TestResultPrintInput): string {
  const totals = input.questions.reduce(
    (acc, question) => {
      const { score, maxScore } = scoreQuestion(question, input.answers, input.reviews);
      return { score: acc.score + score, maxScore: acc.maxScore + maxScore };
    },
    { score: 0, maxScore: 0 },
  );
  const percent = totals.maxScore > 0 ? Math.round((totals.score / totals.maxScore) * 100) : 0;

  const sections = input.questions
    .map((question, index) =>
      isMatchingQuestion(question)
        ? questionSection(question, index, input.answers[question.id])
        : notebookSection(question, index, input.reviews),
    )
    .join('');

  return `
    <div style="font-family:${FONT_STACK};color:${COLORS.text};padding:8px 4px;">
      <div style="background:${COLORS.brand};color:#ffffff;border-radius:14px;padding:24px 28px;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">Результати тестування</div>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">${escapeHtml(input.testTitle)}</h1>
      </div>

      <div style="display:flex;gap:12px;margin-top:18px;">
        ${summaryCard('Учень', escapeHtml(input.studentName))}
        ${summaryCard('Дата', escapeHtml(formatDate(input.submittedAt)))}
        ${summaryCard('Бали', `${totals.score} з ${totals.maxScore}`)}
        ${summaryCard('Результат', `${percent}%`)}
      </div>

      ${sections}

      <p style="margin-top:28px;font-size:11px;color:${COLORS.muted};">Бал нараховується за кожну правильно встановлену пару.</p>
    </div>`;
}

export function printTestResult(input: TestResultPrintInput): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Браузер заблокував вікно друку.');
  }

  const documentTitle = `${sanitizeFileName(input.testTitle)} - ${sanitizeFileName(input.studentName)}`;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(documentTitle)}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { margin: 0; background: #ffffff; }
    </style>
  </head>
  <body>${buildReportHtml(input)}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
