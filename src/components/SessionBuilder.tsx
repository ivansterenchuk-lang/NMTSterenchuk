import { useState, useMemo } from 'react';
import QuestionBuilder from './QuestionBuilder';
import QuestionCard from './QuestionCard';
import AssignModal from './AssignModal';
import ShareModal from './ShareModal';
import { copyText } from './ClassroomShared';
import { maxPoints, type Question } from '../lib/nmt';
import type { ClassItem } from '../lib/classroom'; // 🔥 Прибрано NewAssignment
import type { PublicTest } from '../lib/search';
import { CheckCircle2, ListChecks, Link2, ListOrdered, FileText } from 'lucide-react';

type SessionLite = {
  id: string;
  title: string;
  status: 'Активна' | 'Завершена';
  questions?: Question[];
};

type Props = {
  session: SessionLite;
  classes: ClassItem[];
  onClose: () => void;
  onQuestionsChange: (qs: Question[]) => void;
  onAssign: (classId: string, data: any) => void; // 🔥 Замінено NewAssignment на any
  onToggleStatus: () => void;
};

export default function SessionBuilder({ session, classes, onClose, onQuestionsChange, onAssign, onToggleStatus }: Props) {
  const qs = session.questions ?? [];
  const [editing, setEditing] = useState<Question | null>(null);
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const points = qs.reduce((s, q) => s + maxPoints(q), 0);
  const active = session.status === 'Активна';

  // 🔥 Розрахунок статистики
  const stats = useMemo(() => {
    const res = { single: 0, multiple: 0, matching: 0, sequence: 0, notebook: 0, total: 0 };
    qs.forEach(q => {
      res.total++;
      const type = (q as any).type;
      if (type === 'matching' || (q as any).leftItems?.length > 0 || (q as any).leftColumn) res.matching++;
      else if (type === 'sequence') res.sequence++;
      else if (type === 'multiple') res.multiple++;
      else if (type === 'notebook' || (q as any).isNotebook) res.notebook++;
      else res.single++;
    });
    return res;
  }, [qs]);

  const asTest: PublicTest = {
    id: session.id,
    title: session.title,
    author: 'Ви',
    subject: qs[0]?.subject ?? 'history',
    tags: [],
    updated: 'щойно',
    questions: qs
  };

  const copy = async () => {
    await copyText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleOpenAssign = () => {
    if (classes.length === 0) {
      alert('У вас ще немає створених класів. Перейдіть у вкладку "КЛАСИ" та створіть клас.');
      return;
    }
    setAssigning(true);
  };

  const directLink = `${window.location.origin}/?join=${session.id}`;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-50">
      
      {/* Плаваюче вікно статистики */}
      <div className="hidden xl:block fixed right-8 top-24 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-5 z-50">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 text-sm flex items-center gap-2">
          📊 Статистика сесії
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Одна відп.</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded-md">{stats.single}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5"><ListChecks className="w-4 h-4 text-blue-500"/> Множинний</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded-md">{stats.multiple}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5"><Link2 className="w-4 h-4 text-purple-500"/> Відповідність</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded-md">{stats.matching}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5"><ListOrdered className="w-4 h-4 text-amber-500"/> Послідовність</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded-md">{stats.sequence}</span>
          </div>
          {stats.notebook > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500"/> Зошит</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded-md">{stats.notebook}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center font-black text-slate-900 text-sm">
          <span>Всього:</span>
          <span className="text-teal-600 text-lg">{stats.total}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-6 relative z-10">
        <button onClick={onClose} className="text-teal-600 hover:underline text-xs font-bold inline-flex items-center gap-1">
          <span>← Повернутися до сесій</span>
        </button>

        {/* Заголовок */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                active
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {active ? 'Сесія активна' : 'Сесію завершено'}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
              {qs.length} пит. · {points} б
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">{session.title}</h2>
        </div>

        {/* Блок з кодом та посиланням */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">📡 Код та посилання для учнів</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-4xl font-black text-slate-900 tracking-[0.15em]">{session.id}</span>
            
            <button
              onClick={copy}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              {copied ? '✓ Скопійовано' : '📋 Копіювати код'}
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              🔗 Поділитися
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium">Учень може ввести цей код у розділі «Тест за кодом» або перейти за прямим посиланням.</p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleOpenAssign}
              disabled={qs.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>📝 Призначити класу</span>
            </button>
            <button
              onClick={onToggleStatus}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              {active ? '⏹ Завершити сесію' : '▶ Відновити сесію'}
            </button>
          </div>
        </div>

        {/* Список питань */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Питання сесії ({qs.length})</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Зміни стосуються лише цієї сесії. Оригінали у вашій бібліотеці не змінюються.
            </p>
          </div>
          
          {qs.length === 0 && <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-200">У сесії не залишилось питань.</p>}
          
          <div className="space-y-2">
            {qs.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i}
                expanded={openQ === q.id}
                onToggle={() => setOpenQ(openQ === q.id ? null : q.id)}
                onEdit={() => setEditing(q)}
                onDelete={() => {
                  if (confirm('Прибрати це питання з сесії?')) onQuestionsChange(qs.filter(x => x.id !== q.id));
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Вікно редагування питання */}
      {editing && (
        <QuestionBuilder
          key={editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={q => {
            onQuestionsChange(qs.map(x => (x.id === q.id ? q : x)));
            setEditing(null);
          }}
        />
      )}

      {/* Вікно призначення класу */}
      {assigning && (
        <AssignModal
          test={asTest}
          classes={classes}
          onClose={() => setAssigning(false)}
          onAssign={(classId, data) => {
            onAssign(classId, data);
            setAssigning(false);
          }}
        />
      )}

      {/* Модальне вікно "Поділитися" */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={directLink}
        title={session.title}
      />
    </div>
  );
}