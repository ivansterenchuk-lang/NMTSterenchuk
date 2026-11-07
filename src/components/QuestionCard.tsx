import React from 'react';
import { KIND_LABELS, maxPoints, type Question } from '../lib/nmt';

type Props = {
  q: Question;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToSession?: () => void;
};

export default function QuestionCard({ q, index, expanded, onToggle, onEdit, onDelete, onAddToSession }: Props) {
  const type = q.type || 'single';
  const points = maxPoints(q);

  return (
    <div
      className={`rounded-xl border transition ${
        expanded ? 'border-indigo-500 bg-slate-950 shadow-lg' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
      }`}
    >
      {/* Заголовок картки */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="flex items-center justify-between gap-3 p-4 cursor-pointer"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs text-indigo-400 font-bold">№{index + 1}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/50">
              {KIND_LABELS[type] || type}
            </span>
            <span className="text-[10px] text-slate-500 truncate">{q.subject}</span>
          </div>
          <span className={`text-sm font-semibold text-slate-200 block ${expanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
            {q.text}
          </span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-lg font-bold">
            {points} б
          </span>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Видалити запитання"
            >
              🗑️
            </button>
          )}
          <span className={`text-slate-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </div>

      {/* Розгорнутий вміст */}
      {expanded && (
        <div className="px-4 pb-4 pt-4 space-y-4 border-t border-slate-800 bg-slate-950/30">
          
          <div className="text-sm text-slate-300 leading-relaxed mb-4">
            {q.text}
          </div>

          {/* ЗВИЧАЙНІ ПИТАННЯ (single / multiple) */}
          {(type === 'single' || type === 'multiple') && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isCorrect = opt.isCorrect;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                      isCorrect 
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {isCorrect && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">Правильна</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ВІДПОВІДНІСТЬ (matching) */}
          {type === 'matching' && q.leftColumn && q.rightColumn && (
            <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Завдання (Ліва колонка)</p>
                {q.leftColumn.map((leftItem, i) => {
                  const correctLetter = q.correctMatches?.[i];
                  const rightIndex = correctLetter ? correctLetter.charCodeAt(0) - 65 : -1;
                  const rightItem = rightIndex >= 0 && q.rightColumn ? q.rightColumn[rightIndex] : '—';
                  return (
                    <div key={i} className="flex flex-col gap-1 bg-slate-900 border border-slate-800 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <b className="text-indigo-300 w-5 shrink-0">{i + 1}.</b>
                        <span className="text-slate-300 flex-1">{leftItem}</span>
                      </div>
                      {correctLetter && (
                        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-800/50">
                          <span className="text-[10px] text-slate-500 ml-7 uppercase">Відповідь:</span>
                          <span className="text-xs font-black text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">{correctLetter}</span>
                          <span className="text-xs text-emerald-300 truncate">{rightItem}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Варіанти (Права колонка)</p>
                {q.rightColumn.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <b className="text-indigo-300 w-5 shrink-0">{String.fromCharCode(65 + i)}</b>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ПОСЛІДОВНІСТЬ (sequence) */}
          {type === 'sequence' && q.sequenceItems && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Правильна послідовність</p>
              {q.sequenceItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 text-sm text-emerald-300">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* КОМЕНТАР */}
          {q.comment && (
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-sm text-indigo-300 leading-relaxed mt-4">
              💡 <b>Коментар:</b> {q.comment}
            </div>
          )}

          {/* КНОПКИ ДІЙ */}
          {(onEdit || onAddToSession) && (
            <div className="flex flex-wrap gap-2 pt-4">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  ✏️ Редагувати
                </button>
              )}
              {onAddToSession && (
                <button
                  onClick={onAddToSession}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer flex items-center gap-2"
                >
                  ➕ Додати до сесії
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}