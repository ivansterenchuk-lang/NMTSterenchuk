import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  avgTwelve,
  fmtDate,
  generateCode,
  joinLink,
  allCodes,
  subOf,
  type Assignment,
  type ClassItem,
  type LibraryGroup,
  type Submission
} from '../lib/classroom';
import { Gradebook, Stream, Tabs, copyText } from './ClassroomShared';
import AssignmentDetail from './AssignmentDetail';
import { useAccess } from './AccessUI';
import { Lock, Users, FileText, Info } from 'lucide-react';

// ІМПОРТ ФУНКЦІЙ ДЛЯ БАЗИ ДАНИХ
import {
  createClassInDb,
  updateClassInDb,
  deleteClassFromDb,
  createAssignmentInDb,
  deleteAssignmentFromDb,
  removeStudentFromClass,
  addStudentToClass,
  createPostInDb,
  deletePostFromDb
} from '../lib/classroomRepository';

type Props = {
  classes: ClassItem[];
  setClasses: Dispatch<SetStateAction<ClassItem[]>>;
  teacherName: string;
  libraryGroups: LibraryGroup[];
};

type TeacherTab = 'stream' | 'work' | 'people' | 'journal';

const TABS: [TeacherTab, string][] = [
  ['stream', '📢 Стрічка'],
  ['work', '📝 Домашні тести'],
  ['people', '👥 Учні'],
  ['journal', '📒 Журнал']
];

const bands = ['bg-teal-500', 'bg-emerald-500', 'bg-blue-500'];

const inp = 'w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition';

export default function TeacherClasses({ classes, setClasses, teacherName, libraryGroups }: Props) {
  const { ent } = useAccess();

  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<TeacherTab>('stream');
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [openAsgId, setOpenAsgId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', section: '' });
  const [asg, setAsg] = useState<{ groupId: number | null; title: string; instructions: string; due: string }>({
    groupId: null,
    title: '',
    instructions: '',
    due: ''
  });

  const cls = classes.find(c => c.id === openId) ?? null;

  const update = (id: string, fn: (c: ClassItem) => ClassItem) =>
    setClasses(prev => prev.map(c => (c.id === id ? fn(c) : c)));

  const doCopy = async (what: 'code' | 'link', text: string) => {
    await copyText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  };

  const share = async (c: ClassItem) => {
    const url = joinLink(c.code);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Клас «${c.name}»`,
          text: `Приєднуйтесь до класу «${c.name}» на NMT-HUB. Код: ${c.code}`,
          url
        });
        return;
      } catch { /* користувач скасував */ }
    }
    doCopy('link', url);
  };

  const createClass = async () => {
    if (!form.name.trim()) return;
    
    const c: ClassItem = {
      id: `cls-${Date.now()}`,
      name: form.name.trim(),
      section: form.section.trim(),
      code: generateCode((classes || []).map(x => x.code)),
      teacherName,
      acceptJoins: true,
      students: [],
      assignments: [],
      posts: []
    };
    
    setClasses(prev => [c, ...prev]);
    setCreating(false);
    setForm({ name: '', section: '' });
    setOpenId(c.id);
    setTab('stream');

    await createClassInDb(c);
  };

  const deleteClass = async (c: ClassItem) => {
    if (confirm(`Видалити клас «${c.name}» разом із журналом? Цю дію не можна скасувати.`)) {
      setClasses(prev => prev.filter(x => x.id !== c.id));
      setOpenId(null);
      await deleteClassFromDb(c.id);
    }
  };

  const updateClassSettings = async (id: string, data: any) => {
    update(id, c => ({ ...c, ...data }));
    await updateClassInDb(id, data);
  };

  const openAssign = () => {
    setAsg({ groupId: null, title: '', instructions: '', due: '' });
    setAssigning(true);
  };

  const createAssignment = async () => {
    if (!cls) return;
    const group = libraryGroups.find(g => g.id === asg.groupId);
    if (!group || !asg.title.trim()) return;
    
    const id = `hw-${Date.now()}`;
    const now = new Date().toISOString();
    const a: Assignment = {
      id,
      title: asg.title.trim(),
      instructions: asg.instructions.trim() || undefined,
      due: asg.due || undefined,
      createdAt: now,
      questions: group.questions.map(q => ({ ...q })),
      submissions: []
    };

    update(cls.id, c => ({
      ...c,
      assignments: [...(c.assignments || []), a],
      posts: [
        { id: `p-${Date.now()}`, kind: 'assignment', text: `Нове домашнє завдання: ${a.title}`, assignmentId: id, createdAt: now },
        ...(c.posts || [])
      ]
    }));
    setAssigning(false);
    setTab('work');

    await createAssignmentInDb(cls.id, a);
  };

  const deleteAssignment = async (c: ClassItem, a: Assignment) => {
    if (!confirm(`Видалити завдання «${a.title}» та всі результати учнів?`)) return;
    
    update(c.id, x => ({
      ...x,
      assignments: (x.assignments || []).filter(y => y.id !== a.id),
      posts: (x.posts || []).filter(p => p.assignmentId !== a.id)
    }));

    await deleteAssignmentFromDb(a.id);
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!cls) return;
    if (confirm(`Видалити ${studentName} з класу?`)) {
      update(cls.id, c => ({ ...c, students: (c.students || []).filter(x => x.id !== studentId) }));
      await removeStudentFromClass(cls.id, studentId);
    }
  };

  if (!ent.features.classes) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-10 rounded-2xl text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-amber-900">Створення класів недоступне</h2>
        <p className="text-amber-700">Ця функція доступна лише у розширеному тарифі. Зверніться до адміністратора для активації.</p>
      </div>
    );
  }

  // ================= СПИСОК КЛАСІВ =================
  if (!cls) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Класи</h2>
            <p className="text-sm text-slate-500 mt-1">
              Створіть клас, поділіться посиланням з учнями, призначайте домашні тести й ведіть журнал оцінок.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
          >
            ➕ Створити клас
          </button>
        </div>

        {(classes || []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-slate-200">🎓</div>
            <div>
              <p className="text-lg font-bold text-slate-800">У вас ще немає класів</p>
              <p className="text-sm text-slate-500 mt-1">Натисніть «Створити клас» — отримаєте код і посилання для учнів.</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(classes || []).map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setOpenId(c.id); setTab('stream'); }}
                className="text-left bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-500/50 rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition cursor-pointer flex flex-col"
              >
                <div className={`h-1.5 w-full ${bands[i % bands.length]}`} />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{c.name}</h3>
                    {c.section && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{c.section}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {(c.students || []).length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {(c.assignments || []).length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-mono">
                      {c.code}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {creating && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Новий клас</h3>
                <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Назва класу</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') createClass(); }}
                    placeholder="Напр. 11-Б · Історія України"
                    className={inp}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Опис (необов’язково)</label>
                  <input
                    value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })}
                    placeholder="Напр. Підготовка до НМТ"
                    className={inp}
                  />
                </div>
                <button
                  onClick={createClass}
                  disabled={!form.name.trim()}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  Створити клас
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= ВІДКРИТИЙ КЛАС =================
  const detailA = openAsgId ? (cls.assignments || []).find(x => x.id === openAsgId) : undefined;
  if (detailA) {
    return (
      <AssignmentDetail
        cls={cls}
        a={detailA}
        usedCodes={allCodes(classes)}
        onBack={() => setOpenAsgId(null)}
        onChange={fn =>
          update(cls.id, c => ({ ...c, assignments: (c.assignments || []).map(x => (x.id === detailA.id ? fn(x) : x)) }))
        }
        onAddGuest={async (studentId, name) => {
          if ((cls.students || []).some(s => s.id === studentId)) return;
          update(cls.id, c => ({ ...c, students: [...(cls.students || []), { id: studentId, name }] }));
          await addStudentToClass(cls.id, studentId, name);
        }}
        onDelete={() => {
          deleteAssignment(cls, detailA);
          setOpenAsgId(null);
        }}
      />
    );
  }

  const link = joinLink(cls.code);
  const allSubs = (cls.assignments || []).flatMap(a => (a.submissions || []).filter(s => (cls.students || []).some(st => st.id === s.studentId)));
  const classAvg = avgTwelve(allSubs);
  const selectedGroup = libraryGroups.find(g => g.id === asg.groupId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={() => setOpenId(null)} className="text-teal-600 hover:underline text-xs font-bold mb-2 inline-flex items-center gap-1">
            ← Усі класи
          </button>
          <h2 className="text-2xl font-black text-slate-900">{cls.name}</h2>
          {cls.section && <p className="text-sm text-slate-500 mt-1">{cls.section}</p>}
        </div>
        <button
          onClick={() => deleteClass(cls)}
          className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          🗑️ Видалити клас
        </button>
      </div>

      <div className="grid lg:grid-cols-[20rem_1fr] gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6">
          {/* ОНОВЛЕНИЙ БЛОК ЗАПРОШЕННЯ */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">🔗 Запрошення до класу</p>

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500">Код класу</p>
              <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-amber-200">
                <span className="font-mono text-2xl font-black text-slate-900 tracking-[0.15em] pl-2">{cls.code}</span>
                <button
                  onClick={() => doCopy('code', cls.code)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {copied === 'code' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500">Посилання для учнів</p>
              <input
                readOnly
                value={link}
                onFocus={e => e.currentTarget.select()}
                className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-[11px] text-slate-600 font-mono focus:outline-none"
              />
              
              <div className="bg-amber-100/50 p-2.5 rounded-lg border border-amber-200/60 flex gap-2 items-start mt-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-medium leading-tight">
                  Учневі достатньо перейти за цим посиланням. Код класу введеться <b>автоматично</b>.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => doCopy('link', link)}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  {copied === 'link' ? '✓ Скопійовано' : '📋 Копіювати посилання'}
                </button>
                <button
                  onClick={() => share(cls)}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  📤 Поділитися
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-amber-200/50">
              <span>Приймати нових учнів</span>
              <input
                type="checkbox"
                checked={cls.acceptJoins}
                onChange={() => updateClassSettings(cls.id, { acceptJoins: !cls.acceptJoins })}
                className="accent-teal-600 w-5 h-5 rounded cursor-pointer"
              />
            </label>

            <button
              onClick={() => {
                if (confirm('Створити новий код? Старе посилання перестане працювати.')) {
                  updateClassSettings(cls.id, { code: generateCode((classes || []).map(x => x.code)) });
                }
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
            >
              ↻ Скинути код і посилання
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-sm">
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Учнів</span>
              <span className="text-slate-900">{(cls.students || []).length}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Домашніх тестів</span>
              <span className="text-slate-900">{(cls.assignments || []).length}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-slate-100">
              <span className="text-slate-500">Середня оцінка</span>
              <span className="text-teal-600 text-lg">{classAvg === null ? '—' : classAvg.toFixed(1)}</span>
            </div>
          </div>
        </aside>

        <section className="space-y-4 min-w-0">
          <Tabs value={tab} onChange={setTab} items={TABS} />

          {tab === 'stream' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <Stream
                cls={cls}
                canPost
                onPost={async (text) => {
                  const newPost = {
                    id: `p-${Date.now()}`,
                    kind: 'note',
                    text,
                    createdAt: new Date().toISOString()
                  };
                  update(cls.id, c => ({
                    ...c,
                    posts: [newPost, ...(c.posts || [])]
                  }));
                  await createPostInDb(cls.id, newPost);
                }}
                onDelete={async (id) => {
                  update(cls.id, c => ({ ...c, posts: (c.posts || []).filter(p => p.id !== id) }));
                  await deletePostFromDb(id);
                }}
              />
            </div>
          )}

          {tab === 'work' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={openAssign}
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  ➕ Призначити тест
                </button>
              </div>

              {(cls.assignments || []).length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500 shadow-sm">
                  Ще немає домашніх тестів. Призначте перший із вашої бібліотеки.
                </div>
              )}

              {[...(cls.assignments || [])]
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                .map(a => {
                  const done = (a.submissions || []).filter(s => (cls.students || []).some(st => st.id === s.studentId));
                  const total = (cls.students || []).length;
                  const ratio = total ? Math.round((done.length / total) * 100) : 0;
                  const avg = avgTwelve(done);
                  return (
                    <div key={a.id} onClick={() => setOpenAsgId(a.id)} className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-500/50 rounded-2xl shadow-sm hover:shadow-md p-5 space-y-4 cursor-pointer transition">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <h4 className="font-bold text-base text-slate-900">{a.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {(a.questions || []).length} пит. · {a.due ? `термін: ${fmtDate(a.due)}` : 'без терміну'}
                          </p>
                          {a.instructions && <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">{a.instructions}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setTab('journal'); }}
                            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            📒 Журнал
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteAssignment(cls, a); }}
                            className="px-3 py-2 text-slate-400 hover:text-rose-600 transition cursor-pointer bg-white hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100"
                            title="Видалити завдання"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>Здали {done.length} з {total}</span>
                          {avg !== null && <span>Середня: <b className="text-teal-600">{avg.toFixed(1)}</b></span>}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {tab === 'people' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {(cls.students || []).length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="text-4xl text-slate-300">👥</div>
                  <p className="text-sm font-bold text-slate-700">Учнів ще немає</p>
                  <p className="text-xs text-slate-500">Надішліть їм код <b>{cls.code}</b> або посилання з лівої колонки.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(cls.students || []).map(s => {
                    const mine = (cls.assignments || []).map(a => subOf(a, s.id)).filter((x): x is Submission => !!x);
                    const avg = avgTwelve(mine);
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                            {s.name.charAt(0)}
                          </span>
                          <span className="font-bold text-sm text-slate-800 truncate">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs text-slate-500 font-bold">
                            середня: <b className="text-teal-600 text-sm">{avg === null ? '—' : avg.toFixed(1)}</b>
                          </span>
                          <button
                            onClick={() => handleRemoveStudent(s.id, s.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Видалити з класу"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'journal' && (
            ent.features.journal ? (
              <Gradebook cls={cls} />
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-10 rounded-2xl text-center space-y-3">
                <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-amber-900">Журнал оцінок недоступний</h3>
                <p className="text-sm text-amber-700 max-w-sm mx-auto">Ця функція доступна лише у розширеному тарифі. Зверніться до адміністратора.</p>
              </div>
            )
          )}
        </section>
      </div>

      {assigning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Призначити домашній тест</h3>
                <p className="text-xs text-slate-500 mt-0.5">Клас: {cls.name}</p>
              </div>
              <button onClick={() => setAssigning(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Тест із вашої бібліотеки</label>
                {libraryGroups.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    У бібліотеці немає груп із питаннями. Створіть питання у вкладці «Моя бібліотека», а потім поверніться сюди.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {libraryGroups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setAsg(s => ({ ...s, groupId: g.id, title: g.title }))}
                        className={`w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 text-sm transition cursor-pointer ${
                          asg.groupId === g.id
                            ? 'bg-teal-50 border-teal-500 text-teal-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold">{g.title}</span>
                        <span className="text-xs font-bold text-slate-500 shrink-0">{(g.questions || []).length} пит.</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedGroup && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Назва завдання</label>
                    <input value={asg.title} onChange={e => setAsg({ ...asg, title: e.target.value })} className={inp} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Інструкція (необов’язково)</label>
                    <textarea
                      value={asg.instructions}
                      onChange={e => setAsg({ ...asg, instructions: e.target.value })}
                      rows={2}
                      className={`${inp} resize-none`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Термін здачі (необов’язково)</label>
                    <input type="date" value={asg.due} onChange={e => setAsg({ ...asg, due: e.target.value })} className={inp} />
                  </div>
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Учні отримають копію питань на момент призначення — подальші зміни в бібліотеці їх не зачеплять.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={createAssignment}
                disabled={!selectedGroup || !asg.title.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Призначити класу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}