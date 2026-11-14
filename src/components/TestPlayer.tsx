import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, X } from 'lucide-react';

interface TestPlayerProps {
  questions: any[];
  sessionCode?: string;
  durationMinutes?: number;
  studentInfo?: { firstName: string; lastName: string };
  onFinish: (result: any) => void;
}

const getLetter = (index: number) => String.fromCharCode(1040 + index);

const getOptId = (opt: any, i: number) => {
  if (opt == null) return i;
  if (typeof opt === 'string') return opt;
  if (opt.id !== undefined && opt.id !== null) return opt.id;
  if (opt.value !== undefined && opt.value !== null) return opt.value;
  return i;
};

const getItemId = (item: any, index: number) => {
  if (item == null) return String(index);
  if (typeof item === 'string') return item;
  if (item.id !== undefined && item.id !== null) return String(item.id);
  if (item.value !== undefined && item.value !== null) return String(item.value);
  if (item.text !== undefined && item.text !== null) return String(item.text);
  return String(index);
};

function computeResult(questions: any[], answers: Record<number, any>) {
  let total = 0;
  let max = 0;
  const items: any[] = [];

  questions.forEach((q, idx) => {
    const points = q.points ?? 1;
    const pointsMode = q.pointsMode || 'all';
    max += points;
    const userAnswer = answers[idx];
    let earnedPoints = 0;

    try {
      if (q.type === 'matching' || (q.leftColumn || q.leftItems)) {
        const raw = q.correctMatches ?? q.correctPairs ?? {};
        const pairs: Record<string, string> = {};
        if (Array.isArray(raw)) {
          raw.forEach((p: any) => {
            if (p?.left != null) pairs[String(p.left)] = String(p.right ?? p.rightId);
          });
        } else {
          Object.entries(raw).forEach(([k, v]: [string, any]) => {
            pairs[k] = String(v?.id ?? v?.value ?? v);
          });
        }
        const totalPairs = Object.keys(pairs).length;
        let correctCount = 0;
        Object.keys(pairs).forEach(leftId => {
          if (userAnswer && String(userAnswer[leftId]) === String(pairs[leftId])) correctCount++;
        });
        if (pointsMode === 'partial' && totalPairs > 0) {
          earnedPoints = Math.round((correctCount / totalPairs) * points * 100) / 100;
        } else if (correctCount === totalPairs && totalPairs > 0) {
          earnedPoints = points;
        }
      }
      else if (q.type === 'sequence' || q.type === 'chronology' || (q.sequenceItems && !q.leftColumn && !q.options)) {
        const initialSeq = (q.sequenceItems || q.items || []).map((x: any) => typeof x === 'string' ? { id: x, text: x } : x);
        const currentSeq = userAnswer || initialSeq;
        const correctOrder = (q.correctOrder || initialSeq.map((x: any) => x.id ?? x.text ?? x)).map((x: any) => String(x?.id ?? x?.text ?? x));
        const userOrder = currentSeq.map((x: any) => String(x?.id ?? x?.text ?? x));

        if (pointsMode === 'partial' && correctOrder.length > 0) {
          let correctPos = 0;
          // 🔥 ВИПРАВЛЕНО: Додано типи string та number
          correctOrder.forEach((cid: string, i: number) => { 
            if (userOrder[i] === cid) correctPos++; 
          });
          earnedPoints = Math.round((correctPos / correctOrder.length) * points * 100) / 100;
        } else if (JSON.stringify(userOrder) === JSON.stringify(correctOrder)) {
          earnedPoints = points;
        }
      }
      else {
        const correctAns = q.correctAnswer ?? q.correctAnswers ?? null;
        if (correctAns !== null && userAnswer !== undefined) {
          const u = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map(String).sort();
          const c = (Array.isArray(correctAns) ? correctAns : [correctAns]).map(String).sort();
          if (pointsMode === 'partial' && c.length > 1) {
            const hits = u.filter(x => c.includes(x)).length;
            earnedPoints = Math.round((hits / c.length) * points * 100) / 100;
          } else if (JSON.stringify(u) === JSON.stringify(c)) {
            earnedPoints = points;
          }
        } else if (q.options) {
          const correctOpts = q.options.map((o: any, i: number) => (o.isCorrect ? getOptId(o, i) : null)).filter((x: any) => x !== null);
          const u = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map(String).sort();
          const c = correctOpts.map(String).sort();
          if (pointsMode === 'partial' && c.length > 1) {
            const hits = u.filter(x => c.includes(x)).length;
            earnedPoints = Math.round((hits / c.length) * points * 100) / 100;
          } else if (JSON.stringify(u) === JSON.stringify(c)) {
            earnedPoints = points;
          }
        }
      }
    } catch (e) {
      console.error('Помилка при перевірці питання', idx, e);
    }

    total += earnedPoints;
    items.push({ id: q.id, score: earnedPoints, max: points, correct: earnedPoints === points });
  });

  return { total, max, items, answers };
}

export default function TestPlayer({ questions, sessionCode, durationMinutes, studentInfo, onFinish }: TestPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(durationMinutes ? durationMinutes * 60 : null);
  
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const handleFinish = () => { onFinish(computeResult(questions, answersRef.current)); };

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleFinish(); return; }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const currentQ = questions && questions.length > 0 ? questions[currentIndex] : null;

  useEffect(() => {
    if (!currentQ) return;
    const isSeq = currentQ.type === 'sequence' || currentQ.type === 'chronology' || (currentQ.items && !currentQ.leftColumn && !currentQ.options);
    if (isSeq && answers[currentIndex] === undefined) {
      const initialSeq = (currentQ.sequenceItems || currentQ.items || []).map((x: any) => typeof x === 'string' ? { id: x, text: x } : x);
      const shuffled = [...initialSeq].sort(() => Math.random() - 0.5);
      setAnswers(prev => ({ ...prev, [currentIndex]: shuffled }));
    }
  }, [currentIndex, currentQ, answers]);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Помилка</h2>
        <p className="text-slate-500">У цьому тесті немає питань.</p>
        <button onClick={() => onFinish({ total: 0, max: 0, items: [], answers: {} })} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl">Повернутися</button>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const getText = (val: any) => (typeof val === 'string' ? val : val?.text || '—');

  const leftItems = (currentQ.leftColumn || currentQ.leftItems || []).map((x: any) => typeof x === 'string' ? { text: x } : x);
  const rightItems = (currentQ.rightColumn || currentQ.rightItems || []).map((x: any) => typeof x === 'string' ? { text: x } : x);

  const isMatching = currentQ.type === 'matching' || (leftItems.length > 0 && rightItems.length > 0);
  const isSequence = currentQ.type === 'sequence' || currentQ.type === 'chronology' || (currentQ.items && !leftItems.length && !currentQ.options);
  const isMultiple = currentQ.type === 'multiple' || currentQ.type === 'multi' || currentQ.isMultiple === true || Array.isArray(currentQ.correctAnswer) || Array.isArray(currentQ.correctAnswers);

  const currentSequence = answers[currentIndex] || [];

  const handleAnswer = (val: any) => setAnswers(prev => ({ ...prev, [currentIndex]: val }));

  const handleMatchChange = (leftId: string, rightId: string) => {
    const currentAnswer = answers[currentIndex] || {};
    handleAnswer({ ...currentAnswer, [leftId]: rightId });
  };

  const handleOptionClick = (optId: any) => {
    if (isMultiple) {
      const currentSelections = answers[currentIndex] || [];
      const isSelected = currentSelections.some((id: any) => String(id) === String(optId));
      const newSelections = isSelected ? currentSelections.filter((id: any) => String(id) !== String(optId)) : [...currentSelections, optId];
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasImageOptions = currentQ.options?.some((o: any) => o.image);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Питання</p>
          <p className="text-lg font-black text-slate-900">{currentIndex + 1} / {totalQuestions}</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'}`}>
            <Clock className="w-5 h-5" />{formatTime(timeLeft)}
          </div>
        )}
        <button onClick={handleFinish} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition shadow-sm cursor-pointer">Завершити</button>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-relaxed mb-3">{currentQ.text || currentQ.prompt || currentQ.title || 'Питання без тексту'}</h2>
          {currentQ.image && (
            <div className="mb-4">
              <img src={currentQ.image} alt="До питання" onClick={() => setZoomedImage(currentQ.image)} className="max-h-64 object-contain rounded-xl border border-slate-200 shadow-sm cursor-zoom-in hover:opacity-90 transition" />
            </div>
          )}
          {isMultiple && (
            <p className="text-sm text-amber-600 font-medium mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />Оберіть усі правильні варіанти відповіді</p>
          )}
        </div>

        {isSequence ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">Розставте події у хронологічній послідовності.</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {currentSequence.map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 transition">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 text-sm font-bold shrink-0 border border-teal-100">{i + 1}</span>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-800">{getText(item)}</span>
                    {item.image && <img src={item.image} onClick={() => setZoomedImage(item.image)} className="max-h-24 object-contain self-start rounded border border-slate-200 cursor-zoom-in" />}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => moveSequenceItem(i, -1)} disabled={i === 0} className="p-1 rounded bg-slate-100 text-slate-500 hover:text-teal-600 disabled:opacity-30 cursor-pointer"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSequenceItem(i, 1)} disabled={i === currentSequence.length - 1} className="p-1 rounded bg-slate-100 text-slate-500 hover:text-teal-600 disabled:opacity-30 cursor-pointer"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isMatching ? (
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr] bg-slate-50 border-b border-slate-200 p-3 text-xs font-bold text-slate-600 uppercase"><div>Термін</div><div>Відповідність</div></div>
              {leftItems.map((left: any, i: number) => {
                const leftId = getItemId(left, i);
                const selectedRightId = answers[currentIndex]?.[leftId] || '';
                return (
                  <div key={leftId} className="grid grid-cols-[1fr_1fr] border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                    <div className="p-3 flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold shrink-0">{i + 1}</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-800">{getText(left)}</span>
                        {left.image && <img src={left.image} onClick={() => setZoomedImage(left.image)} className="max-h-20 object-contain self-start rounded border border-slate-200 mt-1 cursor-zoom-in" />}
                      </div>
                    </div>
                    <div className="p-2 border-l border-slate-100">
                      <select value={selectedRightId} onChange={e => handleMatchChange(leftId, e.target.value)} className={`w-full p-2.5 rounded-lg border text-sm outline-none ${selectedRightId ? 'border-teal-300 bg-teal-50 text-teal-900 font-medium' : 'border-slate-300 bg-white text-slate-700'}`}>
                        <option value="">— Оберіть варіант —</option>
                        {rightItems.map((right: any, j: number) => {
                          const rightId = getItemId(right, j);
                          return <option key={rightId} value={rightId}>{getLetter(j)}. {getText(right)}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {currentQ.options ? (
              hasImageOptions ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQ.options.map((opt: any, i: number) => {
                    const optId = getOptId(opt, i);
                    const currentSelections = answers[currentIndex] ?? (isMultiple ? [] : null);
                    const isSelected = isMultiple ? Array.isArray(currentSelections) && currentSelections.some((id: any) => String(id) === String(optId)) : String(currentSelections) === String(optId);

                    return (
                      <button key={i} onClick={() => handleOptionClick(optId)} className={`relative flex flex-col items-stretch text-left rounded-xl border-2 transition overflow-hidden cursor-pointer ${isSelected ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-200'}`}>
                        <div className={`absolute top-3 right-3 z-10 w-6 h-6 border-2 flex items-center justify-center shrink-0 ${isMultiple ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white/90'}`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        {opt.image && (
                          <div className="w-full bg-slate-100 flex items-center justify-center p-2">
                            <img src={opt.image} alt="Варіант" onClick={(e) => { e.stopPropagation(); setZoomedImage(opt.image); }} className="max-h-48 sm:max-h-64 w-full object-contain rounded cursor-zoom-in" />
                          </div>
                        )}
                        {(opt.text || opt.label || typeof opt === 'string') && (
                          <div className="p-4 flex-1"><span className="font-medium text-slate-800">{opt.text || opt.label || (typeof opt === 'string' ? opt : '')}</span></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentQ.options.map((opt: any, i: number) => {
                    const optId = getOptId(opt, i);
                    const currentSelections = answers[currentIndex] ?? (isMultiple ? [] : null);
                    const isSelected = isMultiple ? Array.isArray(currentSelections) && currentSelections.some((id: any) => String(id) === String(optId)) : String(currentSelections) === String(optId);
                    return (
                      <button key={i} onClick={() => handleOptionClick(optId)} className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 cursor-pointer ${isSelected ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 hover:border-teal-200 text-slate-700'}`}>
                        <div className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 ${isMultiple ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className="font-medium">{opt.text || opt.label || (typeof opt === 'string' ? opt : '')}</span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <textarea value={answers[currentIndex] || ''} onChange={e => handleAnswer(e.target.value)} placeholder="Введіть вашу відповідь..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[120px]" />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="px-6 py-3 bg-white border border-slate-200 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Назад
        </button>
        {currentIndex < totalQuestions - 1 ? (
          <button onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-teal-700 transition cursor-pointer">
            Далі <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleFinish} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition cursor-pointer">
            Завершити тест <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition" onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}>
            <X className="w-6 h-6" />
          </button>
          <img src={zoomedImage} alt="Збільшене зображення" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}