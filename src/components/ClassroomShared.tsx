import { useState } from 'react';
import {
  avgTwelve,
  fmtDate,
  hwStatus,
  pct,
  subOf,
  toTwelve,
  type Assignment,
  type ClassItem,
  type HwStatus,
  type Submission
} from '../lib/classroom';

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt('Скопіюйте вручну (Ctrl+C):', text);
  }
}

// Оцінка у 12-бальній шкалі з кольором
export function GradeBadge({ percent }: { percent: number }) {
  const tone =
    percent >= 75
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : percent >= 50
      ? 'bg-amber-50 text-amber-600 border-amber-200'
      : 'bg-rose-50 text-rose-600 border-rose-200';
  return (
    <span className={`inline-flex items-center justify-center min-w-9 h-8 px-2 rounded-lg border text-sm font-black ${tone}`}>
      {toTwelve(percent)}
    </span>
  );
}

export function StatusPill({ status }: { status: HwStatus }) {
  const map = {
    todo: ['Призначено', 'bg-blue-50 text-blue-600 border-blue-200'],
    overdue: ['Протерміновано', 'bg-rose-50 text-rose-600 border-rose-200'],
    done: ['Здано', 'bg-emerald-50 text-emerald-600 border-emerald-200']
  } as const;
  const [label, tone] = map[status];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tone}`}>{label}</span>;
}

export function Tabs<T extends string>({
  value,
  items,
  onChange
}: {
  value: T;
  items: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            value === k
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------- Стрічка класу ----------
export function Stream({
  cls,
  canPost,
  onPost,
  onDelete
}: {
  cls: ClassItem;
  canPost: boolean;
  onPost?: (text: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [text, setText] = useState('');
  // ВИПРАВЛЕНО: Захист від undefined при сортуванні
  const posts = [...(cls.posts || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const publish = () => {
    const t = text.trim();
    if (!t || !onPost) return;
    onPost(t);
    setText('');
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Оголошення для класу…"
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none transition"
          />
          <div className="flex justify-end">
            <button
              onClick={publish}
              disabled={!text.trim()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Опублікувати
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500 shadow-sm">
          У стрічці поки порожньо.
        </div>
      )}

      {posts.map(p => {
        const a = p.assignmentId ? (cls.assignments || []).find(x => x.id === p.assignmentId) : undefined;
        return (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex gap-4 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg shrink-0">
              {p.kind === 'assignment' ? '📝' : '📢'}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  {cls.teacherName} · {fmtDate(p.createdAt || new Date().toISOString())}
                </span>
                {canPost && onDelete && (
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer"
                    title="Видалити"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{p.text}</p>
              {a && (
                <p className="text-xs text-teal-600 font-bold mt-1">
                  {a.questions?.length || 0} пит. · {a.due ? `термін: ${fmtDate(a.due)}` : 'без терміну'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Журнал класу (для вчителя) ----------
export function Gradebook({ cls }: { cls: ClassItem }) {
  // ВИПРАВЛЕНО: Захист від undefined при сортуванні
  const assignments = [...(cls.assignments || [])].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const students = cls.students || [];

  if (students.length === 0 || assignments.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500 shadow-sm">
        {students.length === 0
          ? 'У класі ще немає учнів — поділіться посиланням-запрошенням.'
          : 'Журнал з’явиться після першого призначеного тесту.'}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            <th className="p-3 sticky left-0 bg-slate-50 min-w-44">Учень</th>
            {assignments.map(a => (
              <th key={a.id} className="p-3 text-center border-l border-slate-200 min-w-32 normal-case">
                <div className="text-slate-900 font-bold truncate max-w-36 mx-auto" title={a.title}>{a.title}</div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {a.due ? `до ${fmtDate(a.due)}` : 'без терміну'}
                </div>
              </th>
            ))}
            <th className="p-3 text-center border-l border-slate-200 min-w-24">Середня</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map(s => {
            const mine = assignments.map(a => subOf(a, s.id)).filter((x): x is Submission => !!x);
            const avg = avgTwelve(mine);
            return (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white">{s.name || 'Без імені'}</td>
                {assignments.map(a => {
                  const sub = subOf(a, s.id);
                  return (
                    <td key={a.id} className="p-3 text-center border-l border-slate-200">
                      {sub ? (
                        <div className="flex flex-col items-center gap-1">
                          <GradeBadge percent={pct(sub)} />
                          <span className="text-[10px] text-slate-500 font-bold">
                            {sub.score}/{sub.max}
                            {sub.late ? ' · ⏰' : ''}
                          </span>
                        </div>
                      ) : hwStatus(a, s.id) === 'overdue' ? (
                        <span className="text-[10px] font-bold text-rose-500">не здано</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 text-center border-l border-slate-200 font-black text-teal-600">
                  {avg === null ? '—' : avg.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t border-slate-200 text-xs">
            <td className="p-3 font-bold text-slate-500 sticky left-0 bg-slate-50">Середнє по класу</td>
            {assignments.map(a => {
              const subs = (a.submissions || []).filter(x => students.some(st => st.id === x.studentId));
              const avg = avgTwelve(subs);
              return (
                <td key={a.id} className="p-3 text-center border-l border-slate-200">
                  <div className="font-black text-slate-800">{avg === null ? '—' : avg.toFixed(1)}</div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    здали {subs.length}/{students.length}
                  </div>
                </td>
              );
            })}
            <td className="p-3 border-l border-slate-200" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---------- Журнал учня ----------
export type JournalEntry = { cls: ClassItem; a: Assignment; sub: Submission };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-teal-600 mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 font-bold mt-1">{hint}</p>}
    </div>
  );
}

export function MyJournal({ entries, showClass }: { entries: JournalEntry[]; showClass: boolean }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
        <div className="text-4xl text-slate-300">📒</div>
        <div>
          <p className="text-sm font-bold text-slate-800">Оцінок поки немає</p>
          <p className="text-xs text-slate-500 mt-1">Виконайте перше домашнє завдання — результат з’явиться тут.</p>
        </div>
      </div>
    );
  }

  // ВИПРАВЛЕНО: Захист від undefined при сортуванні
  const asc = [...entries].sort((x, y) => (x.sub.submittedAt || '').localeCompare(y.sub.submittedAt || ''));
  const desc = [...asc].reverse();
  const avg = avgTwelve(entries.map(e => e.sub));
  const best = Math.max(...entries.map(e => pct(e.sub)));

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Середня оцінка" value={avg === null ? '—' : avg.toFixed(1)} hint="за 12-бальною шкалою" />
        <Stat label="Виконано тестів" value={String(entries.length)} />
        <Stat label="Найкращий результат" value={`${best}%`} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-bold text-slate-800">Динаміка оцінок</p>
        <div className="flex items-end gap-3 overflow-x-auto pb-2">
          {asc.map(e => {
            const p = pct(e.sub);
            const tone = p >= 75 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <div
                key={`${e.cls.id}-${e.a.id}`}
                className="flex-1 min-w-8 max-w-16 flex flex-col items-center gap-1.5"
                title={`${e.a.title}: ${e.sub.score}/${e.sub.max}`}
              >
                <span className="text-[11px] font-black text-slate-600">{toTwelve(p)}</span>
                <div className="w-full h-24 flex items-end bg-slate-50 rounded-t-md">
                  <div className={`w-full rounded-t-md ${tone} transition-all duration-500`} style={{ height: `${Math.max(p, 6)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="p-3">Завдання</th>
              <th className="p-3">Дата</th>
              <th className="p-3 text-center">Бали</th>
              <th className="p-3 text-center">%</th>
              <th className="p-3 text-center">Оцінка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {desc.map(e => (
              <tr key={`${e.cls.id}-${e.a.id}`} className="hover:bg-slate-50 transition">
                <td className="p-3">
                  <div className="font-bold text-slate-800">{e.a.title}</div>
                  {showClass && <div className="text-[11px] text-teal-600 font-bold mt-0.5">{e.cls.name}</div>}
                </td>
                <td className="p-3 text-slate-500 text-xs">
                  {e.sub.submittedAt ? fmtDate(e.sub.submittedAt) : '—'}
                  {e.sub.late ? ' · із запізненням' : ''}
                </td>
                <td className="p-3 text-center font-bold text-slate-800">
                  {e.sub.score}/{e.sub.max}
                </td>
                <td className="p-3 text-center text-slate-500 font-bold">{pct(e.sub)}%</td>
                <td className="p-3 text-center">
                  <GradeBadge percent={pct(e.sub)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}