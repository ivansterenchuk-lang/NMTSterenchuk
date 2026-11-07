import { useState } from 'react';
import { totalMax, type ClassItem, type NewAssignment } from '../lib/classroom';
import type { PublicTest } from '../lib/search';
import { Calendar, Clock, PlayCircle } from 'lucide-react'; // Іконки

type Props = {
  test: PublicTest;
  classes: ClassItem[];
  onAssign: (classId: string, data: NewAssignment) => void;
  onClose: () => void;
};

const inp = 'w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition';

export default function AssignModal({ test, classes, onAssign, onClose }: Props) {
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [title, setTitle] = useState(test.title);
  const [instructions, setInstructions] = useState('');
  const [due, setDue] = useState('');
  
  // Нові стани для режимів
  const [mode, setMode] = useState<'default' | 'scheduled' | 'managed'>('default');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const subjectName = test.questions[0]?.subject || test.subject || 'Тест';
  
  // Валідація
  const canSubmit = !!classId && title.trim().length > 0 && (
    mode === 'default' || 
    (mode === 'scheduled' && startTime && endTime && startTime < endTime) ||
    (mode === 'managed')
  );

  const submit = () => {
    if (!canSubmit) return;
    onAssign(classId, {
      title: title.trim(),
      instructions: instructions.trim() || undefined,
      due: mode === 'default' ? (due || undefined) : undefined,
      // Передаємо нові поля
      mode: mode,
      startTime: mode === 'scheduled' ? startTime : undefined,
      endTime: mode === 'scheduled' ? endTime : undefined,
      questions: test.questions
    } as any); // as any, бо тип NewAssignment в classroom.ts можливо треба буде оновити
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Шапка */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">Призначити тест класу</h3>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {subjectName} · {test.questions.length} пит. · {totalMax(test.questions)} б · автор: {test.author}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition">
            ✕
          </button>
        </div>

        {/* Тіло */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {classes.length === 0 ? (
            <div className="text-center space-y-3 py-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-4xl">🎓</div>
              <p className="text-sm font-bold text-slate-800">У вас ще немає класів</p>
              <p className="text-xs text-slate-500">Створіть клас у вкладці «КЛАСИ», а потім поверніться сюди.</p>
            </div>
          ) : (
            <>
              {/* Вибір класу */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Оберіть клас</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {classes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setClassId(c.id)}
                      className={`w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 text-sm transition cursor-pointer ${
                        classId === c.id
                          ? 'bg-teal-50 border-teal-500 text-teal-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold">{c.name}</span>
                      <span className={`text-xs font-bold shrink-0 ${classId === c.id ? 'text-teal-600' : 'text-slate-500'}`}>{c.students?.length || 0} учн.</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Назва та інструкція */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Назва завдання</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={inp} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Інструкція (необов’язково)</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="Що потрібно зробити учням..."
                  className={`${inp} resize-none`}
                />
              </div>

              {/* БЛОК НАЛАШТУВАННЯ ЧАСУ ТА РЕЖИМУ */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Режим доступу</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Звичайний */}
                  <button
                    onClick={() => setMode('default')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col gap-1 ${
                      mode === 'default' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Calendar className={`w-4 h-4 ${mode === 'default' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${mode === 'default' ? 'text-teal-900' : 'text-slate-700'}`}>До дати</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Учень сам обирає час</span>
                  </button>

                  {/* Запланований */}
                  <button
                    onClick={() => setMode('scheduled')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col gap-1 ${
                      mode === 'scheduled' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${mode === 'scheduled' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${mode === 'scheduled' ? 'text-teal-900' : 'text-slate-700'}`}>Запланований</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Точний час початку та кінця</span>
                  </button>

                  {/* Керований */}
                  <button
                    onClick={() => setMode('managed')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col gap-1 ${
                      mode === 'managed' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <PlayCircle className={`w-4 h-4 ${mode === 'managed' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${mode === 'managed' ? 'text-teal-900' : 'text-slate-700'}`}>Активний</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Ви керуєте стартом і фінішем</span>
                  </button>
                </div>

                {/* Динамічні поля залежно від режиму */}
                {mode === 'default' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-700">Термін здачі (до якої дати)</label>
                    <input type="date" min={today} value={due} onChange={e => setDue(e.target.value)} className={inp} />
                  </div>
                )}

                {mode === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Початок</label>
                      <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className={inp} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Завершення</label>
                      <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className={inp} />
                    </div>
                  </div>
                )}

                {mode === 'managed' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 animate-in fade-in slide-in-from-top-2">
                    <b>Зверніть увагу:</b> Учні побачать завдання, але зможуть розпочати тест лише після того, як ви натиснете кнопку «Почати тестування» у вкладці «Класи» (або в моніторингу).
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Підвал */}
        {classes.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Призначити класу
            </button>
          </div>
        )}
      </div>
    </div>
  );
}