import { useState } from 'react';
import QuestionBuilder from './QuestionBuilder';
import QuestionCard from './QuestionCard';
import AssignModal from './AssignModal';
import { copyText } from './ClassroomShared';
import { maxPoints, type Question } from '../lib/nmt';
import type { ClassItem, NewAssignment } from '../lib/classroom';
import type { PublicTest } from '../lib/search';

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
  onAssign: (classId: string, data: NewAssignment) => void;
  onToggleStatus: () => void;
};

export default function SessionBuilder({ session, classes, onClose, onQuestionsChange, onAssign, onToggleStatus }: Props) {
  const qs = session.questions ?? [];
  const [editing, setEditing] = useState<Question | null>(null);
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);

  const points = qs.reduce((s, q) => s + maxPoints(q), 0);
  const active = session.status === 'Активна';

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

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900">
      <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-6">
        <button onClick={onClose} className="text-indigo-400 hover:underline text-xs font-bold">
          ← Повернутися на сайт
        </button>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                active
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {active ? 'Сесія активна' : 'Сесію завершено'}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              {qs.length} пит. · {points} б
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">{session.title}</h2>
        </div>

        <div className="rounded-2xl border-2 border-amber-500 bg-amber-950/40 p-6 space-y-4 shadow-lg">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">📡 Код для учнів</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-4xl font-black text-white tracking-[0.15em]">{session.id}</span>
            <button
              onClick={copy}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {copied ? '✓ Скопійовано' : '📋 Копіювати код'}
            </button>
          </div>
          <p className="text-xs text-slate-300">Учень вводить цей код у розділі «Тест за кодом».</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAssigning(true)}
              disabled={qs.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              📝 Призначити класу
            </button>
            <button
              onClick={onToggleStatus}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {active ? '⏹ Завершити сесію' : '▶ Відновити сесію'}
            </button>
          </div>
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-md p-6 space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-200">Питання сесії ({qs.length})</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Зміни стосуються лише цієї сесії. Оригінали у вашій бібліотеці не змінюються.
            </p>
          </div>
          {qs.length === 0 && <p className="text-xs text-slate-400">У сесії не залишилось питань.</p>}
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
    </div>
  );
}