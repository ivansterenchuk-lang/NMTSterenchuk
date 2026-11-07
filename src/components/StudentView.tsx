import React, { useState } from 'react';
import StudentClasses from './StudentClasses';
import TestPlayer from './TestPlayer';
import Whiteboard from './Whiteboard';
import { splitName } from '../lib/classroom';
import { supabase } from '../lib/supabase';
import { printHtml, sessionStudentHtml } from '../lib/pdf'; // Імпорт для PDF

export default function StudentView({ 
  classes, setClasses, studentName, changeStudentName, pendingJoin, consumeJoin,
  studentSession, classSession, studentFullName, sessionCode, setSessionCode, notify, ME_ID
}: any) {
  const [studentTab, setStudentTab] = useState<'classes' | 'test' | 'board'>('classes');
  const [isStudentInTest, setIsStudentInTest] = useState(false);
  const [tempName, setTempName] = useState(studentName || '');
  const [localError, setLocalError] = useState('');
  
  // ДОДАНО: Стан для збереження результатів тесту
  const [testResult, setTestResult] = useState<any>(null); 

  const startStudentTest = () => {
    setLocalError('');
    setTestResult(null); // Очищаємо минулі результати при новому старті

    if (!tempName.trim()) {
      setLocalError("Будь ласка, введіть своє ім'я та прізвище!");
      return;
    }
    if (!sessionCode.trim()) {
      setLocalError('Будь ласка, введіть код сесії!');
      return;
    }

    changeStudentName(tempName.trim());

    if (!studentSession && !classSession) {
      setLocalError('Сесію або завдання з таким кодом не знайдено. Перевірте код у вчителя.');
      return;
    }

    const questions = studentSession?.questions || classSession?.a?.questions || [];
    if (questions.length === 0) {
      setLocalError('У цьому тесті ще немає питань.');
      return;
    }

    if (studentSession) {
      if (studentSession.status === 'Завершена') {
        setLocalError('Ця сесія вже завершена.');
        return;
      }
      const now = new Date().getTime();
      if (studentSession.mode === 'scheduled') {
        if (studentSession.startTime && now < new Date(studentSession.startTime).getTime()) {
          setLocalError(`Тестування ще не розпочалося. Початок о ${new Date(studentSession.startTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`);
          return;
        }
        if (studentSession.endTime && now > new Date(studentSession.endTime).getTime()) {
          setLocalError('Час тестування вичерпано.');
          return;
        }
      }
      if (studentSession.mode === 'managed' && !studentSession.isLive) {
        setLocalError('Вчитель ще не розпочав це тестування. Зачекайте, будь ласка.');
        return;
      }
    }

    setIsStudentInTest(true);
  };

  const handleTestFinish = async (res: any) => {
    setIsStudentInTest(false);
    setTestResult(res); // Зберігаємо результат для показу екрану
    notify(`Тест завершено!`);

    // 1. Зберігаємо в Supabase (для живих сесій)
    if (supabase && studentSession) {
      try {
        const { error } = await supabase.from('submissions').insert({
          session_id: studentSession.id,
          student_name: tempName.trim(),
          score: res.total,
          max_score: res.max,
          answers: res.answers 
        });
        if (error) throw error;
      } catch (e: any) {
        console.error("Помилка збереження в базу:", e);
      }
    }

    // 2. Зберігаємо локально в клас (для домашніх завдань)
    if (classSession && !studentSession) {
      const { cls: cc, a: aa } = classSession;
      setClasses((prev: any) => (prev || []).map((c: any) => 
        c.id !== cc.id ? c : { 
          ...c, 
          assignments: (c.assignments || []).map((x: any) => 
            x.id !== aa.id || (x.submissions || []).some((s: any) => s.studentId === ME_ID) ? x : { 
              ...x, 
              submissions: [
                ...(x.submissions || []), 
                { 
                  studentId: ME_ID, 
                  name: tempName.trim(), 
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
      ));
    }
  };

  // ДОДАНО: Функція для генерації та скачування PDF
  const downloadPdf = () => {
    if (!testResult) return;
    
    const questions = studentSession?.questions || classSession?.a?.questions || [];
    const percent = Math.round((testResult.total / testResult.max) * 100) || 0;
    const title = studentSession?.title || classSession?.a?.title || 'Тестування';
    const teacher = studentSession?.teacherName || classSession?.cls?.teacherName || 'Вчитель';

    printHtml(
      sessionStudentHtml({
        studentName: tempName,
        sessionTitle: title,
        percent: percent,
        answers: testResult.items || testResult.answers, 
        questions: questions,
        teacher: teacher
      }),
      `Результат — ${tempName}`
    );
    notify('PDF з результатами згенеровано!');
  };

  return (
    <div className="space-y-6">
      {/* НАВІГАЦІЯ УЧНЯ (Світла тема) */}
      <div className="flex flex-wrap gap-2">
        {([['classes', '🎓 Класи'], ['test', '🎯 Тест за кодом'], ['board', '✏️ Дошка']] as const).map(([k, label]) => (
          <button 
            key={k} 
            onClick={() => { 
              if (isStudentInTest) {
                if (confirm('Ви впевнені, що хочете вийти з тесту? Результати не збережуться.')) {
                  setIsStudentInTest(false);
                  setStudentTab(k);
                }
              } else {
                setStudentTab(k); 
                setLocalError('');
              }
            }} 
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              studentTab === k && !isStudentInTest 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* КОНТЕНТ ВКЛАДОК */}
      {isStudentInTest ? (
        <TestPlayer 
          questions={studentSession?.questions ?? classSession?.a?.questions ?? []} 
          sessionCode={sessionCode} 
          durationMinutes={studentSession?.durationMinutes}
          studentInfo={splitName(tempName || studentFullName)} 
          onFinish={handleTestFinish} 
        />
      ) : studentTab === 'classes' ? (
        <StudentClasses 
          classes={classes} 
          setClasses={setClasses} 
          student={{ id: ME_ID, name: studentName }} 
          onStudentNameChange={changeStudentName} 
          joinCode={pendingJoin} 
          onJoinConsumed={consumeJoin} 
        />
      ) : studentTab === 'board' ? (
        <div className="space-y-4">
           <Whiteboard roomId="classroom-1" studentName={studentFullName} />
        </div>
      ) : testResult ? (
        
        /* ЕКРАН РЕЗУЛЬТАТІВ ТЕСТУ (З'являється після завершення) */
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-emerald-100 shadow-sm">
            🏆
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Тест завершено!</h2>
            <p className="text-sm text-slate-500 mt-1">Дякуємо за проходження.</p>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ваш результат</p>
            <div className="text-5xl font-black text-teal-600">
              {testResult.total} <span className="text-2xl text-slate-400">/ {testResult.max}</span>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-2">
              Це {Math.round((testResult.total / testResult.max) * 100) || 0}% правильних відповідей
            </p>
          </div>
          
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
            <button 
              onClick={downloadPdf} 
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              📄 Завантажити PDF з результатами
            </button>
            <button 
              onClick={() => { setTestResult(null); setSessionCode(''); }} 
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Повернутися до входу
            </button>
          </div>
        </div>

      ) : (
        
        /* ФОРМА ВХОДУ НА ТЕСТУВАННЯ */
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-6">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold border border-teal-100">
            🎯
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Вхід на тестування</h2>
          
          <div className="text-left space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ваше ім'я та прізвище
              </label>
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
                placeholder="Наприклад: Іван Франко" 
                className="w-full p-3.5 mt-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Код сесії або ДЗ
              </label>
              <input 
                type="text" 
                value={sessionCode} 
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())} 
                onKeyDown={(e) => { if (e.key === 'Enter') startStudentTest(); }} 
                placeholder="Введіть код (напр. HIST-30)" 
                className="w-full p-3.5 mt-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl text-center font-bold text-lg uppercase focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition" 
              />
            </div>
          </div>

          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3 text-center">
              {localError}
            </div>
          )}

          <button 
            type="button"
            onClick={startStudentTest} 
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            Розпочати тестування 🚀
          </button>
          
          {studentSession?.meetingUrl && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">Вчитель призначив відеоурок для цієї сесії:</p>
              <a 
                href={studentSession.meetingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>📹 Приєднатися до Zoom / Meet</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}