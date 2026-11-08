import React, { useState, useEffect } from 'react';

export default function InspectDetailsModal({ 
  details, 
  onClose 
}: { 
  details: any | null; 
  onClose: () => void; 
}) {
  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    if (details) setShowComment(false);
  }, [details]);

  if (!details) return null;

  const q = details.question;
  const getText = (val: any) => typeof val === 'string' ? val : (val?.text || '—');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div>
            <h3 className="font-bold text-lg text-white">Питання №{details.qIndex + 1}</h3>
            <p className="text-xs text-indigo-400 font-bold">Учень: {details.studentName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-400 transition text-xl font-bold p-2 cursor-pointer">
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-base font-medium leading-relaxed text-slate-200">
            {q?.text || q?.title || 'Текст питання відсутній'}
          </div>
          
          {/* ЗВИЧАЙНІ ПИТАННЯ */}
          {(!q.type || q.type === 'single' || q.type === 'multiple') && q.options && (
            <div className="space-y-2">
              {q.options.map((opt: any, i: number) => {
                const isCorrectAnswer = opt.isCorrect;
                return (
                  <div key={i} className={`p-3 rounded-xl border flex items-start space-x-3 ${isCorrectAnswer ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-slate-950 border-slate-800'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isCorrectAnswer ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1 text-sm text-slate-300">
                      {opt.text || opt.label || 'Варіант відповіді'}
                    </div>
                    {isCorrectAnswer && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 self-center">
                        Правильна
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ВІДПОВІДНІСТЬ (ТАБЛИЦЯ) */}
          {q.type === 'matching' && q.leftColumn && q.rightColumn && (
            <div className="overflow-hidden rounded-xl border border-slate-700">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-bold w-16 text-center">№</th>
                    <th className="px-4 py-3 font-bold w-1/3">Завдання</th>
                    <th className="px-4 py-3 font-bold w-16 text-center">Літера</th>
                    <th className="px-4 py-3 font-bold w-1/3">Правильна відповідь</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {q.leftColumn.map((item: any, i: number) => {
                    const correctLetter = q.correctMatches?.[i];
                    const rightIndex = correctLetter ? correctLetter.charCodeAt(0) - 65 : -1;
                    const rightItem = rightIndex >= 0 && q.rightColumn ? q.rightColumn[rightIndex] : '—';
                    
                    return (
                      <tr key={i} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 text-center font-bold text-indigo-400">{i + 1}</td>
                        {/* ВИПРАВЛЕНО: безпечне виведення тексту */}
                        <td className="px-4 py-3">{getText(item)}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-400 bg-emerald-900/10">{correctLetter || '—'}</td>
                        <td className="px-4 py-3 text-emerald-300 bg-emerald-900/10">{getText(rightItem)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ПОСЛІДОВНІСТЬ */}
          {q.type === 'sequence' && q.sequenceItems && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Правильна послідовність</h4>
              {q.sequenceItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center space-x-3 text-sm bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                  <span className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  {/* ВИПРАВЛЕНО: безпечне виведення тексту */}
                  <span className="text-emerald-300">{getText(item)}</span>
                </div>
              ))}
            </div>
          )}

          {/* КОМЕНТАР */}
          <div className="pt-4 border-t border-slate-800">
            {(q.comment || q.explanation) ? (
              <div>
                <button 
                  onClick={() => setShowComment(!showComment)} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <span>💡 {showComment ? 'Приховати коментар' : 'Показати коментар'}</span>
                </button>
                {showComment && (
                  <div className="mt-3 p-4 bg-slate-950 border border-indigo-900/50 rounded-xl text-sm text-slate-300 leading-relaxed">
                    {q.comment || q.explanation}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Коментар до цього питання відсутній.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}