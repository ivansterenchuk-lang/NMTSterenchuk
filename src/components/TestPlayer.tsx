import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface TestPlayerProps {
  questions: any[];
  sessionCode?: string;
  durationMinutes?: number;
  studentInfo?: { firstName: string; lastName: string };
  onFinish: (result: any) => void;
}

const getLetter = (index: number) => String.fromCharCode(1040 + index);

export default function TestPlayer({ 
  questions, 
  sessionCode, 
  durationMinutes, 
  studentInfo, 
  onFinish 
}: TestPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    durationMinutes ? durationMinutes * 60 : null
  );

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Помилка</h2>
        <p className="text-slate-500">У цьому тесті немає питань.</p>
        <button onClick={() => onFinish({ total: 0, max: 0, items: [], answers: {} })} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition">
          Повернутися
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  // Безпечне отримання тексту
  const getText = (val: any) => typeof val === 'string' ? val : (val?.text || '—');

  // Нормалізація даних
  const leftItems = currentQ.leftColumn?.map((x: any) => typeof x === 'string' ? { id: x, text: x } : x) || currentQ.leftItems || [];
  const rightItems = currentQ.rightColumn?.map((x: any) => typeof x === 'string' ? { id: x, text: x } : x) || currentQ.rightItems || [];
  
  const isMatching = currentQ.type === 'matching' || (leftItems.length > 0 && rightItems.length > 0);
  const isSequence = currentQ.type === 'sequence' || currentQ.type === 'chronology' || (currentQ.items && !leftItems.length && !currentQ.options);
  const isMultiple = currentQ.type === 'multiple' || currentQ.type === 'multi' || currentQ.isMultiple === true || Array.isArray(currentQ.correctAnswer) || Array.isArray(currentQ.correctAnswers);

  let currentSequence = answers[currentIndex];
  if (isSequence && !currentSequence) {
    currentSequence = (currentQ.sequenceItems || currentQ.items || []).map((x: any) => typeof x === 'string' ? { id: x, text: x } : x);
  }

  const handleAnswer = (val: any) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: val }));
  };

  const handleMatchChange = (leftId: string, rightId: string) => {
    const currentAnswer = answers[currentIndex] || {};
    handleAnswer({ ...currentAnswer, [leftId]: rightId });
  };

  const handleOptionClick = (optId: any) => {
    if (isMultiple) {
      const currentSelections = answers[currentIndex] || [];
      const isSelected = currentSelections.some((id: any) => String(id) === String(optId));
      const newSelections = isSelected 
        ? currentSelections.filter((id: any) => String(id) !== String(optId))
        : [...currentSelections, optId];
      handleAnswer(newSelections);
    } else {
      handleAnswer(optId);
    }
  };

  const moveSequenceItem = (index: number, direction: -1 | 1) => {
    const newSeq = [...currentSequence];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSeq.length) return;
    const temp = newSeq[index];
    newSeq[index] = newSeq[targetIndex];
    newSeq[targetIndex] = temp;
    handleAnswer(newSeq);
  };

  const handleFinish = () => {
    let total = 0;
    let max = 0;
    const items: any[] = [];

    questions.forEach((q, idx) => {
      const points = q.points || 1;
      max += points;
      const userAnswer = answers[idx];
      let isCorrect = false;
      let earnedPoints = 0;

      try {
        if (q.type === 'matching' || (q.leftColumn || q.leftItems)) {
          const pairs = q.correctMatches || q.correctPairs || {};
          if (userAnswer) {
            let correctCount = 0;
            const totalPairs = Object.keys(pairs).length;
            Object.keys(pairs).forEach(leftId => {
              if (String(userAnswer[leftId]) === String(pairs[leftId])) correctCount++;
            });
            if (correctCount === totalPairs && totalPairs > 0) {
               earnedPoints = points;
               isCorrect = true;
            }
          }
        } 
        else if (q.type === 'sequence' || q.type === 'chronology' || (q.sequenceItems && !q.leftColumn && !q.options)) {
          const correctOrder = q.correctOrder || (q.sequenceItems ? q.sequenceItems.map((x: any) => x.id || x.text || x) : []); 
          if (userAnswer && correctOrder.length > 0) {
            const userStr = JSON.stringify(userAnswer.map((i: any) => String(i.id || i.text || i)));
            const correctStr = JSON.stringify(correctOrder.map((i: any) => String(i.id || i.text || i)));
            if (userStr === correctStr) {
              earnedPoints = points;
              isCorrect = true;
            }
          }
        }
        else {
          const correctAns = q.correctAnswer !== undefined ? q.correctAnswer : (q.correctAnswers !== undefined ? q.correctAnswers : null);
          
          if (userAnswer !== undefined && correctAns !== null) {
             if (Array.isArray(correctAns) || Array.isArray(userAnswer)) {
                 const u = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map(String).sort();
                 const c = (Array.isArray(correctAns) ? correctAns : [correctAns]).map(String).sort();
                 isCorrect = JSON.stringify(u) === JSON.stringify(c);
             } else {
                 isCorrect = String(userAnswer) === String(correctAns);
             }
          } else if (userAnswer !== undefined && q.options) {
            const correctOpts = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id !== undefined ? o.id : (o.value !== undefined ? o.value : o.text));
            
            if (correctOpts.length > 1 || Array.isArray(userAnswer)) {
                const u = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map(String).sort();
                const c = correctOpts.map(String).sort();
                isCorrect = JSON.stringify(u) === JSON.stringify(c);
            } else {
                const correctOpt = correctOpts[0];
                if (correctOpt !== undefined) isCorrect = String(userAnswer) === String(correctOpt);
            }
          }
          if (isCorrect) earnedPoints = points;
        }
      } catch (e) {
        console.error("Помилка при перевірці питання", idx, e);
      }

      total += earnedPoints;
      items.push({ id: q.id, score: earnedPoints, max: points });
    });

    onFinish({ total, max, items, answers });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Верхня панель */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Питання</p>
          <p className="text-lg font-black text-slate-900">{currentIndex + 1} / {totalQuestions}</p>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}

        <button onClick={handleFinish} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition shadow-sm cursor-pointer">
          Завершити
        </button>
      </div>

      {/* Блок питання */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-relaxed mb-3">
            {currentQ.text || currentQ.prompt || currentQ.title || 'Питання без тексту'}
          </h2>
          {currentQ.image && (
            <div className="mb-4">
              <img src={currentQ.image} alt="До питання" className="max-h-64 object-contain rounded-xl border border-slate-200 shadow-sm" />
            </div>
          )}

          {isMultiple && (
            <p className="text-sm text-amber-600 font-medium mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Оберіть усі правильні варіанти відповіді
            </p>
          )}
        </div>

        {/* 1. ХРОНОЛОГІЯ */}
        {isSequence ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">Розставте події у хронологічній послідовності.</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {currentSequence.map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 transition">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 text-sm font-bold shrink-0 border border-teal-100">
                    {i + 1}
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-800">{getText(item)}</span>
                    {item.image && <img src={item.image} className="max-h-24 object-contain self-start rounded border border-slate-200" />}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => moveSequenceItem(i, -1)} disabled={i === 0} className="p-1 rounded bg-slate-100 text-slate-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 transition cursor-pointer">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveSequenceItem(i, 1)} disabled={i === currentSequence.length - 1} className="p-1 rounded bg-slate-100 text-slate-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-30 transition cursor-pointer">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isMatching ? (
          /* 2. ВІДПОВІДНІСТЬ */
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr] bg-slate-50 border-b border-slate-200 p-3 text-xs font-bold text-slate-600 uppercase">
                <div>Термін</div>
                <div>Відповідність</div>
              </div>
              {leftItems.map((left: any, i: number) => {
                const selectedRightId = answers[currentIndex]?.[left.id] || '';
                return (
                  <div key={left.id || i} className="grid grid-cols-[1fr_1fr] border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                    <div className="p-3 flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-800">{getText(left)}</span>
                        {left.image && <img src={left.image} className="max-h-20 object-contain self-start rounded border border-slate-200 mt-1" />}
                      </div>
                    </div>
                    <div className="p-2 border-l border-slate-100">
                      <select
                        value={selectedRightId}
                        onChange={(e) => handleMatchChange(left.id, e.target.value)}
                        className={`w-full p-2.5 rounded-lg border text-sm transition outline-none ${
                          selectedRightId 
                            ? 'border-teal-300 bg-teal-50 text-teal-900 font-medium' 
                            : 'border-slate-300 bg-white text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                        }`}
                      >
                        <option value="">— Оберіть варіант —</option>
                        {rightItems.map((right: any, j: number) => (
                          <option key={right.id || j} value={right.id}>
                            {getLetter(j)}. {getText(right)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 3. ЗВИЧАЙНІ ТА МНОЖИННІ ТЕСТИ */
          <div className="space-y-3">
            {currentQ.options ? (
              currentQ.options.map((opt: any, i: number) => {
                const optId = opt.id !== undefined ? opt.id : i;
                
                // ВИПРАВЛЕНО: Використовуємо ?? замість ||, щоб 0 (перший варіант) не вважався "порожнім"
                const currentSelections = answers[currentIndex] ?? (isMultiple ? [] : null);
                
                const isSelected = isMultiple 
                  ? Array.isArray(currentSelections) && currentSelections.some((id: any) => String(id) === String(optId))
                  : String(currentSelections) === String(optId);
                
                return (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(optId)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 cursor-pointer ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50 text-teal-900' 
                        : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 ${
                      isMultiple ? 'rounded-md' : 'rounded-full'
                    } ${
                      isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                      <span className="font-medium">{opt.text || opt.label || (typeof opt === 'string' ? opt : '')}</span>
                      {opt.image && (
                        <img src={opt.image} alt="Варіант" className="max-h-24 object-contain rounded border border-slate-200" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <textarea
                value={answers[currentIndex] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Введіть вашу відповідь..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none min-h-[120px]"
              />
            )}
          </div>
        )}
      </div>

      {/* Навігація */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>
        
        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            Далі <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            Завершити тест <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}