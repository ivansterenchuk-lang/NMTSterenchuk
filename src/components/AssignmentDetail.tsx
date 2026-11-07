import { useState } from 'react';
import QuestionCard from './QuestionCard';
import { useAccess } from './AccessUI';
import { classResultsHtml, printHtml, studentResultHtml } from '../lib/pdf';
import {
  avgTwelve,
  fmtDate,
  generateCode,
  hwStatus,
  pct,
  questionStats,
  subOf,
  totalMax,
  type Assignment,
  type ClassItem,
  type Submission
} from '../lib/classroom';
import { GradeBadge, StatusPill, Tabs, copyText } from './ClassroomShared';

type Props = {
  cls: ClassItem;
  a: Assignment;
  usedCodes: string[];
  onBack: () => void;
  onChange: (fn: (a: Assignment) => Assignment) => void;
  onAddGuest: (studentId: string, name: string) => void;
  onDelete: () => void;
};

type DTab = 'questions' | 'progress' | 'session';

const TABS: [DTab, string][] = [
  ['progress', '📊 Перебіг виконання'],
  ['questions', '📋 Завдання'],
  ['session', '📡 Сесія']
];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-teal-600 mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 font-bold mt-1">{hint}</p>}
    </div>
  );
}

export default function AssignmentDetail({ cls, a, usedCodes, onBack, onChange, onAddGuest, onDelete }: Props) {
  const { guard, printTest, ent } = useAccess();
  const [tab, setTab] = useState<DTab>('progress');
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const assignment = a as any;

  const classStudentIds = new Set((cls.students || []).map(s => s.id));
  const classSubs = (assignment.submissions || []).filter((s: any) => classStudentIds.has(s.studentId));
  const guests: Submission[] = (assignment.submissions || []).filter((s: any) => !classStudentIds.has(s.studentId)); // Вказано тип масиву
  const all: Submission[] = [...classSubs, ...guests];

  const avg = avgTwelve(all);
  const best = all.length ? Math.max(...all.map(pct)) : null;
  const total = (cls.students || []).length;
  const ratio = total ? Math.round((classSubs.length / total) * 100) : 0;

  const rows = (cls.students || [])
    .map(s => ({
      s,
      sub: subOf(assignment, s.id),
      status: (hwStatus as any)(assignment, s.id)
    }))
    .sort((x, y) => (x.sub ? 1 : 0) - (y.sub ? 1 : 0) || x.s.name.localeCompare(y.s.name, 'uk'));

  const stats = (assignment.questions || []).map((q: any, i: number) => {
    const st = (questionStats as any)(all, i); 
    const p = st.total > 0 ? Math.round((st.correct / st.total) * 100) : null;
    return { ...st, pct: p };
  });

  const hasItems = stats.some((s: any) => s.total > 0);
  const ses = assignment.session;
  const lock = ent.features.pdf ? '' : ' 🔒';

  // ---------- Експорт ----------
  const resultRows = () => [
    ...(cls.students || []).map(s => ({ name: s.name, sub: subOf(assignment, s.id) })),
    ...guests.map((g: Submission) => ({ name: g.name ?? 'Гість', sub: g, guest: true })) // Вказано тип g
  ];

  const exportClass = (detailed: boolean) =>
    guard(() => {
      const html = classResultsHtml({
        title: assignment.title,
        className: cls.name,
        teacher: cls.teacherName || 'Вчитель',
        questions: assignment.questions,
        rows: resultRows(),
        detailed
      } as any);
      printHtml(html, `Результати — ${assignment.title}`); 
    });

  const exportStudent = (name: string, sub: Submission, guest?: boolean) =>
    guard(() => {
      const html = studentResultHtml({
        title: assignment.title,
        className: cls.name,
        teacher: cls.teacherName || 'Вчитель',
        studentName: name,
        guest,
        questions: assignment.questions,
        sub
      } as any);
      printHtml(html, `Результат — ${name}`);
    });

  const startSession = () =>
    onChange(x => ({ ...x, session: { code: generateCode(usedCodes), open: true, startedAt: new Date().toISOString() } } as any));

  const toggleSession = () =>
    onChange(x => ((x as any).session ? { ...x, session: { ...(x as any).session, open: !(x as any).session.open } } as any : x));

  const resetCode = () => {
    if (confirm('Створити новий код? Старий код перестане працювати.')) {
      onChange(x => ((x as any).session ? { ...x, session: { ...(x as any).session, code: generateCode(usedCodes) } } as any : x));
    }
  };

  const doCopy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const btn =
    'px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <button onClick={onBack} className="text-teal-600 hover:underline text-xs font-bold inline-block">
            ← {cls.name}
          </button>
          <h2 className="text-2xl font-black text-slate-900">{assignment.title}</h2>
          <p className="text-xs text-slate-500">
            {assignment.questions?.length || 0} пит. · максимум {totalMax(assignment)} б ·{' '}
            {assignment.due ? `термін: ${fmtDate(assignment.due)}` : 'без терміну'}
          </p>
          {assignment.instructions && <p className="text-xs text-slate-600 whitespace-pre-wrap pt-1">{assignment.instructions}</p>}
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          🗑️ Видалити завдання
        </button>
      </div>

      <Tabs value={tab} onChange={setTab} items={TABS} />

      {/* ===== ПЕРЕБІГ ВИКОНАННЯ ===== */}
      {tab === 'progress' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportClass(true)} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">
              📄 Результати класу + питання{lock}
            </button>
            <button onClick={() => exportClass(false)} className={btn}>
              📋 Лише зведена відомість{lock}
            </button>
            <button onClick={() => printTest(assignment.title, assignment.questions)} className={btn}>
              🖨 Тест без відповідей (для друку){lock}
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Здали</p>
              <p className="text-2xl font-black text-teal-600">
                {classSubs.length} <span className="text-slate-400 text-base">/ {total}</span>
              </p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${ratio}%` }} />
              </div>
            </div>
            <Stat label="Середня оцінка" value={avg === null ? '—' : avg.toFixed(1)} hint="12-бальна шкала" />
            <Stat label="Найкращий результат" value={best === null ? '—' : `${best}%`} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">Учень</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3 text-center">Бали</th>
                  <th className="p-3 text-center">%</th>
                  <th className="p-3 text-center">Оцінка</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-slate-500">
                      У класі ще немає учнів.
                    </td>
                  </tr>
                )}
                {rows.map(({ s, sub, status }) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800">{s.name}</td>
                    <td className="p-3"><StatusPill status={status as any} /></td>
                    <td className="p-3 text-center font-bold text-slate-800">{sub ? `${sub.score}/${sub.max}` : '—'}</td>
                    <td className="p-3 text-center text-slate-500 font-bold">{sub ? `${pct(sub)}%` : '—'}</td>
                    <td className="p-3 text-center">
                      {sub ? <GradeBadge percent={pct(sub)} /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {sub ? `${fmtDate(sub.submittedAt)}${sub.late ? ' · із запізненням' : ''}` : ''}
                    </td>
                    <td className="p-3 text-center">
                      {sub && (
                        <button
                          onClick={() => exportStudent(s.name, sub)}
                          title="Результат учня з питаннями (PDF)"
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          📄{lock}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {guests.map((g: Submission) => ( // Вказано тип g
                  <tr key={g.studentId} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800">
                      {g.name ?? 'Гість'}{' '}
                      <span className="text-[10px] font-bold text-amber-600 border border-amber-200 bg-amber-50 rounded-full px-2 py-0.5 ml-1">
                        гість
                      </span>
                    </td>
                    <td className="p-3"><StatusPill status="done" /></td>
                    <td className="p-3 text-center font-bold text-slate-800">{g.score}/{g.max}</td>
                    <td className="p-3 text-center text-slate-500 font-bold">{pct(g)}%</td>
                    <td className="p-3 text-center"><GradeBadge percent={pct(g)} /></td>
                    <td className="p-3 text-xs text-slate-500">{fmtDate(g.submittedAt)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => exportStudent(g.name ?? 'Гість', g, true)}
                        title="Результат учня з питаннями (PDF)"
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        📄{lock}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Результати по питаннях</p>
              <p className="text-xs text-slate-500 mt-0.5">Який відсоток балів клас набрав за кожне питання.</p>
            </div>
            {!hasItems && (
              <p className="text-xs text-slate-500">Статистика з’явиться після здач, виконаних цією версією сайту.</p>
            )}
            {(assignment.questions || []).map((q: any, i: number) => {
              const p = stats[i].pct;
              const tone =
                p === null ? 'bg-slate-200' : p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={q.id || i} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 truncate">
                      <b className="text-teal-600 mr-1.5">№{i + 1}</b>
                      {q.title || q.text || 'Без тексту'}
                    </span>
                    <span className="font-black text-slate-800 shrink-0">{p === null ? '—' : `${p}%`}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${p ?? 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ЗАВДАННЯ ===== */}
      {tab === 'questions' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => printTest(assignment.title, assignment.questions)} className={btn}>
              🖨 PDF для друку{lock}
            </button>
          </div>
          {(assignment.questions || []).map((q: any, i: number) => (
            <QuestionCard
              key={q.id || i}
              q={q}
              index={i}
              expanded={openQ === q.id}
              onToggle={() => setOpenQ(openQ === q.id ? null : q.id)}
            />
          ))}
        </div>
      )}

      {/* ===== СЕСІЯ ===== */}
      {tab === 'session' && (
        <div className="space-y-4">
          {!ses ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
              <div className="text-4xl">📡</div>
              <p className="text-sm font-bold text-slate-800">Сесію для цього тесту ще не запущено</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Запустіть сесію, щоб отримати код. Його можна надіслати будь-якому учневі, навіть тому, хто не в цьому класі.
              </p>
              <button
                onClick={startSession}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                ▶ Запустити сесію
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">📡 Код сесії</p>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      ses.open
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}
                  >
                    {ses.open ? 'Приймає учнів' : 'Зачинена'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-4xl font-black text-slate-900 tracking-[0.2em]">{ses.code}</span>
                  <button
                    onClick={() => doCopy(ses.code)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    {copied ? '✓ Скопійовано' : '📋 Копіювати код'}
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Учень вводить код у розділі «Тест за кодом». Результати з’являються у вкладці «Перебіг виконання».
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={toggleSession} className={btn}>
                    {ses.open ? '⏸ Зачинити сесію' : '▶ Відкрити знову'}
                  </button>
                  <button onClick={resetCode} className={btn}>
                    ↻ Змінити код
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
                <p className="text-sm font-bold text-slate-800">Гості (пройшли за кодом, але не в класі)</p>
                {guests.length === 0 ? (
                  <p className="text-xs text-slate-500">Поки що нікого.</p>
                ) : (
                  guests.map((g: Submission) => ( // Вказано тип g
                    <div key={g.studentId} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{g.name ?? 'Гість'}</p>
                        <p className="text-[11px] text-slate-500 font-bold">{g.score}/{g.max} · {pct(g)}%</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <GradeBadge percent={pct(g)} />
                        <button
                          onClick={() => onAddGuest(g.studentId, g.name ?? 'Гість')}
                          className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          ➕ До класу
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}