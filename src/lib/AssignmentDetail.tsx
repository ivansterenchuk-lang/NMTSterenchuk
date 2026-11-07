import { useState } from 'react';
import QuestionCard from './QuestionCard';
import {
  avgTwelve,
  fmtDate,
  generateCode,
  guestSubs,
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
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-indigo-400 mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 font-bold mt-1">{hint}</p>}
    </div>
  );
}

export default function AssignmentDetail({ cls, a, usedCodes, onBack, onChange, onAddGuest, onDelete }: Props) {
  const [tab, setTab] = useState<DTab>('progress');
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const classSubs = a.submissions.filter(s => cls.students.some(st => st.id === s.studentId));
  const guests = guestSubs(cls, a);
  const all: Submission[] = [...classSubs, ...guests];

  const avg = avgTwelve(all);
  const best = all.length ? Math.max(...all.map(pct)) : null;
  const total = cls.students.length;
  const ratio = total ? Math.round((classSubs.length / total) * 100) : 0;

  const rows = cls.students
    .map(s => ({ s, sub: subOf(a, s.id), status: hwStatus(a, s.id) }))
    .sort((x, y) => (x.sub ? 1 : 0) - (y.sub ? 1 : 0) || x.s.name.localeCompare(y.s.name, 'uk'));

  const stats = questionStats(a, all);
  const hasItems = stats.some(s => s.n > 0);
  const ses = a.session;

  const startSession = () =>
    onChange(x => ({ ...x, session: { code: generateCode(usedCodes), open: true, startedAt: new Date().toISOString() } }));

  const toggleSession = () =>
    onChange(x => (x.session ? { ...x, session: { ...x.session, open: !x.session.open } } : x));

  const resetCode = () => {
    if (confirm('Створити новий код? Старий код перестане працювати.')) {
      onChange(x => (x.session ? { ...x, session: { ...x.session, code: generateCode(usedCodes) } } : x));
    }
  };

  const doCopy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <button onClick={onBack} className="text-indigo-400 hover:underline text-xs font-bold inline-block">
            ← {cls.name}
          </button>
          <h2 className="text-2xl font-black text-white">{a.title}</h2>
          <p className="text-xs text-slate-400">
            {a.questions.length} пит. · максимум {totalMax(a.questions)} б ·{' '}
            {a.due ? `термін: ${fmtDate(a.due)}` : 'без терміну'}
          </p>
          {a.instructions && <p className="text-xs text-slate-300 whitespace-pre-wrap pt-1">{a.instructions}</p>}
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          🗑️ Видалити завдання
        </button>
      </div>

      <Tabs value={tab} onChange={setTab} items={TABS} />

      {/* ===== ПЕРЕБІГ ВИКОНАННЯ ===== */}
      {tab === 'progress' && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Здали</p>
              <p className="text-2xl font-black text-indigo-400">
                {classSubs.length} <span className="text-slate-500 text-base">/ {total}</span>
              </p>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600" style={{ width: `${ratio}%` }} />
              </div>
            </div>
            <Stat label="Середня оцінка" value={avg === null ? '—' : avg.toFixed(1)} hint="12-бальна шкала" />
            <Stat label="Найкращий результат" value={best === null ? '—' : `${best}%`} />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-md overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Учень</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3 text-center">Бали</th>
                  <th className="p-3 text-center">%</th>
                  <th className="p-3 text-center">Оцінка</th>
                  <th className="p-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-slate-400">
                      У класі ще немає учнів.
                    </td>
                  </tr>
                )}
                {rows.map(({ s, sub, status }) => (
                  <tr key={s.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-200">{s.name}</td>
                    <td className="p-3"><StatusPill status={status} /></td>
                    <td className="p-3 text-center font-bold text-slate-200">{sub ? `${sub.score}/${sub.max}` : '—'}</td>
                    <td className="p-3 text-center text-slate-400 font-bold">{sub ? `${pct(sub)}%` : '—'}</td>
                    <td className="p-3 text-center">
                      {sub ? <GradeBadge percent={pct(sub)} /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-3 text-xs text-slate-400">
                      {sub ? `${fmtDate(sub.submittedAt)}${sub.late ? ' · із запізненням' : ''}` : ''}
                    </td>
                  </tr>
                ))}
                {guests.map(g => (
                  <tr key={g.studentId} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-200">
                      {g.name ?? 'Гість'}{' '}
                      <span className="text-[10px] font-bold text-amber-400 border border-amber-500/30 bg-amber-950 rounded-full px-2 py-0.5 ml-1">
                        гість
                      </span>
                    </td>
                    <td className="p-3"><StatusPill status="done" /></td>
                    <td className="p-3 text-center font-bold text-slate-200">{g.score}/{g.max}</td>
                    <td className="p-3 text-center text-slate-400 font-bold">{pct(g)}%</td>
                    <td className="p-3 text-center"><GradeBadge percent={pct(g)} /></td>
                    <td className="p-3 text-xs text-slate-400">{fmtDate(g.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-200">Результати по питаннях</p>
              <p className="text-xs text-slate-400 mt-0.5">Який відсоток балів клас набрав за кожне питання.</p>
            </div>
            {!hasItems && (
              <p className="text-xs text-slate-500">Статистика з’явиться після здач, виконаних цією версією сайту.</p>
            )}
            {a.questions.map((q, i) => {
              const p = stats[i].pct;
              const tone =
                p === null ? 'bg-slate-800' : p >= 75 ? 'bg-emerald-600' : p >= 50 ? 'bg-amber-600' : 'bg-rose-600';
              return (
                <div key={q.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-300 truncate">
                      <b className="text-indigo-300 mr-1.5">№{i + 1}</b>
                      {q.title}
                    </span>
                    <span className="font-black text-slate-200 shrink-0">{p === null ? '—' : `${p}%`}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
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
          {a.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
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
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="text-4xl">📡</div>
              <p className="text-sm font-bold text-slate-300">Сесію для цього тесту ще не запущено</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Запустіть сесію, щоб отримати код. Його можна надіслати будь-якому учневі, навіть тому, хто не в цьому класі.
              </p>
              <button
                onClick={startSession}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                ▶ Запустити сесію
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border-2 border-amber-500 bg-amber-950/40 p-6 space-y-4 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">📡 Код сесії</p>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      ses.open
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {ses.open ? 'Приймає учнів' : 'Зачинена'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-4xl font-black text-white tracking-[0.2em]">{ses.code}</span>
                  <button
                    onClick={() => doCopy(ses.code)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {copied ? '✓ Скопійовано' : '📋 Копіювати код'}
                  </button>
                </div>
                <p className="text-xs text-slate-300">
                  Учень вводить код у розділі «Тест за кодом». Результати з’являються у вкладці «Перебіг виконання».
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={toggleSession}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {ses.open ? '⏸ Зачинити сесію' : '▶ Відкрити знову'}
                  </button>
                  <button
                    onClick={resetCode}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ↻ Змінити код
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-md p-5 space-y-3">
                <p className="text-sm font-bold text-slate-200">Гості (пройшли за кодом, але не в класі)</p>
                {guests.length === 0 ? (
                  <p className="text-xs text-slate-400">Поки що нікого.</p>
                ) : (
                  guests.map(g => (
                    <div key={g.studentId} className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{g.name ?? 'Гість'}</p>
                        <p className="text-[11px] text-slate-500 font-bold">{g.score}/{g.max} · {pct(g)}%</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <GradeBadge percent={pct(g)} />
                        <button
                          onClick={() => onAddGuest(g.studentId, g.name ?? 'Гість')}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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