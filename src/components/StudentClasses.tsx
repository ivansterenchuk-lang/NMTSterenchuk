import { useState, type Dispatch, type SetStateAction } from 'react';
import TestPlayer from './TestPlayer';
import type { Answer } from '../lib/nmt';
import {
  avgTwelve,
  extractCode,
  fmtDate,
  hwStatus,
  pct,
  splitName,
  subOf,
  type Assignment,
  type ClassItem,
  type HwStatus,
  type Submission
} from '../lib/classroom';
import { GradeBadge, MyJournal, Stream, StatusPill, Tabs, type JournalEntry } from './ClassroomShared';
import { useAccess } from './AccessUI';
import { Lock, CheckCircle2, UserPlus, Info } from 'lucide-react';

// ІМПОРТ ФУНКЦІЙ ДЛЯ БАЗИ ДАНИХ (КРИТИЧНО ВАЖЛИВО!)
import { addStudentToClass, saveSubmissionToDb } from '../lib/classroomRepository';

type Props = {
  classes: ClassItem[];
  setClasses: Dispatch<SetStateAction<ClassItem[]>>;
  student: { id: string; name: string };
  onStudentNameChange: (name: string) => void;
  joinCode: string;
  onJoinConsumed: () => void;
};

type StudentView = 'classes' | 'homework' | 'journal';
type ClassTab = 'work' | 'stream' | 'journal';
type HwItem = { cls: ClassItem; a: Assignment; status: HwStatus; sub?: Submission };
type Finish = { total: number; max: number; items: { id: number; score: number; max: number }[]; answers: Record<number, Answer> };
type TestResultData = { score: number; max: number; title: string; className: string };

const CLASS_TABS: [ClassTab, string][] = [
  ['work', '📝 Домашні тести'],
  ['stream', '📢 Стрічка'],
  ['journal', '📒 Мій журнал']
];

const inp = 'w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition';

const rank = (s: HwStatus) => (s === 'todo' ? 0 : s === 'overdue' ? 1 : 2);
const sortHw = (x: HwItem, y: HwItem) => {
  if (rank(x.status) !== rank(y.status)) return rank(x.status) - rank(y.status);
  if (x.status === 'done') return (y.sub?.submittedAt ?? '').localeCompare(x.sub?.submittedAt ?? '');
  return (x.a.due ?? '9999').localeCompare(y.a.due ?? '9999');
};

function HomeworkRow({ item, showClass, onStart }: { item: HwItem; showClass: boolean; onStart: () => void }) {
  const { cls, a, status, sub } = item;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={status} />
          {showClass && <span className="text-[11px] font-bold text-teal-700">{cls.name}</span>}
          {sub?.late && <span className="text-[10px] font-bold text-amber-600">здано із запізненням</span>}
        </div>
        <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
        <p className="text-xs text-slate-500">
          {a.questions?.length || 0} пит. · {a.due ? `термін: ${fmtDate(a.due)}` : 'без терміну'}
        </p>
        {a.instructions && <p className="text-xs text-slate-600 whitespace-pre-wrap">{a.instructions}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {sub ? (
          <>
            <div className="text-right">
              <div className="text-sm font-black text-slate-800">
                {sub.score} / {sub.max}
              </div>
              <div className="text-[11px] text-slate-500 font-bold">{pct(sub)}%</div>
            </div>
            <GradeBadge percent={pct(sub)} />
          </>
        ) : (
          <button
            onClick={onStart}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            {status === 'overdue' ? '▶ Виконати із запізненням' : '▶ Виконати'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentClasses({ classes, setClasses, student, onStudentNameChange, joinCode, onJoinConsumed }: Props) {
  const { ent } = useAccess();

  const [view, setView] = useState<StudentView>('classes');
  const [openId, setOpenId] = useState<string | null>(null);
  const [classTab, setClassTab] = useState<ClassTab>('work');
  const [playing, setPlaying] = useState<{ classId: string; assignmentId: string } | null>(null);
  
  const [codeInput, setCodeInput] = useState(joinCode);
  const [nameInput, setNameInput] = useState(student.name);
  const [joinError, setJoinError] = useState('');
  
  const [filter, setFilter] = useState<'all' | HwStatus>('all');
  const [testResult, setTestResult] = useState<TestResultData | null>(null);

  const safeClasses = classes || [];
  const safeStudent = student || { id: '', name: '' };
  
  const mine = safeClasses.filter(c => c.students?.some(s => s.id === safeStudent.id));

  // НОВЕ: Розумне розпізнавання класу за кодом
  const targetClass = safeClasses.find(x => x.code === extractCode(codeInput));
  const isAlreadyJoined = targetClass?.students?.some(s => s.id === safeStudent.id);

  const allHw: HwItem[] = mine
    .flatMap(c =>
      (c.assignments || []).map(a => ({ cls: c, a, status: hwStatus(a, safeStudent.id), sub: subOf(a, safeStudent.id) }))
    )
    .sort(sortHw);

  const journalOf = (list: HwItem[]): JournalEntry[] =>
    list.filter((h): h is HwItem & { sub: Submission } => !!h.sub).map(h => ({ cls: h.cls, a: h.a, sub: h.sub }));

  const countOf = (s: HwStatus) => allHw.filter(h => h.status === s).length;

  // ОНОВЛЕНО: Приєднання до класу з збереженням у базу
  const join = async () => {
    setJoinError('');
    const name = nameInput.trim();
    if (name.length < 2) {
      setJoinError('Вкажіть ім’я та прізвище.');
      return;
    }
    if (!targetClass) {
      setJoinError('Клас з таким кодом не знайдено.');
      return;
    }
    if (!isAlreadyJoined && !targetClass.acceptJoins) {
      setJoinError('Вчитель тимчасово закрив набір до цього класу.');
      return;
    }

    onStudentNameChange(name);
    
    // Оптимістичне оновлення UI
    setClasses(prev =>
      (prev || []).map(x =>
        x.id !== targetClass.id
          ? x
          : {
              ...x,
              students: isAlreadyJoined
                ? (x.students || []).map(s => (s.id === safeStudent.id ? { ...s, name } : s))
                : [...(x.students || []), { id: safeStudent.id, name }]
            }
      )
    );

    setCodeInput('');
    onJoinConsumed();
    setView('classes');
    setOpenId(targetClass.id);
    setClassTab('work');

    // ЗБЕРЕЖЕННЯ В БАЗУ SUPABASE
    await addStudentToClass(targetClass.id, safeStudent.id, name);
  };

  const leaveClass = (c: ClassItem) => {
    if (confirm(`Покинути клас «${c.name}»?`)) {
      setClasses(prev => (prev || []).map(x => (x.id === c.id ? { ...x, students: (x.students || []).filter(s => s.id !== safeStudent.id) } : x)));
      setOpenId(null);
    }
  };

  // ОНОВЛЕНО: Збереження результатів у базу
  const submit = async (classId: string, a: Assignment, res: Finish) => {
    const late = !!a.due && new Date(a.due + 'T23:59:59') < new Date();
    
    setClasses(prev =>
      (prev || []).map(c =>
        c.id !== classId
          ? c
          : {
              ...c,
              assignments: (c.assignments || []).map(x =>
                x.id !== a.id || (x.submissions || []).some(s => s.studentId === safeStudent.id)
                  ? x
                  : {
                      ...x,
                      submissions: [
                        ...(x.submissions || []),
                        {
                          studentId: safeStudent.id,
                          name: safeStudent.name,
                          score: res.total,
                          max: res.max,
                          items: res.items,
                          answers: res.answers,
                          submittedAt: new Date().toISOString(),
                          late
                        }
                      ]
                    }
              )
            }
      )
    );

    setPlaying(null);
    const targetClass = safeClasses.find(c => c.id === classId);
    setTestResult({
      score: res.total,
      max: res.max,
      title: a.title,
      className: targetClass?.name || ''
    });

    // ЗБЕРЕЖЕННЯ В БАЗУ SUPABASE
    await saveSubmissionToDb(a.id, safeStudent.id, safeStudent.name || 'Учень', res.total, res.max, res.items, res.answers, late);
  };

  if (playing) {
    const c = safeClasses.find(x => x.id === playing.classId);
    const a = c?.assignments?.find(x => x.id === playing.assignmentId);
    if (c && a) {
      return (
        <div className="space-y-4">
          <button onClick={() => setPlaying(null)} className="text-teal-600 hover:underline text-xs font-bold">
            ← Назад до завдань (скасувати тест)
          </button>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-teal-700">{c.name}</p>
            <h2 className="text-lg font-black text-slate-900">{a.title}</h2>
            {a.due && <p className="text-xs text-slate-500 mt-1">Термін: {fmtDate(a.due)}</p>}
          </div>
          <TestPlayer
            key={a.id}
            questions={a.questions}
            sessionCode={c.code}
            studentInfo={splitName(safeStudent.name)}
            onFinish={res => submit(c.id, a, res)}
          />
        </div>
      );
    }
  }

  const cls = safeClasses.find(c => c.id === openId && c.students?.some(s => s.id === safeStudent.id)) ?? null;

  if (cls) {
    const items: HwItem[] = (cls.assignments || [])
      .map(a => ({ cls, a, status: hwStatus(a, safeStudent.id), sub: subOf(a, safeStudent.id) }))
      .sort(sortHw);
    const todo = items.filter(i => i.status !== 'done').length;
    const avg = avgTwelve(journalOf(items).map(e => e.sub));

    return (
      <>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setOpenId(null)} className="text-teal-600 hover:underline text-xs font-bold mb-2 inline-block">
              ← Мої класи
            </button>
            <h2 className="text-2xl font-black text-slate-900">{cls.name}</h2>
            {cls.section && <p className="text-xs text-slate-500 mt-1">{cls.section}</p>}
          </div>

          <div className="grid lg:grid-cols-[18rem_1fr] gap-6 items-start">
            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">🎓 Мій клас</p>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Вчитель</span>
                    <span className="text-slate-800 text-right">{cls.teacherName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Учнів</span>
                    <span className="text-slate-800">{cls.students?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">До виконання</span>
                    <span className={todo > 0 ? 'text-red-600' : 'text-emerald-600'}>{todo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Моя середня</span>
                    <span className="text-teal-600">{avg === null ? '—' : avg.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => leaveClass(cls)}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Покинути клас
              </button>
            </aside>

            <section className="space-y-4 min-w-0">
              <Tabs value={classTab} onChange={setClassTab} items={CLASS_TABS} />

              {classTab === 'work' && (
                <div className="space-y-3">
                  {items.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
                      Вчитель ще не призначив домашніх тестів.
                    </div>
                  )}
                  {items.map(item => (
                    <HomeworkRow
                      key={item.a.id}
                      item={item}
                      showClass={false}
                      onStart={() => setPlaying({ classId: cls.id, assignmentId: item.a.id })}
                    />
                  ))}
                </div>
              )}

              {classTab === 'stream' && <Stream cls={cls} canPost={false} />}

              {classTab === 'journal' && (
                ent.features.journal ? (
                  <MyJournal entries={journalOf(items)} showClass={false} />
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-10 rounded-2xl text-center space-y-3 shadow-sm">
                    <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                    <h3 className="text-lg font-bold text-amber-900">Журнал недоступний</h3>
                    <p className="text-sm text-amber-700 max-w-sm mx-auto">Ця функція доступна лише у PRO-тарифі вчителя. Зверніться до викладача.</p>
                  </div>
                )
              )}
            </section>
          </div>
        </div>

        {testResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Тест завершено!</h2>
                <p className="text-sm text-slate-500 mt-1">{testResult.title}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ваш результат</p>
                <p className="text-5xl font-black text-teal-600">
                  {testResult.score} <span className="text-2xl text-slate-400">/ {testResult.max}</span>
                </p>
                <p className="text-sm font-bold text-slate-500 mt-2">
                  Це {Math.round((testResult.score / testResult.max) * 100) || 0}% правильних відповідей
                </p>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm"
              >
                Повернутися до завдань
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const filtered = filter === 'all' ? allHw : allHw.filter(h => h.status === filter);
  const viewItems: [StudentView, string][] = [
    ['classes', `🎓 Мої класи (${mine.length})`],
    ['homework', `📝 Домашні тести (${allHw.length})`],
    ['journal', '📒 Мій журнал']
  ];
  const pills: ['all' | HwStatus, string][] = [
    ['all', `Усі (${allHw.length})`],
    ['todo', `До виконання (${countOf('todo')})`],
    ['overdue', `Протерміновані (${countOf('overdue')})`],
    ['done', `Виконані (${countOf('done')})`]
  ];

  return (
    <>
      <div className="grid lg:grid-cols-[18rem_1fr] gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6">
          {/* ОНОВЛЕНИЙ БЛОК ПРИЄДНАННЯ */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">🔗 Приєднатися до класу</p>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Ваше ім’я та прізвище</label>
              <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Олена Шевченко" className={inp} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Код класу або посилання</label>
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') join(); }}
                placeholder="Напр. K7X2M9"
                className={`${inp} font-mono uppercase`}
              />
            </div>

            {/* ВІЗУАЛЬНЕ ПІДТВЕРДЖЕННЯ, ЩО КЛАС ЗНАЙДЕНО */}
            {targetClass && (
              <div className="bg-white border border-teal-200 rounded-xl p-3 flex items-start gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Знайдено клас:</p>
                  <p className="text-teal-700 font-bold">{targetClass.name}</p>
                  {isAlreadyJoined && <p className="text-slate-500 mt-0.5">Ви вже в цьому класі</p>}
                </div>
              </div>
            )}

            {joinError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5">{joinError}</p>
            )}
            
            <button
              onClick={join}
              disabled={!targetClass}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isAlreadyJoined ? 'Оновити ім\'я' : 'Приєднатися'}
            </button>
          </div>
        </aside>

        <section className="space-y-4 min-w-0">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Класи</h2>
              <p className="text-xs text-slate-500 mt-1">Ваші класи, домашні тести та журнал оцінок.</p>
            </div>
            <Tabs value={view} onChange={setView} items={viewItems} />
          </div>

          {view === 'classes' && (
            <>
              {mine.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-sm">
                  <div className="text-4xl">🎓</div>
                  <p className="text-sm font-bold text-slate-800">Ви ще не приєднались до жодного класу</p>
                  <p className="text-xs text-slate-500">Введіть код у лівій колонці або відкрийте посилання від вчителя.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {mine.map(c => {
                    const hw = (c.assignments || []).map(a => hwStatus(a, safeStudent.id));
                    const todo = hw.filter(s => s !== 'done').length;
                    const avg = avgTwelve((c.assignments || []).map(a => subOf(a, safeStudent.id)).filter((x): x is Submission => !!x));
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setOpenId(c.id); setClassTab('work'); }}
                        className="text-left bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-500/50 rounded-2xl shadow-sm overflow-hidden transition cursor-pointer"
                      >
                        <div className="h-2 bg-teal-600" />
                        <div className="p-5 space-y-3">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{c.teacherName}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full border ${
                                todo > 0
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              }`}
                            >
                              {todo > 0 ? `До виконання: ${todo}` : 'Усе виконано'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
                              середня: {avg === null ? '—' : avg.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view === 'homework' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {pills.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      filter === k
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500 shadow-sm">
                  {allHw.length === 0 ? 'Домашніх тестів поки немає.' : 'У цій категорії завдань немає.'}
                </div>
              )}
              {filtered.map(item => (
                <HomeworkRow
                  key={`${item.cls.id}-${item.a.id}`}
                  item={item}
                  showClass
                  onStart={() => setPlaying({ classId: item.cls.id, assignmentId: item.a.id })}
                />
              ))}
            </div>
          )}

          {view === 'journal' && (
            ent.features.journal ? (
              <MyJournal entries={journalOf(allHw)} showClass />
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-10 rounded-2xl text-center space-y-3 shadow-sm">
                <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-amber-900">Журнал недоступний</h3>
                <p className="text-sm text-amber-700 max-w-sm mx-auto">Ця функція доступна лише у PRO-тарифі вчителя. Зверніться до викладача.</p>
              </div>
            )
          )}
        </section>
      </div>

      {testResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Тест завершено!</h2>
              <p className="text-sm text-slate-500 mt-1">{testResult.title}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ваш результат</p>
              <p className="text-5xl font-black text-teal-600">
                {testResult.score} <span className="text-2xl text-slate-400">/ {testResult.max}</span>
              </p>
              <p className="text-sm font-bold text-slate-500 mt-2">
                Це {Math.round((testResult.score / testResult.max) * 100) || 0}% правильних відповідей
              </p>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-sm"
            >
              Повернутися до завдань
            </button>
          </div>
        </div>
      )}
    </>
  );
}