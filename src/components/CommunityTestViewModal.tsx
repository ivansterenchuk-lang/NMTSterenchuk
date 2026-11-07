import React from 'react';
import type { PublicTest } from '../lib/search';
import type { Question } from '../lib/nmt';

export default function CommunityTestViewModal({
  test,
  onClose,
  onAddToBasket
}: {
  test: PublicTest | null;
  onClose: () => void;
  onAddToBasket: (qs: Question[]) => void;
}) {
  if (!test) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div>
            <h3 className="font-bold text-xl text-white">{test.title}</h3>
            <p className="text-sm text-slate-400 mt-1">Автор: {test.author} • {test.questions.length} питань</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onAddToBasket(test.questions)} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              ➕ Всю збірку до себе
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-400 transition text-2xl font-bold p-2 cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        {/* Список питань */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-900">
          {test.questions.map((q: Question, idx: number) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <span className="w-8 h-8 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-lg flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-slate-200 font-medium">{q.text}</p>
                </div>
                <button 
                  onClick={() => onAddToBasket([q])}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                  title="Додати це питання до збірки"
                >
                  + У збірку
                </button>
              </div>

              {/* Варіанти відповідей */}
              {q.type !== 'matching' && q.type !== 'sequence' && q.options && (
                <div className="space-y-2 pl-11">
                  {q.options.map((opt: any, i: number) => (
                    <div key={i} className={`p-2 rounded-lg border text-sm flex items-center space-x-3 ${opt.isCorrect ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                      <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt.text}</span>
                      {opt.isCorrect && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-400">Правильна</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Відображення для відповідності */}
              {q.type === 'matching' && q.leftColumn && q.rightColumn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pl-11">
                  <div className="space-y-2">
                    {q.leftColumn.map((item: string, i: number) => (
                      <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 text-sm flex space-x-2">
                        <span className="text-indigo-400 font-bold">{i + 1}.</span> <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {q.rightColumn.map((item: string, i: number) => (
                      <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 text-sm flex space-x-2">
                        <span className="text-emerald-400 font-bold">{String.fromCharCode(65 + i)})</span> <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Відображення для послідовності */}
              {q.type === 'sequence' && q.sequenceItems && (
                <div className="space-y-2 mt-2 pl-11">
                  {q.sequenceItems.map((item: string, i: number) => (
                    <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 text-sm flex space-x-2">
                      <span className="text-emerald-400 font-bold">{i + 1}.</span> <span className="text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Коментар */}
              {q.comment && (
                <div className="mt-3 ml-11 p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-lg text-xs text-indigo-300">
                  💡 {q.comment}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Кнопки внизу */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition cursor-pointer">
            Закрити
          </button>
        </div>

      </div>
    </div>
  );
}