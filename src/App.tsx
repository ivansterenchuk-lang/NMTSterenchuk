import React, { useEffect, useRef, useState } from 'react';
import './theme.css';
import QuestionBuilder from './components/QuestionBuilder';
import QuestionCard from './components/QuestionCard';
import CommunitySearch from './components/CommunitySearch';
import TeacherClasses from './components/TeacherClasses';
import SessionBasket from './components/SessionBasket';
import SessionBuilder from './components/SessionBuilder';
import AssignModal from './components/AssignModal';
import AdminConsole, { AdminLogin } from './components/AdminConsole';
import { AccessBadge, AccessProvider, PrintButton } from './components/AccessUI';
import Whiteboard from './components/Whiteboard';
import type { Question } from './lib/nmt';
import { COMMUNITY_TESTS } from './lib/communityData';
import { sessionMatches, sessionRank, stripCode, type PublicTest } from './lib/search';
import { printHtml, sessionStudentHtml } from './lib/pdf';
import { ME_ID, addAssignment, findSession, loadClasses, normalizeCode, readJoinParam, splitName, type ClassItem, type LibraryGroup } from './lib/classroom';
import { ACCOUNTS_KEY, CURRENT_TEACHER_ID, SETTINGS_KEY, getEntitlement, isAdminSession, loadAccounts, loadSettings, saveAccounts, saveSettings, setAdminSession, type PlatformSettings, type TeacherAccount } from './lib/access';

// НОВІ ІМПОРТИ ДЛЯ SUPABASE
import { fetchAllClasses, fetchSessionSubmissions } from './lib/classroomRepository';

import CreateSessionModal from './components/CreateSessionModal';
import EditSessionModal from './components/EditSessionModal';
import MeetingLinkModal from './components/MeetingLinkModal';
import InspectDetailsModal from './components/InspectDetailsModal';
import StudentView from './components/StudentView';
import ConfirmModal from './components/ConfirmModal';
import InputModal from './components/InputModal';
import CommunityTestViewModal from './components/CommunityTestViewModal';
import LandingPage from './components/LandingPage';
import { LogOut } from 'lucide-react';

import { mockSession } from './lib/mockData';

type LibraryItem = { id: number; title: string; type: 'group' | 'folder'; questions?: Question[]; isPublic?: boolean; };

type SessionItem = { 
  id: string; 
  title: string; 
  tag: string; 
  studentsCount: number; 
  date: string; 
  status: 'Активна' | 'Завершена'; 
  questions?: Question[]; 
  meetingUrl?: string; 
  durationMinutes?: number; 
  startTime?: string; 
  endTime?: string;
  mode?: 'active' | 'scheduled' | 'managed';
  isLive?: boolean;
  timeLimitType?: 'test' | 'question';
  gradingSystem?: '12' | '100' | 'preschool' | 'nus';
  maxScore?: number;
  minScore?: number;
  showResults?: boolean;
  showErrors?: boolean;
  showCorrectAnswers?: boolean;
};

type StudentResult = { id: number; name: string; scorePercent: number; answers: boolean[]; };
type Tab = 'library' | 'sessions' | 'community' | 'classes' | 'profile' | 'board';

const TEACHER_TABS: [Tab, string][] = [['library', 'МОЯ БІБЛІОТЕКА'], ['sessions', 'СЕСІЇ'], ['community', 'ЗАГАЛЬНА БАЗА'], ['classes', 'КЛАСИ'], ['board', 'ДОШКА']];
const asSearchable = (s: SessionItem): any => s;

export default function App() {
  const [route, setRoute] = useState<string>(() => window.location.hash);
  useEffect(() => { const h = () => setRoute(window.location.hash); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  const [adminAuthed, setAdminAuthed] = useState<boolean>(isAdminSession);
  
  const [accounts, setAccounts] = useState<TeacherAccount[]>(() => loadAccounts());
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings);
  useEffect(() => { saveAccounts(accounts); }, [accounts]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  const me = accounts.find(a => a.id === CURRENT_TEACHER_ID);
  const ent = getEntitlement(me, settings);

  const [showLanding, setShowLanding] = useState<boolean>(() => !readJoinParam());
  const [userRole, setUserRole] = useState<'student' | 'teacher'>(() => (readJoinParam() ? 'student' : 'teacher'));
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [selectedFolder, setSelectedFolder] = useState<LibraryItem | null>(null);
  const [selectedSessionForLive, setSelectedSessionForLive] = useState<SessionItem | null>(null);
  
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [assignSource, setAssignSource] = useState<PublicTest | null>(null);
  const [viewingPublicTest, setViewingPublicTest] = useState<PublicTest | null>(null);
  const [confirmData, setConfirmData] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [inputData, setInputData] = useState<{ title: string; placeholder: string; onSubmit: (val: string) => void } | null>(null);

  const [basket, setBasket] = useState<Question[]>(() => { try { const raw = localStorage.getItem('nmt-basket-v1'); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? (v as Question[]) : []; } catch { return []; } });
  const [basketFlash, setBasketFlash] = useState(false);
  const [builderSessionId, setBuilderSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  useEffect(() => { try { localStorage.setItem('nmt-basket-v1', JSON.stringify(basket)); } catch {} }, [basket]);

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2400); };
  
  const addToBasket = (qs: Question[]) => {
    const have = new Set(basket.map(q => q.id)); 
    const fresh = qs.filter(q => !have.has(q.id));
    if (fresh.length === 0) { notify('Ці питання вже є у збірці'); return; }
    setBasket([...basket, ...fresh.map(q => ({ ...q }))]); 
    setBasketFlash(true); 
    window.setTimeout(() => setBasketFlash(false), 1400); 
    notify(`Додано до збірки: ${fresh.length}`);
  };

  const [sessionQuery, setSessionQuery] = useState('');
  const [sessionStatus, setSessionStatus] = useState<'all' | 'Активна' | 'Завершена'>('all');
  const [communityQuery, setCommunityQuery] = useState('');
  const [globalQuery, setGlobalQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') { e.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);

  const [userInfo] = useState({ firstName: 'Іван', lastName: 'Стеренчук', email: 'ivansterenchuk@gmail.com' });
  const teacherFullName = `${userInfo.firstName} ${userInfo.lastName}`;
  
  const [classes, setClasses] = useState<ClassItem[]>([]);
  
  const [studentName, setStudentName] = useState<string>(() => { try { return localStorage.getItem('nmt-student-name') ?? ''; } catch { return ''; } });
  const changeStudentName = (n: string) => { setStudentName(n); try { localStorage.setItem('nmt-student-name', n); } catch {} };
  const [sessionCode, setSessionCode] = useState('');
  
  const [pendingJoin, setPendingJoin] = useState<string>(() => readJoinParam() ?? '');
  const consumeJoin = () => { setPendingJoin(''); try { window.history.replaceState({}, '', window.location.pathname); } catch {} };
  
  const [isPaused, setIsPaused] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionQuestions, setNewSessionQuestions] = useState<Question[]>([]);
  
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [editingMeetingSession, setEditingMeetingSession] = useState<SessionItem | null>(null);
  const [inspectDetails, setInspectDetails] = useState<{ studentName: string; question: Question; isCorrect: boolean; qIndex: number; } | null>(null);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([
    { id: 1, title: '1.1. 1914 – 1945 рр.', type: 'group', questions: [] },
    { id: 2, title: '1.2. 1945 р. – початок XXI ст.', type: 'group', questions: [] },
    { id: 3, title: '2.1. Від найдавніших часів – перша половина XVI ст.', type: 'group', questions: [] },
    { id: 4, title: 'Історія 10 клас', type: 'folder', questions: [] },
    { id: 5, title: 'Історія України. Завдання за роками', type: 'group', questions: [] }
  ]);

  const [activeSessions, setActiveSessions] = useState<SessionItem[]>(() => {
    try {
      const saved = localStorage.getItem('nmt-sessions-local');
      const sessions = saved ? JSON.parse(saved) : [];
      if (!sessions.find((s: any) => s.id === mockSession.id)) {
        sessions.unshift(mockSession as any);
      }
      return sessions;
    } catch { return [mockSession as any]; }
  });
  
  const [liveStudentsData, setLiveStudentsData] = useState<StudentResult[]>([]);

  // ЗАВАНТАЖЕННЯ КЛАСІВ З БАЗИ ПРИ СТАРТІ
  useEffect(() => {
    let isMounted = true;
    const loadDbData = async () => {
      const dbClasses = await fetchAllClasses();
      if (isMounted && dbClasses.length > 0) {
        setClasses(dbClasses);
      } else if (isMounted && dbClasses.length === 0) {
        const local = loadClasses();
        if (local.length > 0) setClasses(local);
      }
    };
    loadDbData();
    return () => { isMounted = false; };
  }, []);

  // ЗБЕРЕЖЕННЯ СЕСІЙ У LOCALSTORAGE
  useEffect(() => { localStorage.setItem('nmt-sessions-local', JSON.stringify(activeSessions)); }, [activeSessions]);

  // РЕАЛЬНИЙ МОНІТОРИНГ СЕСІЙ (Опитування кожні 5 сек)
  useEffect(() => {
    if (!selectedSessionForLive) {
      setLiveStudentsData([]);
      return;
    }

    let isMounted = true;

    const loadSubmissions = async () => {
      const data = await fetchSessionSubmissions(selectedSessionForLive.id);
      if (isMounted) {
        const formatted: StudentResult[] = data.map((d: any, i: number) => ({
          id: i,
          name: d.name,
          scorePercent: d.percent,
          answers: d.answers || []
        }));
        setLiveStudentsData(formatted);
      }
    };

    loadSubmissions();
    const interval = setInterval(loadSubmissions, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedSessionForLive]);

  const visibleSessions = activeSessions.filter(s => (sessionStatus === 'all' || s.status === sessionStatus) && sessionMatches(asSearchable(s), sessionQuery)).sort((a, b) => sessionRank(asSearchable(a), sessionQuery) - sessionRank(asSearchable(b), sessionQuery));
  const ownPublicTests: PublicTest[] = libraryItems.filter(i => i.isPublic && (i.questions?.length ?? 0) > 0).map(i => ({ id: `own-${i.id}`, title: i.title, author: teacherFullName, subject: (i.questions as Question[])[0].subject, tags: ['Мій тест'], updated: 'щойно', questions: i.questions as Question[], isOwn: true }));
  const allPublicTests: PublicTest[] = [...ownPublicTests, ...COMMUNITY_TESTS];
  const libraryGroups: LibraryGroup[] = libraryItems.filter(i => (i.questions?.length ?? 0) > 0).map(i => ({ id: i.id, title: i.title, questions: i.questions as Question[] }));
  const studentFullName = studentName || 'Учень';

  const startSessionFromBasket = (title: string) => {
    if (basket.length === 0) return;
    createSession(title, basket);
  };

  const createSession = (initialTitle: string = 'Новий тест з історії', initialQuestions: Question[] = []) => {
    setNewSessionQuestions(initialQuestions);
    setIsCreatingSession(true);
  };

  const exportStudentPdf = (student: StudentResult) => { printHtml(sessionStudentHtml({ studentName: student.name, sessionTitle: selectedSessionForLive?.title ?? 'Тестування НМТ', percent: student.scorePercent, answers: student.answers, questions: selectedSessionForLive?.questions ?? [], teacher: teacherFullName }), `Результат — ${student.name}`); };
  
  const runGlobalSearch = () => { const q = globalQuery.trim(); if (!q) return; setSelectedFolder(null); const exact = activeSessions.find(s => stripCode(s.id) === stripCode(q)); if (exact) { setSelectedSessionForLive(exact); setActiveTab('sessions'); setGlobalQuery(''); return; } if (stripCode(q).length >= 2 && activeSessions.some(s => sessionRank(asSearchable(s), q) < 3)) { setSelectedSessionForLive(null); setSessionQuery(q); setSessionStatus('all'); setActiveTab('sessions'); return; } setSelectedSessionForLive(null); setCommunityQuery(q); setActiveTab('community'); };
  
  const toggleSessionStatus = (id: string) => {
    setActiveSessions(prev => prev.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'Активна' ? 'Завершена' : 'Активна';
        return { ...s, status: newStatus, isLive: false };
      }
      return s;
    }));
    if (selectedSessionForLive?.id === id) {
      setSelectedSessionForLive(prev => prev ? { ...prev, status: prev.status === 'Активна' ? 'Завершена' : 'Активна', isLive: false } : null);
    }
    notify('Статус сесії змінено!');
  };

  const handleDeleteSession = (id: string) => {
    setConfirmData({
      title: 'Видалити сесію?',
      message: 'Ви впевнені, що хочете назавжди видалити цю сесію та всі її результати?',
      onConfirm: () => {
        setActiveSessions(prev => prev.filter(s => s.id !== id));
        if (selectedSessionForLive?.id === id) setSelectedSessionForLive(null);
        notify('Сесію видалено');
      }
    });
  };

  const createNewFolder = () => {
    setInputData({
      title: 'Нова папка',
      placeholder: 'Введіть назву нової папки...',
      onSubmit: (title) => {
        if (title && title.trim() !== '') {
          setLibraryItems([...libraryItems, { id: Date.now(), title: title.trim(), type: 'folder', questions: [] }]);
        }
      }
    });
  };

  const createNewGroupInLibrary = () => {
    setInputData({
      title: 'Нова група питань',
      placeholder: 'Введіть назву нової групи (тесту)...',
      onSubmit: (title) => {
        if (title && title.trim() !== '') {
          setLibraryItems([...libraryItems, { id: Date.now(), title: title.trim(), type: 'group', questions: [] }]);
        }
      }
    });
  };

  const deleteLibraryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmData({
      title: 'Видалити елемент?',
      message: 'Ви впевнені, що хочете видалити цей елемент? Цю дію неможливо скасувати.',
      onConfirm: () => {
        setLibraryItems(libraryItems.filter(item => item.id !== id));
        if (selectedFolder && selectedFolder.id === id) setSelectedFolder(null);
      }
    });
  };

  const togglePublic = (id: number, e?: React.MouseEvent) => { e?.stopPropagation(); const item = libraryItems.find(i => i.id === id); if (!item) return; if (!item.isPublic && (item.questions?.length ?? 0) === 0) { notify('Спершу додайте хоча б одне питання!'); return; } const updated: LibraryItem = { ...item, isPublic: !item.isPublic }; setLibraryItems(libraryItems.map(i => (i.id === id ? updated : i))); if (selectedFolder?.id === id) setSelectedFolder(updated); };
  
  const importPublicTest = (t: PublicTest) => { const base = Date.now(); const copy: LibraryItem = { id: base, title: `${t.title} (від ${t.author})`, type: 'group', isPublic: false, questions: t.questions.map((q, i) => ({ ...q, id: base + i + 1 })) }; setLibraryItems([...libraryItems, copy]); notify(`Тест «${t.title}» додано до вашої бібліотеки (${t.questions.length} пит.).`); };
  
  const openNewQuestion = () => { setEditingQuestion(null); setIsQuestionModalOpen(true); };
  const closeQuestionModal = () => { setIsQuestionModalOpen(false); setEditingQuestion(null); };
  
  const handleSaveQuestion = (q: Question) => { if (!selectedFolder) return; const current = selectedFolder.questions || []; const exists = current.some(x => x.id === q.id); const updatedQuestions = exists ? current.map(x => (x.id === q.id ? q : x)) : [...current, q]; const updatedFolderItem: LibraryItem = { ...selectedFolder, questions: updatedQuestions }; setSelectedFolder(updatedFolderItem); setLibraryItems(libraryItems.map(i => (i.id === updatedFolderItem.id ? updatedFolderItem : i))); if (exists) setActiveSessions(prev => prev.map(s => ({ ...s, questions: (s.questions || []).map(x => (x.id === q.id ? q : x)) }))); if (!exists) setExpandedQuestionId(q.id); closeQuestionModal(); };
  
  const deleteQuestionFromActiveItem = (questionId: number) => {
    if (!selectedFolder) return;
    setConfirmData({
      title: 'Видалити запитання?',
      message: 'Ви впевнені, що хочете видалити це запитання?',
      onConfirm: () => {
        const updatedFolderItem = { ...selectedFolder, questions: (selectedFolder.questions || []).filter(q => q.id !== questionId) };
        setSelectedFolder(updatedFolderItem);
        setLibraryItems(libraryItems.map(item => (item.id === selectedFolder.id ? updatedFolderItem : item)));
        if (expandedQuestionId === questionId) setExpandedQuestionId(null);
      }
    });
  };
  
  const studentSession = activeSessions.find(s => stripCode(s.id) === stripCode(sessionCode));
  const classSession = findSession(classes, normalizeCode(sessionCode));
  
  const goTab = (tab: Tab) => { setSelectedSessionForLive(null); setSelectedFolder(null); setActiveTab(tab); };
  const navCls = (tab: Tab) => `transition cursor-pointer py-1 ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-900'}`;
  const exitAdmin = () => { try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch {} setRoute(''); };

  if (route === '#admin' || route.startsWith('#admin/')) {
    if (!adminAuthed) return <AdminLogin onSuccess={() => { setAdminSession(true); setAdminAuthed(true); }} onExit={exitAdmin} />;
    return <AdminConsole accounts={accounts} setAccounts={setAccounts} settings={settings} setSettings={setSettings} library={libraryItems.map(i => ({ id: i.id, title: i.title, type: i.type, count: i.questions?.length ?? 0 }))} onDeleteLibrary={id => setLibraryItems(prev => prev.filter(i => i.id !== id))} onLogout={() => { setAdminSession(false); setAdminAuthed(false); exitAdmin(); }} onExit={exitAdmin} />;
  }

  // ЯКЩО ПОКАЗУЄМО ТИТУЛЬНУ СТОРІНКУ
  if (showLanding) {
    return (
      <LandingPage 
        onSelectRole={(role) => {
          setUserRole(role);
          setShowLanding(false);
          if (role === 'student') setActiveTab('classes'); 
        }} 
      />
    );
  }

  const displayFirstName = userRole === 'student' ? splitName(studentFullName).firstName : userInfo.firstName;

  return (
    <AccessProvider ent={ent} teacherName={teacherFullName}>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
        
        {/* ШАПКА */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { if (userRole !== 'student') goTab('library'); }}>
              <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-500/20">⚡</div>
              <div><span className="font-black text-lg tracking-wider text-slate-900">NMT-HUB</span><span className="block text-[10px] text-teal-600 font-bold uppercase tracking-widest">Екзаменаційна система</span></div>
            </div>
            {userRole === 'teacher' && (<nav className="hidden md:flex items-center space-x-4 text-xs font-bold tracking-wider">{TEACHER_TABS.map(([t, label]) => (<button key={t} onClick={() => goTab(t)} className={navCls(t)}>{label}</button>))}</nav>)}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {userRole === 'teacher' && (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input ref={searchRef} value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runGlobalSearch(); }} placeholder="Код сесії або слова… (Ctrl+K)" className="w-56 xl:w-72 pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-teal-500 focus:outline-none transition" />
                </div>
                <AccessBadge />
              </>
            )}
            
            {/* КНОПКА ВИХОДУ */}
            <button 
              onClick={() => {
                setShowLanding(true);
                setSelectedSessionForLive(null);
                setSelectedFolder(null);
                setActiveTab('sessions');
              }} 
              className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Вийти
            </button>

            <div className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition" onClick={() => { if (userRole === 'teacher') goTab('profile'); }}>
              <div className="w-7 h-7 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">{displayFirstName.charAt(0)}</div>
              <span className="text-xs font-bold text-slate-800">{displayFirstName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {userRole === 'student' ? (
            <StudentView 
              classes={classes} 
              setClasses={setClasses} 
              studentName={studentName} 
              changeStudentName={changeStudentName} 
              pendingJoin={pendingJoin} 
              consumeJoin={consumeJoin} 
              studentSession={studentSession} 
              classSession={classSession} 
              studentFullName={studentFullName} 
              sessionCode={sessionCode}
              setSessionCode={setSessionCode}
              notify={notify}
              ME_ID={ME_ID}
            />
          ) : (
            <div className="space-y-6">
              {selectedFolder ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <button onClick={() => { setSelectedFolder(null); setExpandedQuestionId(null); }} className="text-teal-600 hover:underline text-xs font-bold mb-2 inline-block">← Моя Бібліотека</button>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2"><span>{selectedFolder.type === 'folder' ? '📁' : '📚'}</span> <span>Моя Бібліотека &gt; {selectedFolder.title}</span></h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => togglePublic(selectedFolder.id)} title="Публічні тести бачать і можуть копіювати інші викладачі" className={`px-4 py-3 font-bold text-xs rounded-xl transition cursor-pointer border ${selectedFolder.isPublic ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}>{selectedFolder.isPublic ? '🌐 Публічний доступ' : '🔒 Приватний'}</button>
                      {selectedFolder.questions && selectedFolder.questions.length > 0 && (
                        <>
                          <PrintButton title={selectedFolder.title} questions={selectedFolder.questions} className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer">📄 PDF для друку</PrintButton>
                          <button onClick={() => addToBasket(selectedFolder.questions || [])} className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer">➕ Усю групу до збірки</button>
                        </>
                      )}
                      <button onClick={openNewQuestion} className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer"><span>+ Нове Питання</span></button>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
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
                      <div className="py-12 space-y-4 text-center"><div className="w-20 h-20 bg-slate-50 text-teal-500 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-slate-200">📄</div><p className="text-slate-500 text-sm font-medium">Ця Група питань порожня. Створіть нове питання!</p><button onClick={openNewQuestion} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-2 cursor-pointer"><span>+ Нове Питання</span></button></div>
                    )}
                  </div>
                </div>
              ) : selectedSessionForLive ? (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-1"><div className="flex items-center space-x-2 text-xs text-slate-500"><button onClick={() => setSelectedSessionForLive(null)} className="text-teal-600 hover:underline font-bold">← Назад до списку сесій</button><span>•</span><span className="text-slate-600">Моніторинг в реальному часі</span></div><h2 className="text-lg font-black text-slate-900">{selectedSessionForLive.title}</h2></div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 space-x-3"><span className="font-mono font-black text-teal-600 text-sm tracking-wider">{selectedSessionForLive.id}</span><button onClick={() => { navigator.clipboard.writeText(selectedSessionForLive.id); notify('Код сесії скопійовано!'); }} className="text-slate-400 hover:text-slate-700 text-xs font-bold transition cursor-pointer">📋</button></div>
                      
                      {selectedSessionForLive.mode === 'managed' && (
                        <button 
                          onClick={() => {
                            setActiveSessions(prev => prev.map(s => s.id === selectedSessionForLive.id ? { ...s, isLive: !s.isLive } : s));
                            setSelectedSessionForLive(prev => prev ? { ...prev, isLive: !prev.isLive } : null);
                            notify(selectedSessionForLive.isLive ? 'Тестування зупинено!' : 'Тестування розпочато для всіх учнів!');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${selectedSessionForLive.isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}
                        >
                          <span>{selectedSessionForLive.isLive ? '🔴 Зупинити учнів' : '🟢 Почати для учнів'}</span>
                        </button>
                      )}

                      <button onClick={() => setIsPaused(!isPaused)} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${isPaused ? 'bg-amber-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600'}`}><span>{isPaused ? '▶️ Відновити' : '⏸️ На паузу'}</span></button>

                      <button onClick={() => toggleSessionStatus(selectedSessionForLive.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${selectedSessionForLive.status === 'Завершена' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        <span>{selectedSessionForLive.status === 'Завершена' ? '▶️ Відновити сесію' : '⏹️ Завершити сесію'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200 text-xs shadow-sm">
                    <div className="flex items-center space-x-3"><span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span><span className="font-bold text-slate-800">УЧНІВ У СЕСІЇ: <b className="text-emerald-600">{liveStudentsData.length}</b></span></div>
                    <div className="text-slate-500 font-bold">⏱ Тривалість: <b className="text-teal-600">{selectedSessionForLive.durationMinutes ? `${selectedSessionForLive.durationMinutes} хв` : 'Без обмежень'}</b></div>
                    <div className="text-slate-500">Статус: <b className={isPaused ? 'text-amber-600' : 'text-emerald-600'}>{isPaused ? 'Сесія зупинена ⏸️' : 'Спостереження активне 🟢'}</b></div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] relative pb-2">
                    <table className="w-full min-w-max text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                          <th className="p-4 w-52 sticky left-0 bg-slate-50 z-10 whitespace-nowrap">Учень / Учениця</th>
                          <th className="p-4 text-center w-28 whitespace-nowrap">Результат</th>
                          {Array.from({ length: selectedSessionForLive.questions?.length || 30 }, (_, i) => (<th key={i} className="p-2 text-center border-l border-slate-200 font-mono text-teal-600 text-xs whitespace-nowrap">№{i + 1}</th>))}
                          <th className="p-4 text-center border-l border-slate-200 w-40 whitespace-nowrap">Звіт PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {liveStudentsData.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-bold text-slate-800 flex items-center space-x-2.5 sticky left-0 bg-white z-10 border-r border-slate-200">
                              <span className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs">{student.name.charAt(0)}</span>
                              <span>{student.name}</span>
                            </td>
                            <td className="p-4 text-center font-black text-teal-600">{student.scorePercent}%</td>
                            
                            {student.answers.map((isCorrect, qIdx) => {
                              const questionObj = selectedSessionForLive?.questions?.[qIdx];
                              return (
                                <td key={qIdx} className="p-2 text-center border-l border-slate-200">
                                  <button 
                                    onClick={() => { 
                                      if (questionObj) { 
                                        setInspectDetails({ studentName: student.name, question: questionObj, isCorrect, qIndex: qIdx }); 
                                      } else { 
                                        notify('Питання відсутнє у цій сесії.'); 
                                      } 
                                    }} 
                                    disabled={!questionObj}
                                    className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-xs transition ${
                                      !questionObj 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' 
                                        : `cursor-pointer hover:scale-110 ${
                                            isCorrect 
                                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                                              : 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                                          }`
                                    }`}
                                    title={!questionObj ? 'Питання відсутнє' : 'Натисніть, щоб переглянути деталі'}
                                  >
                                    {isCorrect ? '✓' : '✕'}
                                  </button>
                                </td>
                              );
                            })}
                            
                            <td className="p-4 text-center border-l border-slate-200">
                              <button onClick={() => exportStudentPdf(student)} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">📄 Зберегти PDF</button>
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
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-wide">Активні Сесії Тестування</h2>
                          <p className="text-xs text-slate-500 mt-1">Натисніть на сесію, щоб відкрити живий моніторинг виконання та завантажити результати учнів у PDF.</p>
                        </div>
                        <button onClick={() => { goTab('library'); notify('Оберіть питання у бібліотеці та натисніть "Розпочати сесію" у збірці'); }} className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-2 cursor-pointer">
                          <span>➕ Обрати питання для сесії</span>
                        </button>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                          <input value={sessionQuery} onChange={e => setSessionQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && visibleSessions.length === 1) setSelectedSessionForLive(visibleSessions[0]); }} placeholder="Пошук сесії за кодом, назвою або міткою" className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm focus:border-teal-500 focus:outline-none transition" />
                          {sessionQuery && (<button onClick={() => setSessionQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer" title="Очистити">✕</button>)}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex gap-2">
                            {([['all', 'Усі'], ['Активна', 'Активні'], ['Завершена', 'Завершені']] as const).map(([val, label]) => (
                              <button key={val} onClick={() => setSessionStatus(val)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${sessionStatus === val ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900'}`}>{label}</button>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-500">Знайдено {visibleSessions.length} з {activeSessions.length}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {visibleSessions.length === 0 && (
                          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-slate-200">🔎</div>
                            <p className="text-slate-700 text-sm font-bold">Сесій не знайдено</p>
                          </div>
                        )}
                        {visibleSessions.map((session) => (
                          <div key={session.id} className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-teal-500/50 p-5 rounded-2xl transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start space-x-4">
                              <div className="min-w-12 h-12 px-2 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-mono font-bold text-xs shadow-inner shrink-0">{session.id}</div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">{session.tag}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${session.status === 'Активна' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>{session.status}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">{session.questions?.length ?? 0} пит.</span>
                                  {session.mode && (<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">{session.mode === 'active' ? 'Активний' : session.mode === 'scheduled' ? 'Запланований' : 'Керований'}</span>)}
                                </div>
                                <h4 className="font-bold text-sm text-slate-900 leading-snug">{session.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {session.durationMinutes && (<span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">⏱ {session.durationMinutes} хв</span>)}
                                  {session.startTime && (<span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">▶ {new Date(session.startTime).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}</span>)}
                                  {session.endTime && (<span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">⏹ {new Date(session.endTime).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' })}</span>)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                              {session.meetingUrl ? (
                                <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1"><span>📹</span></a>
                              ) : (
                                <button onClick={() => { setEditingMeetingSession(session); }} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center space-x-1" title="Додати посилання"><span>➕ Посилання</span></button>
                              )}
                              <button onClick={() => { setEditingSession(session); }} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer" title="Налаштувати час та тривалість">✏️ Час</button>
                              
                              <button onClick={() => setBuilderSessionId(session.id)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer" title="Редагувати питання сесії">✏️ Питання</button>

                              <button onClick={() => toggleSessionStatus(session.id)} className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${session.status === 'Активна' ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'}`} title={session.status === 'Активна' ? 'Завершити сесію' : 'Відновити сесію'}>
                                {session.status === 'Активна' ? '⏹ Завершити' : '▶ Відновити'}
                              </button>
                              
                              <button onClick={() => handleDeleteSession(session.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer" title="Видалити сесію">🗑️</button>
                              
                              <button onClick={() => setSelectedSessionForLive(session)} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">📡 Моніторинг</button>
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
                      onAssign={(t: any) => setAssignSource(t)}
                      onAddToBasket={addToBasket} 
                      onView={(t: any) => setViewingPublicTest(t)}
                    />
                  )}
                  {activeTab === 'library' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black text-slate-900">Моя Бібліотека</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm">
                          {libraryItems.map((item) => (
                            <div key={item.id} onClick={() => { setSelectedFolder(item); setExpandedQuestionId(null); }} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer">
                              <div className="flex items-center space-x-3 min-w-0">
                                {item.type === 'group' ? (<span className="w-7 h-7 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">ЗНО</span>) : (<span className="text-xl">📁</span>)}
                                <span className="text-sm font-semibold text-slate-800 truncate">{item.title}</span>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0">
                                <button onClick={(e) => togglePublic(item.id, e)} title="Відкрити або закрити доступ для інших викладачів" className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${item.isPublic ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'}`}>{item.isPublic ? '🌐 Публічний' : '🔒 Приватний'}</button>
                                {(item.questions?.length ?? 0) > 0 && (<PrintButton title={item.title} questions={item.questions ?? []} className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 transition cursor-pointer">📄 PDF</PrintButton>)}
                                <span className="text-xs text-slate-400 font-bold">{item.questions?.length ?? 0} пит.</span>
                                <span className="text-xs text-teal-600 font-bold">Редагувати ➔</span>
                                <button onClick={(e) => deleteLibraryItem(item.id, e)} className="p-2 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Видалити">🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <button onClick={createNewGroupInLibrary} className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"><span>➕ Нова Група питань</span></button>
                          <button onClick={createNewFolder} className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"><span>📁 Створити Папку</span></button>
                          <button onClick={() => goTab('community')} className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"><span>🔍 Знайти в загальній базі</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'classes' && (<TeacherClasses classes={classes} setClasses={setClasses} teacherName={teacherFullName} libraryGroups={libraryGroups} />)}
                  
                  {activeTab === 'board' && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-black text-slate-900">Інтерактивна дошка</h2>
                      <p className="text-xs text-slate-500">Демонструйте екран або малюйте разом з учнями в реальному часі.</p>
                      <Whiteboard studentName={studentFullName} isTeacher={userRole === 'teacher'} />
                    </div>
                  )}
                  
                  {activeTab === 'profile' && (<div className="bg-white p-8 rounded-2xl border border-slate-200 space-y-6 max-w-2xl shadow-sm"><div className="flex items-center space-x-6"><div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-emerald-400 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-md">{userInfo.firstName.charAt(0)}</div><div><h2 className="text-2xl font-bold text-slate-900">{teacherFullName}</h2><p className="text-sm text-slate-500">{userInfo.email}</p><span className={`inline-block mt-2 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200`}>PRO Тариф</span></div></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-4"><h3 className="text-lg font-bold text-slate-900">Ваш тариф: PRO</h3><p className="text-sm text-slate-500">Доступні всі функції, включно з PDF.</p></div></div>)}
                </>
              )}
            </div>
          )}
        </main>

        {userRole === 'teacher' && basket.length > 0 && !builderSessionId && (
          <SessionBasket 
            items={basket} 
            flash={basketFlash} 
            onRemove={id => setBasket(basket.filter(q => q.id !== id))} 
            onClear={() => setConfirmData({ 
              title: 'Очистити збірку?', 
              message: 'Ви впевнені, що хочете видалити всі питання зі збірки?', 
              onConfirm: () => setBasket([]) 
            })} 
            onStart={startSessionFromBasket} 
            onReorder={(newItems) => setBasket(newItems)}
          />
        )}
        
        {userRole === 'teacher' && (() => { 
          const s = builderSessionId ? activeSessions.find(x => x.id === builderSessionId) : undefined; 
          return s ? (
            <SessionBuilder 
              session={s} 
              classes={classes} 
              onClose={() => setBuilderSessionId(null)} 
              onQuestionsChange={qs => setActiveSessions(prev => prev.map(x => (x.id === s.id ? { ...x, questions: qs } : x)))} 
              onToggleStatus={() => toggleSessionStatus(s.id)} 
              onAssign={(classId, data) => { 
                const c = classes.find(x => x.id === classId); 
                setClasses(prev => addAssignment(prev, classId, data)); 
                notify(`Призначено класу «${c?.name ?? ''}»`); 
              }} 
            />
          ) : null; 
        })()}

        <CreateSessionModal 
          isOpen={isCreatingSession} 
          onClose={() => setIsCreatingSession(false)} 
          onCreate={(title, duration, startTime, endTime, mode, timeLimitType, gradingSystem, maxScore, minScore, showResults, showErrors, showCorrectAnswers) => {
            const code = 'NMT-' + Math.floor(1000 + Math.random() * 9000);
            setActiveSessions(prev => [{ 
              id: code, 
              title: title.trim() || 'Без назви', 
              tag: 'НМТ', 
              studentsCount: 0, 
              date: 'Сьогодні', 
              status: 'Активна', 
              questions: newSessionQuestions, 
              durationMinutes: duration, 
              startTime: startTime, 
              endTime: endTime, 
              mode: mode, 
              isLive: mode === 'managed' ? false : true,
              timeLimitType,
              gradingSystem,
              maxScore,
              minScore,
              showResults,
              showErrors,
              showCorrectAnswers
            }, ...prev]);
            setIsCreatingSession(false); 
            setNewSessionQuestions([]); 
            setBasket([]); 
            notify(`Сесію ${code} успішно створено!`);
          }} 
        />
        
        <EditSessionModal session={editingSession} onClose={() => setEditingSession(null)} onSave={(id, data) => { setActiveSessions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s)); setEditingSession(null); notify('Налаштування сесії збережено!'); }} />
        
        <MeetingLinkModal session={editingMeetingSession} onClose={() => setEditingMeetingSession(null)} onSave={(id, url) => { setActiveSessions(prev => prev.map(s => s.id === id ? { ...s, meetingUrl: url } : s)); setEditingMeetingSession(null); }} />
        
        <InspectDetailsModal details={inspectDetails} onClose={() => setInspectDetails(null)} />

        <CommunityTestViewModal 
          test={viewingPublicTest} 
          onClose={() => setViewingPublicTest(null)} 
          onAddToBasket={addToBasket} 
        />

        {assignSource && (
          <AssignModal test={assignSource} classes={classes} onClose={() => setAssignSource(null)} onAssign={(classId, data) => { const c = classes.find(x => x.id === classId); setClasses(prev => addAssignment(prev, classId, data)); setAssignSource(null); notify(`Тест «${data.title}» призначено класу «${c?.name ?? ''}».`); }} />
        )}

        {isQuestionModalOpen && (
          <QuestionBuilder key={editingQuestion?.id ?? 'new'} initial={editingQuestion} onClose={closeQuestionModal} onSave={handleSaveQuestion} />
        )}

        <ConfirmModal 
          isOpen={!!confirmData} 
          title={confirmData?.title || ''} 
          message={confirmData?.message || ''} 
          onConfirm={() => confirmData?.onConfirm()} 
          onCancel={() => setConfirmData(null)} 
        />

        <InputModal 
          isOpen={!!inputData} 
          title={inputData?.title || ''} 
          placeholder={inputData?.placeholder || ''} 
          onClose={() => setInputData(null)} 
          onSubmit={(val) => inputData?.onSubmit(val)} 
        />

        {toast && (<div className="fixed top-6 right-6 z-[60] px-5 py-4 rounded-xl border border-teal-500/50 bg-white text-sm font-bold text-slate-900 shadow-xl shadow-teal-500/10 flex items-center space-x-3"><span className="text-xl">✨</span><span>{toast}</span></div>)}
      </div>
    </AccessProvider>
  );
}