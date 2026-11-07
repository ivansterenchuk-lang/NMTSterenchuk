import React, { useEffect, useRef, useState } from 'react';
import './theme.css';
import QuestionBuilder from './components/QuestionBuilder';
import QuestionCard from './components/QuestionCard';
import CommunitySearch from './components/CommunitySearch';
import TeacherClasses from './components/TeacherClasses';
import StudentClasses from './components/StudentClasses';
import TestPlayer from './components/TestPlayer';
import SessionBasket from './components/SessionBasket';
import SessionBuilder from './components/SessionBuilder';
import AssignModal from './components/AssignModal';
import AdminConsole, { AdminLogin } from './components/AdminConsole';
import { AccessBadge, AccessProvider, GuardButton, PrintButton } from './components/AccessUI';
import type { Question } from './lib/nmt';
import { COMMUNITY_TESTS } from './lib/communityData';
import { sessionMatches, sessionRank, stripCode, type PublicTest } from './lib/search';
import { printHtml, sessionStudentHtml } from './lib/pdf';
import {
  ME_ID,
  addAssignment,
  findSession,
  loadClasses,
  normalizeCode,
  readJoinParam,
  saveClasses,
  splitName,
  type ClassItem,
  type LibraryGroup
} from './lib/classroom';
import {
  ACCOUNTS_KEY,
  CURRENT_TEACHER_ID,
  SETTINGS_KEY,
  getEntitlement,
  isAdminSession,
  loadAccounts,
  loadSettings,
  saveAccounts,
  saveSettings,
  setAdminSession,
  type PlatformSettings,
  type TeacherAccount
} from './lib/access';

type LibraryItem = {
  id: number;
  title: string;
  type: 'group' | 'folder';
  questions?: Question[];
  isPublic?: boolean;
};

type SessionItem = {
  id: string;
  title: string;
  tag: string;
  studentsCount: number;
  date: string;
  status: 'Активна' | 'Завершена';
  questions?: Question[];
};

type StudentResult = {
  id: number;
  name: string;
  scorePercent: number;
  answers: boolean[];
};

type Tab = 'library' | 'sessions' | 'community' | 'classes' | 'profile';

const TEACHER_TABS: [Tab, string][] = [
  ['library', 'МОЯ БІБЛІОТЕКА'],
  ['sessions', 'СЕСІЇ'],
  ['community', 'ЗАГАЛЬНА БАЗА'],
  ['classes', 'КЛАСИ']
];

export default function App() {
  // ---------- Маршрут адміністратора (прихована адреса #admin) ----------
  const [route, setRoute] = useState<string>(() => window.location.hash);
  useEffect(() => {
    const h = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const [adminAuthed, setAdminAuthed] = useState<boolean>(isAdminSession);

  // ---------- Акаунти та налаштування платформи ----------
  const [accounts, setAccounts] = useState<TeacherAccount[]>(loadAccounts);
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings);
  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCOUNTS_KEY) setAccounts(loadAccounts());
      if (e.key === SETTINGS_KEY) setSettings(loadSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const me = accounts.find(a => a.id === CURRENT_TEACHER_ID);
  const ent = getEntitlement(me, settings);

  // Якщо відкрито посилання-запрошення (?join=КОД) — одразу режим учня
  const [userRole, setUserRole] = useState<'student' | 'teacher'>(() => (readJoinParam() ? 'student' : 'teacher'));
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [studentTab, setStudentTab] = useState<'classes' | 'test'>('classes');

  const [selectedFolder, setSelectedFolder] = useState<LibraryItem | null>(null);
  const [selectedSessionForLive, setSelectedSessionForLive] = useState<SessionItem | null>(null);

  // Створення / редагування питання
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Призначення тесту з загальної бази
  const [assignSource, setAssignSource] = useState<PublicTest | null>(null);

  // ---------- Збірка питань для сесії ----------
  const [basket, setBasket] = useState<Question[]>(() => {
    try {
      const raw = localStorage.getItem('nmt-basket-v1');
      const v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? (v as Question[]) : [];
    } catch {
      return [];
    }
  });
  const [basketFlash, setBasketFlash] = useState(false);
  const [builderSessionId, setBuilderSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('nmt-basket-v1', JSON.stringify(basket));
    } catch {
      /* ігноруємо */
    }
  }, [basket]);

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 2400);
  };

  const addToBasket = (qs: Question[]) => {
    const have = new Set(basket.map(q => q.id));
    const fresh = qs.filter(q => !have.has(q.id));
    if (fresh.length === 0) {
      notify('Ці питання вже є у збірці');
      return;
    }
    setBasket([...basket, ...fresh.map(q => ({ ...q }))]);
    setBasketFlash(true);
    window.setTimeout(() => setBasketFlash(false), 1400);
    notify(`Додано до збірки: ${fresh.length} · усього ${basket.length + fresh.length}`);
  };

  // ---------- Пошук ----------
  const [sessionQuery, setSessionQuery] = useState('');
  const [sessionStatus, setSessionStatus] = useState<'all' | 'Активна' | 'Завершена'>('all');
  const [communityQuery, setCommunityQuery] = useState('');
  const [globalQuery, setGlobalQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [userInfo] = useState({
    firstName: 'Іван',
    lastName: 'Стеренчук',
    email: 'ivansterenchuk@gmail.com'
  });
  const teacherFullName = `${userInfo.firstName} ${userInfo.lastName}`;

  // ---------- Класи (зберігаються в браузері) ----------
  const [classes, setClasses] = useState<ClassItem[]>(loadClasses);
  useEffect(() => {
    saveClasses(classes);
  }, [classes]);

  // ---------- Учень ----------
  const [studentName, setStudentName] = useState<string>(() => {
    try {
      return localStorage.getItem('nmt-student-name') ?? '';
    } catch {
      return '';
    }
  });
  const changeStudentName = (n: string) => {
    setStudentName(n);
    try {
      localStorage.setItem('nmt-student-name', n);
    } catch {
      /* ігноруємо */
    }
  };
  const [pendingJoin, setPendingJoin] = useState<string>(readJoinParam);
  const consumeJoin = () => {
    setPendingJoin('');
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      /* ігноруємо */
    }
  };

  const [isStudentInTest, setIsStudentInTest] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([
    { id: 1, title: '1.1. 1914 – 1945 рр.', type: 'group', questions: [] },
    { id: 2, title: '1.2. 1945 р. – початок XXI ст.', type: 'group', questions: [] },
    { id: 3, title: '2.1. Від найдавніших часів – перша половина XVI ст.', type: 'group', questions: [] },
    { id: 4, title: 'Історія 10 клас', type: 'folder', questions: [] },
    { id: 5, title: 'Історія України. Завдання за роками', type: 'group', questions: [] }
  ]);

  const [activeSessions, setActiveSessions] = useState<SessionItem[]>([
    { id: 'ERUZTN', title: 'Козацька Україна наприкінці 50 – 80-х рр. XVII ст. & Українські землі в другій пол...', tag: 'ЗНО 2026', studentsCount: 7, date: '29 жовт. 2026 р.', status: 'Активна', questions: [] },
    { id: 'RCQXXH', title: 'Українські землі у складі Речі Посполитої', tag: 'Історія', studentsCount: 4, date: '29 жовт. 2026 р.', status: 'Активна', questions: [] },
    { id: 'GVH59A', title: 'Національно-визвольна війна українського народу середини XVII ст.', tag: 'Блок НМТ', studentsCount: 1, date: '28 жовт. 2026 р.', status: 'Завершена', questions: [] },
    { id: '83ATZ6', title: 'До середини XVII ст', tag: 'Тест №1', studentsCount: 1, date: '22 жовт. 2026 р.', status: 'Завершена', questions: [] }
  ]);

  const [liveStudentsData] = useState<StudentResult[]>([
    { id: 1, name: 'Аня Романюк', scorePercent: 83, answers: [true, true, true, true, true, true, true, true, true, true, true, false, true, true] },
    { id: 2, name: 'Арсен Клімарчук', scorePercent: 43, answers: [true, true, true, true, true, true, true, false, true, false, false, false, true, true] },
    { id: 3, name: 'Величко Михайло', scorePercent: 17, answers: [false, false, true, false, true, false, false, true, false, false, false, false, false, false] },
    { id: 4, name: 'Іван Лагода', scorePercent: 37, answers: [true, false, true, true, true, true, false, false, false, false, false, false, false, false] },
    { id: 5, name: 'Ілля Довжик', scorePercent: 50, answers: [true, true, true, true, true, true, false, true, true, false, false, false, false, false] },
    { id: 6, name: 'Кузьмич Максим', scorePercent: 83, answers: [false, true, true, true, true, true, true, true, true, true, true, true, false, true] },
    { id: 7, name: 'Лагоди Денис', scorePercent: 77, answers: [true, true, true, true, true, true, true, false, true, true, true, true, false, true] }
  ]);

  // ---------- Похідні дані ----------
  const visibleSessions = activeSessions
    .filter(s => (sessionStatus === 'all' || s.status === sessionStatus) && sessionMatches(s, sessionQuery))
    .sort((a, b) => sessionRank(a, sessionQuery) - sessionRank(b, sessionQuery));

  const ownPublicTests: PublicTest[] = libraryItems
    .filter(i => i.isPublic && (i.questions?.length ?? 0) > 0)
    .map(i => ({
      id: `own-${i.id}`,
      title: i.title,
      author: teacherFullName,
      subject: (i.questions as Question[])[0].subject,
      tags: ['Мій тест'],
      updated: 'щойно',
      questions: i.questions as Question[],
      isOwn: true
    }));
  const allPublicTests: PublicTest[] = [...ownPublicTests, ...COMMUNITY_TESTS];

  const libraryGroups: LibraryGroup[] = libraryItems
    .filter(i => (i.questions?.length ?? 0) > 0)
    .map(i => ({ id: i.id, title: i.title, questions: i.questions as Question[] }));

  const studentFullName = studentName || 'Учень';

  // ---------- Сесії ----------
  const startSessionFromBasket = (title: string) => {
    if (basket.length === 0) return;
    let code = '';
    do {
      code = 'NMT-' + Math.floor(1000 + Math.random() * 9000);
    } while (activeSessions.some(s => s.id === code));
    setActiveSessions(prev => [
      {
        id: code,
        title: title.trim() || `Сесія від ${new Date().toLocaleDateString('uk-UA')}`,
        tag: 'НМТ',
        studentsCount: 0,
        date: 'Сьогодні',
        status: 'Активна',
        questions: basket
      },
      ...prev
    ]);
    setBasket([]);
    setBuilderSessionId(code);
  };

  const createSession = (): string => {
    const code = 'NMT-' + Math.floor(1000 + Math.random() * 9000);
    setActiveSessions([
      { id: code, title: 'Новий тест з історії України та методики НМТ', tag: 'НМТ', studentsCount: 0, date: 'Сьогодні', status: 'Активна', questions: [] },
      ...activeSessions
    ]);
    return code;
  };

  const exportStudentPdf = (student: StudentResult) => {
    printHtml(
      sessionStudentHtml({
        studentName: student.name,
        sessionTitle: selectedSessionForLive?.title ?? 'Тестування НМТ',
        percent: student.scorePercent,
        answers: student.answers,
        questions: selectedSessionForLive?.questions ?? [],
        teacher: teacherFullName
      }),
      `Результат — ${student.name}`
    );
  };

  // Швидкий пошук у шапці
  const runGlobalSearch = () => {
    const q = globalQuery.trim();
    if (!q) return;
    setSelectedFolder(null);

    const exact = activeSessions.find(s => stripCode(s.id) === stripCode(q));
    if (exact) {
      setSelectedSessionForLive(exact);
      setActiveTab('sessions');
      setGlobalQuery('');
      return;
    }
    if (stripCode(q).length >= 2 && activeSessions.some(s => sessionRank(s, q) < 3)) {
      setSelectedSessionForLive(null);
      setSessionQuery(q);
      setSessionStatus('all');
      setActiveTab('sessions');
      return;
    }
    setSelectedSessionForLive(null);
    setCommunityQuery(q);
    setActiveTab('community');
  };

  // ---------- Бібліотека ----------
  const createNewFolder = () => {
    const title = prompt('Введіть назву нової папки:');
    if (title && title.trim() !== '') {
      setLibraryItems([...libraryItems, { id: Date.now(), title: title.trim(), type: 'folder', questions: [] }]);
    }
  };

  const deleteLibraryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Ви впевнені, що хочете видалити цей елемент?')) {
      setLibraryItems(libraryItems.filter(item => item.id !== id));
      if (selectedFolder && selectedFolder.id === id) setSelectedFolder(null);
    }
  };

  const createNewGroupInLibrary = () => {
    const title = prompt('Введіть назву нової групи питань (тесту):');
    if (title && title.trim() !== '') {
      setLibraryItems([...libraryItems, { id: Date.now(), title: title.trim(), type: 'group', questions: [] }]);
    }
  };

  const togglePublic = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = libraryItems.find(i => i.id === id);
    if (!item) return;
    if (!item.isPublic && (item.questions?.length ?? 0) === 0) {
      alert('Спершу додайте хоча б одне питання, а потім відкривайте доступ.');
      return;
    }
    const updated: LibraryItem = { ...item, isPublic: !item.isPublic };
    setLibraryItems(libraryItems.map(i => (i.id === id ? updated : i)));
    if (selectedFolder?.id === id) setSelectedFolder(updated);
  };

  const importPublicTest = (t: PublicTest) => {
    const base = Date.now();
    const copy: LibraryItem = {
      id: base,
      title: `${t.title} (від ${t.author})`,
      type: 'group',
      isPublic: false,
      questions: t.questions.map((q, i) => ({ ...q, id: base + i + 1 }))
    };
    setLibraryItems([...libraryItems, copy]);
    alert(`Тест «${t.title}» додано до вашої бібліотеки (${t.questions.length} пит.).`);
  };

  const openNewQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = (q: Question) => {
    if (!selectedFolder) return;
    const current = selectedFolder.questions || [];
    const exists = current.some(x => x.id === q.id);
    const updatedQuestions = exists ? current.map(x => (x.id === q.id ? q : x)) : [...current, q];
    const updatedFolderItem: LibraryItem = { ...selectedFolder, questions: updatedQuestions };
    setSelectedFolder(updatedFolderItem);
    setLibraryItems(libraryItems.map(i => (i.id === updatedFolderItem.id ? updatedFolderItem : i)));
    if (exists) {
      setActiveSessions(prev => prev.map(s => ({ ...s, questions: (s.questions || []).map(x => (x.id === q.id ? q : x)) })));
    }
    if (!exists) setExpandedQuestionId(q.id);
    closeQuestionModal();
  };

  const deleteQuestionFromActiveItem = (questionId: number) => {
    if (confirm('Видалити це запитання?') && selectedFolder) {
      const updatedFolderItem = { ...selectedFolder, questions: (selectedFolder.questions || []).filter(q => q.id !== questionId) };
      setSelectedFolder(updatedFolderItem);
      setLibraryItems(libraryItems.map(item => (item.id === selectedFolder.id ? updatedFolderItem : item)));
      if (expandedQuestionId === questionId) setExpandedQuestionId(null);
    }
  };

  // ---------- Учень: вхід за кодом сесії ----------
  const studentSession = activeSessions.find(s => stripCode(s.id) === stripCode(sessionCode));
  const classSession = findSession(classes, normalizeCode(sessionCode));

  const startStudentTest = () => {
    if (classSession && !studentSession) {
      if (!classSession.a.session?.open) {
        alert('Ця сесія зачинена вчителем.');
        return;
      }
      if (classSession.a.submissions.some(s => s.studentId === ME_ID)) {
        alert('Ви вже виконували цей тест.');
        return;
      }
      setIsStudentInTest(true);
      return;
    }
    if (!sessionCode.trim()) {
      alert('Введіть код сесії!');
      return;
    }
    if (!studentSession) {
      alert('Сесію з таким кодом не знайдено.');
      return;
    }
    if (studentSession.status === 'Завершена') {
      alert('Ця сесія вже завершена.');
      return;
    }
    if (!studentSession.questions || studentSession.questions.length === 0) {
      alert('У цій сесії ще немає питань. Зверніться до вчителя.');
      return;
    }
    setIsStudentInTest(true);
  };

  const goTab = (tab: Tab) => {
    setSelectedSessionForLive(null);
    setSelectedFolder(null);
    setActiveTab(tab);
  };

  const navCls = (tab: Tab) =>
    `transition cursor-pointer py-1 ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`;

  // ---------- Консоль адміністратора ----------
  const exitAdmin = () => {
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      /* ігноруємо */
    }
    setRoute('');
  };

  if (route === '#admin' || route.startsWith('#admin/')) {
    if (!adminAuthed) {
      return (
        <AdminLogin
          onSuccess={() => {
            setAdminSession(true);
            setAdminAuthed(true);
          }}
          onExit={exitAdmin}
        />
      );
    }
    return (
      <AdminConsole
        accounts={accounts}
        setAccounts={setAccounts}
        settings={settings}
        setSettings={setSettings}
        library={libraryItems.map(i => ({ id: i.id, title: i.title, type: i.type, count: i.questions?.length ?? 0 }))}
        onDeleteLibrary={id => setLibraryItems(prev => prev.filter(i => i.id !== id))}
        onLogout={() => {
          setAdminSession(false);
          setAdminAuthed(false);
          exitAdmin();
        }}
        onExit={exitAdmin}
      />
    );
  }

  const displayFirstName = userRole === 'student' ? splitName(studentFullName).firstName : userInfo.firstName;

  return (
    <AccessProvider ent={ent} teacherName={teacherFullName}>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
        <header className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { if (userRole !== 'student') goTab('library'); }}>
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                ⚡
              </div>
              <div>
                <span className="font-black text-lg tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">NMT-HUB</span>
                <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Екзаменаційна система</span>
              </div>
            </div>

            {userRole === 'teacher' && (
              <nav className="hidden md:flex items-center space-x-4 text-xs font-bold tracking-wider">
                {TEACHER_TABS.map(([t, label]) => (
                  <button key={t} onClick={() => goTab(t)} className={navCls(t)}>{label}</button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {userRole === 'teacher' && (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    ref={searchRef}
                    value={globalQuery}
                    onChange={e => setGlobalQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') runGlobalSearch(); }}
                    placeholder="Код сесії або слова… (Ctrl+K)"
                    className="w-56 xl:w-72 pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
                <AccessBadge />
              </>
            )}

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button onClick={() => { setUserRole('student'); setIsStudentInTest(false); }} className={`px-3 py-1.5 rounded-lg transition ${userRole === 'student' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Учень</button>
              <button onClick={() => setUserRole('teacher')} className={`px-3 py-1.5 rounded-lg transition ${userRole === 'teacher' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Вчитель</button>
            </div>

            <div
              className="flex items-center space-x-2.5 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition"
              onClick={() => { if (userRole === 'teacher') goTab('profile'); }}
            >
              <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow">
                {displayFirstName.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-200">{displayFirstName}</span>
            </div>
          </div>
        </header>

        {userRole === 'teacher' && (
          <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] font-bold">
            {TEACHER_TABS.map(([t, label]) => (
              <button
                key={t}
                onClick={() => goTab(t)}
                className={`shrink-0 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === t ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {userRole === 'student' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {([['classes', '🎓 Класи'], ['test', '🎯 Тест за кодом']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => { setStudentTab(k); setIsStudentInTest(false); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      studentTab === k
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {studentTab === 'classes' ? (
                <StudentClasses
                  classes={classes}
                  setClasses={setClasses}
                  student={{ id: ME_ID, name: studentName }}
                  onStudentNameChange={changeStudentName}
                  joinCode={pendingJoin}
                  onJoinConsumed={consumeJoin}
                />
              ) : !isStudentInTest ? (
                <div className="bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 p-8 text-center max-w-md mx-auto my-12 space-y-6">
                  <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-800/50">🎯</div>
                  <h2 className="text-2xl font-bold text-white">Вхід на тестування</h2>
                  <input
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') startStudentTest(); }}
                    placeholder="Введіть код сесії (напр. NMT-2026)"
                    className="w-full p-3.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-center font-bold text-lg uppercase focus:border-emerald-500 focus:outline-none transition"
                  />
                  <button onClick={startStudentTest} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer">
                    Розпочати тестування 🚀
                  </button>
                </div>
              ) : (
                <TestPlayer
                  questions={studentSession?.questions ?? classSession?.a.questions ?? []}
                  sessionCode={sessionCode}
                  studentInfo={splitName(studentFullName)}
                  onFinish={(res) => {
                    if (!classSession || studentSession) return;
                    const { cls: cc, a: aa } = classSession;
                    setClasses(prev =>
                      prev.map(c =>
                        c.id !== cc.id
                          ? c
                          : {
                              ...c,
                              assignments: c.assignments.map(x =>
                                x.id !== aa.id || x.submissions.some(s => s.studentId === ME_ID)
                                  ? x
                                  : {
                                      ...x,
                                      submissions: [
                                        ...x.submissions,
                                        {
                                          studentId: ME_ID,
                                          name: studentFullName,
                                          score: res.total,
                                          max: res.max,
                                          items: res.items,
                                          answers: res.answers,
                                          submittedAt: new Date().toISOString()
                                        }
                                      ]
                                    }
                              )
                            }
                      )
                    );
                  }}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {selectedFolder ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                    <div>
                      <button onClick={() => { setSelectedFolder(null); setExpandedQuestionId(null); }} className="text-indigo-400 hover:underline text-xs font-bold mb-2 inline-block">← Моя Бібліотека</button>
                      <h2 className="text-2xl font-black text-white flex items-center space-x-2">
                        <span>{selectedFolder.type === 'folder' ? '📁' : '📚'}</span> <span>Моя Бібліотека &gt; {selectedFolder.title}</span>
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => togglePublic(selectedFolder.id)}
                        title="Публічні тести бачать і можуть копіювати інші викладачі"
                        className={`px-4 py-3 font-bold text-xs rounded-xl transition cursor-pointer border ${
                          selectedFolder.isPublic
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        {selectedFolder.isPublic ? '🌐 Публічний доступ' : '🔒 Приватний'}
                      </button>
                      {selectedFolder.questions && selectedFolder.questions.length > 0 && (
                        <>
                          <PrintButton
                            title={selectedFolder.title}
                            questions={selectedFolder.questions}
                            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            📄 PDF для друку
                          </PrintButton>
                          <button
                            onClick={() => addToBasket(selectedFolder.questions || [])}
                            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            ➕ Усю групу до сесії
                          </button>
                        </>
                      )}
                      <button
                        onClick={openNewQuestion}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
                      >
                        <span>+ Нове Питання</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-3">
                    {selectedFolder.questions && selectedFolder.questions.length > 0 ? (
                      selectedFolder.questions.map((q, idx) => (
                        <QuestionCard
                          key={q.id}
                          q={q}
                          index={idx}
                          expanded={expandedQuestionId === q.id}
                          onToggle={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                          onEdit={() => { setEditingQuestion(q); setIsQuestionModalOpen(true); }}
                          onDelete={() => deleteQuestionFromActiveItem(q.id)}
                          onAddToSession={() => addToBasket([q])}
                        />
                      ))
                    ) : (
                      <div className="py-12 space-y-4 text-center">
                        <div className="w-20 h-20 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-slate-800">📄</div>
                        <p className="text-slate-400 text-sm font-medium">Ця Група питань порожня. Створіть нове питання!</p>
                        <button
                          onClick={openNewQuestion}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition inline-flex items-center space-x-2 cursor-pointer"
                        >
                          <span>+ Нове Питання</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedSessionForLive ? (
                <div className="space-y-6">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <button onClick={() => setSelectedSessionForLive(null)} className="text-indigo-400 hover:underline font-bold">← Назад до списку сесій</button>
                        <span>•</span>
                        <span className="text-slate-300">Моніторинг в реальному часі</span>
                      </div>
                      <h2 className="text-lg font-black text-white">{selectedSessionForLive.title}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 space-x-3">
                        <span className="font-mono font-black text-indigo-400 text-sm tracking-wider">{selectedSessionForLive.id}</span>
                        <button onClick={() => { navigator.clipboard.writeText(selectedSessionForLive.id); alert('Код сесії скопійовано!'); }} className="text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer">📋</button>
                      </div>
                      <button onClick={() => setIsPaused(!isPaused)} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${isPaused ? 'bg-amber-600 text-white' : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'}`}>
                        <span>{isPaused ? '▶️ Відновити' : '⏸️ На паузу'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 px-6 py-4 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                      <span className="font-bold text-slate-200">УЧНІВ У СЕСІЇ: <b className="text-emerald-400">{liveStudentsData.length}</b></span>
                    </div>
                    <div className="text-slate-400">
                      Статус: <b className={isPaused ? 'text-amber-400' : 'text-emerald-400'}>{isPaused ? 'Сесія зупинена ⏸️' : 'Спостереження активне 🟢'}</b>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                          <th className="p-4 w-52">Учень / Учениця</th>
                          <th className="p-4 text-center w-28">Результат</th>
                          {Array.from({ length: 14 }, (_, i) => (
                            <th key={i} className="p-2 text-center border-l border-slate-800/60 font-mono text-indigo-300 text-xs">
                              №{i + 1}
                            </th>
                          ))}
                          <th className="p-4 text-center border-l border-slate-800 w-40">Звіт PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {liveStudentsData.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-900/50 transition">
                            <td className="p-4 font-bold text-slate-200 flex items-center space-x-2.5">
                              <span className="w-7 h-7 bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                                {student.name.charAt(0)}
                              </span>
                              <span>{student.name}</span>
                            </td>
                            <td className="p-4 text-center font-black text-indigo-400">
                              {student.scorePercent}%
                            </td>
                            {student.answers.map((isCorrect, qIdx) => (
                              <td key={qIdx} className="p-2 text-center border-l border-slate-800/40">
                                {isCorrect ? (
                                  <div className="w-7 h-7 mx-auto bg-emerald-950 border border-emerald-800/80 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs">✓</div>
                                ) : (
                                  <div className="w-7 h-7 mx-auto bg-rose-950 border border-rose-800/80 text-rose-400 rounded-lg flex items-center justify-center font-bold text-xs">✕</div>
                                )}
                              </td>
                            ))}
                            <td className="p-4 text-center border-l border-slate-800">
                              <GuardButton
                                onAction={() => exportStudentPdf(student)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                              >
                                📄 Зберегти PDF
                              </GuardButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'sessions' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                        <div>
                          <h2 className="text-2xl font-black text-white tracking-wide">Активні Сесії Тестування</h2>
                          <p className="text-xs text-slate-400 mt-1">Натисніть на сесію, щоб відкрити живий моніторинг виконання та завантажити результати учнів у PDF.</p>
                        </div>
                        <button
                          onClick={() => { const code = createSession(); alert(`Нову сесію успішно згенеровано! Код: ${code}`); }}
                          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 cursor-pointer"
                        >
                          <span>➕ Згенерувати нову сесію</span>
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                          <input
                            value={sessionQuery}
                            onChange={e => setSessionQuery(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && visibleSessions.length === 1) setSelectedSessionForLive(visibleSessions[0]); }}
                            placeholder="Пошук сесії за кодом, назвою або міткою (напр. ERU, nmt1234, козацька)"
                            className="w-full pl-11 pr-10 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition"
                          />
                          {sessionQuery && (
                            <button
                              onClick={() => setSessionQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                              title="Очистити"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex gap-2">
                            {([
                              ['all', 'Усі'],
                              ['Активна', 'Активні'],
                              ['Завершена', 'Завершені']
                            ] as const).map(([val, label]) => (
                              <button
                                key={val}
                                onClick={() => setSessionStatus(val)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                  sessionStatus === val
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-400">
                            Знайдено {visibleSessions.length} з {activeSessions.length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {visibleSessions.length === 0 && (
                          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-10 text-center space-y-3">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-slate-800">🔎</div>
                            <p className="text-slate-300 text-sm font-bold">Сесій не знайдено</p>
                            <p className="text-xs text-slate-400">Перевірте код або змініть фільтр. Можна також пошукати в загальній базі тестів.</p>
                            {sessionQuery.trim() && (
                              <button
                                onClick={() => { setCommunityQuery(sessionQuery); setActiveTab('community'); }}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                🔍 Шукати «{sessionQuery.trim()}» у загальній базі
                              </button>
                            )}
                          </div>
                        )}

                        {visibleSessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-slate-950 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl transition shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="min-w-12 h-12 px-2 bg-indigo-950 border border-indigo-800/60 rounded-xl flex items-center justify-center text-indigo-400 font-mono font-bold text-xs shadow-inner shrink-0">
                                {session.id}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-indigo-300">{session.tag}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${session.status === 'Активна' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400'}`}>
                                    {session.status}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                                    {session.questions?.length ?? 0} пит.
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-100 leading-snug">{session.title}</h4>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 self-end md:self-center shrink-0">
                              <button
                                onClick={() => setSelectedSessionForLive(session)}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                              >
                                📡 Моніторинг і PDF ➔
                              </button>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(session.id);
                                  alert(`Код сесії ${session.id} скопійовано!`);
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                📋 Код
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'community' && (
                    <CommunitySearch
                      tests={allPublicTests}
                      query={communityQuery}
                      onQueryChange={setCommunityQuery}
                      onImport={importPublicTest}
                      onAssign={t => setAssignSource(t)}
                      onAddToBasket={addToBasket}
                    />
                  )}

                  {activeTab === 'library' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black text-white">Моя Бібліотека</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-3">
                          {libraryItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => { setSelectedFolder(item); setExpandedQuestionId(null); }}
                              className="flex items-center justify-between gap-3 p-3.5 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-800 transition cursor-pointer"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                {item.type === 'group' ? (
                                  <span className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow shrink-0">ЗНО</span>
                                ) : (
                                  <span className="text-xl">📁</span>
                                )}
                                <span className="text-sm font-semibold text-slate-200 truncate">{item.title}</span>
                              </div>

                              <div className="flex items-center space-x-3 shrink-0">
                                <button
                                  onClick={(e) => togglePublic(item.id, e)}
                                  title="Відкрити або закрити доступ для інших викладачів"
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                                    item.isPublic
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                  }`}
                                >
                                  {item.isPublic ? '🌐 Публічний' : '🔒 Приватний'}
                                </button>
                                {(item.questions?.length ?? 0) > 0 && (
                                  <PrintButton
                                    title={item.title}
                                    questions={item.questions ?? []}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-slate-900 text-slate-300 border-slate-800 hover:text-white transition cursor-pointer"
                                  >
                                    📄 PDF
                                  </PrintButton>
                                )}
                                <span className="text-xs text-slate-500 font-bold">{item.questions?.length ?? 0} пит.</span>
                                <span className="text-xs text-indigo-400 font-bold">Редагувати ➔</span>
                                <button
                                  onClick={(e) => deleteLibraryItem(item.id, e)}
                                  className="p-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                  title="Видалити"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <button onClick={createNewGroupInLibrary} className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer">
                            <span>➕ Нова Група питань</span>
                          </button>
                          <button onClick={createNewFolder} className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer">
                            <span>📁 Створити Папку</span>
                          </button>
                          <button onClick={() => goTab('community')} className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer">
                            <span>🔍 Знайти в загальній базі</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'classes' && (
                    <TeacherClasses
                      classes={classes}
                      setClasses={setClasses}
                      teacherName={teacherFullName}
                      libraryGroups={libraryGroups}
                    />
                  )}

                  {activeTab === 'profile' && (
                    <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 space-y-6 max-w-2xl">
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                          {userInfo.firstName.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{teacherFullName}</h2>
                          <p className="text-sm text-slate-400">{userInfo.email}</p>
                          <span className="inline-block mt-2 text-[10px] font-extrabold px-2.5 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-md uppercase tracking-wider">Викладач / Експерт</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Доступ до завантаження PDF</p>
                        <p className="text-sm font-bold text-slate-100">{ent.title}</p>
                        <p className="text-xs text-slate-400">{ent.message}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* Збірка питань для сесії (права панель) */}
        {userRole === 'teacher' && basket.length > 0 && !builderSessionId && (
          <SessionBasket
            items={basket}
            flash={basketFlash}
            onRemove={id => setBasket(basket.filter(q => q.id !== id))}
            onClear={() => { if (confirm('Очистити збірку?')) setBasket([]); }}
            onStart={startSessionFromBasket}
          />
        )}

        {/* Вікно створеної сесії */}
        {userRole === 'teacher' &&
          (() => {
            const s = builderSessionId ? activeSessions.find(x => x.id === builderSessionId) : undefined;
            return s ? (
              <SessionBuilder
                session={s}
                classes={classes}
                onClose={() => setBuilderSessionId(null)}
                onQuestionsChange={qs => setActiveSessions(prev => prev.map(x => (x.id === s.id ? { ...x, questions: qs } : x)))}
                onToggleStatus={() =>
                  setActiveSessions(prev =>
                    prev.map(x => (x.id === s.id ? { ...x, status: x.status === 'Активна' ? 'Завершена' : 'Активна' } : x))
                  )
                }
                onAssign={(classId, data) => {
                  const c = classes.find(x => x.id === classId);
                  setClasses(prev => addAssignment(prev, classId, data));
                  notify(`Призначено класу «${c?.name ?? ''}»`);
                }}
              />
            ) : null;
          })()}

        {/* Вікно «Призначити тест класу» (з загальної бази) */}
        {assignSource && (
          <AssignModal
            test={assignSource}
            classes={classes}
            onClose={() => setAssignSource(null)}
            onAssign={(classId, data) => {
              const c = classes.find(x => x.id === classId);
              setClasses(prev => addAssignment(prev, classId, data));
              setAssignSource(null);
              alert(`Тест «${data.title}» призначено класу «${c?.name ?? ''}».`);
            }}
          />
        )}

        {/* Вікно створення / редагування питання */}
        {isQuestionModalOpen && (
          <QuestionBuilder
            key={editingQuestion?.id ?? 'new'}
            initial={editingQuestion}
            onClose={closeQuestionModal}
            onSave={handleSaveQuestion}
          />
        )}

        {toast && (
          <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl border-2 border-amber-500 bg-slate-950 text-xs font-bold text-slate-200 shadow-2xl">
            {toast}
          </div>
        )}
      </div>
    </AccessProvider>
  );
}