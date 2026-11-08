import { useState } from 'react';
import { KIND_LABELS, maxPoints, type Question } from '../lib/nmt';

type Props = {
  items: Question[];
  flash: boolean;
  onRemove: (id: number) => void;
  onClear: () => void;
  onStart: (title: string) => void;
  onReorder: (newItems: Question[]) => void;
};

export default function SessionBasket({ items, flash, onRemove, onClear, onStart, onReorder }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  
  const points = items.reduce((s, q) => s + maxPoints(q), 0);
  const glow = flash ? 'ring-4 ring-amber-400/50' : '';

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;
    onReorder(newItems);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed right-4 top-24 z-30 px-4 py-3 rounded-2xl border border-amber-400 bg-white shadow-lg text-xs font-black text-slate-800 transition cursor-pointer ${glow}`}
      >
        🧺 Збірка: {items.length} ▸
      </button>
    );
  }

  return (
    <aside
      className={`fixed right-4 top-24 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-400 bg-white shadow-xl overflow-hidden transition ${glow} flex flex-col`}
    >
      {/* Шапка */}
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">🧺 Збірка для сесії</p>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            {items.length} пит. · <span className="text-emerald-600">{points} б</span>
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-slate-400 hover:text-slate-800 text-sm font-bold px-2 cursor-pointer transition"
          title="Згорнути"
        >
          ▾
        </button>
      </div>

      {/* Список питань */}
      <div className="max-h-[40vh] overflow-y-auto divide-y divide-slate-100">
        {items.length === 0 && (
          <div className="text-center p-6 text-slate-400 text-sm italic">
            Збірка порожня
          </div>
        )}
        {items.map((q, i) => (
          <div key={q.id} className="flex items-center gap-1 px-2 py-2.5 hover:bg-slate-50 transition group">
            
            {/* Стрілочки переміщення */}
            <div className="flex flex-col space-y-0.5 px-1">
              <button 
                onClick={() => moveItem(i, -1)} 
                disabled={i === 0}
                className="text-slate-400 hover:text-teal-600 disabled:opacity-20 text-[10px] leading-none cursor-pointer"
              >
                ▲
              </button>
              <button 
                onClick={() => moveItem(i, 1)} 
                disabled={i === items.length - 1}
                className="text-slate-400 hover:text-teal-600 disabled:opacity-20 text-[10px] leading-none cursor-pointer"
              >
                ▼
              </button>
            </div>

            {/* Текст питання */}
            <div className="min-w-0 flex-1 px-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}.</span>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase truncate">
                  {KIND_LABELS[q.type || 'single']}
                </span>
                <span className="text-[9px] font-bold text-emerald-600 ml-auto">{maxPoints(q)} б</span>
              </div>
              <p className="text-xs text-slate-700 truncate">{q.text || 'Питання без тексту'}</p>
            </div>

            {/* Кнопка видалення */}
            <button
              onClick={() => onRemove(q.id)}
              className="text-slate-400 hover:text-red-500 text-xs font-bold px-1 cursor-pointer transition opacity-0 group-hover:opacity-100"
              title="Прибрати зі збірки"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Підвал */}
      <div className="p-4 space-y-2 border-t border-slate-100 bg-white">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Назва сесії (необов’язково)"
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
        />
        <button
          onClick={() => onStart(title)}
          disabled={items.length === 0}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
        >
          ▶ Перейти до налаштувань
        </button>
        <button
          onClick={onClear}
          className="w-full text-[11px] font-bold text-slate-400 hover:text-red-500 transition cursor-pointer"
        >
          Очистити збірку
        </button>
      </div>
    </aside>
  );
}