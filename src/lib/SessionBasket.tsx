import { useState } from 'react';
import { KIND_LABELS, maxPoints, type Question } from '../lib/nmt';

type Props = {
  items: Question[];
  flash: boolean;
  onRemove: (id: number) => void;
  onClear: () => void;
  onStart: (title: string) => void;
};

export default function SessionBasket({ items, flash, onRemove, onClear, onStart }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const points = items.reduce((s, q) => s + maxPoints(q), 0);
  const glow = flash ? 'ring-4 ring-amber-400/70' : '';

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed right-4 top-24 z-30 px-4 py-3 rounded-2xl border-2 border-amber-500 bg-slate-950 shadow-lg text-xs font-black text-slate-200 transition cursor-pointer ${glow}`}
      >
        🧺 Збірка: {items.length} ▸
      </button>
    );
  }

  return (
    <aside
      className={`fixed right-4 top-24 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-amber-500 bg-slate-950 shadow-2xl overflow-hidden transition ${glow}`}
    >
      <div className="px-4 py-3 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">🧺 Збірка для сесії</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">
            {items.length} пит. · {points} б
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-slate-400 hover:text-white text-sm font-bold px-2 cursor-pointer"
          title="Згорнути"
        >
          ▾
        </button>
      </div>

      <div className="max-h-52 overflow-y-auto divide-y divide-slate-800">
        {items.map((q, i) => (
          <div key={q.id} className="flex items-start gap-2 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-indigo-400">
                №{i + 1} · {KIND_LABELS[q.kind]}
              </p>
              <p className="text-xs text-slate-200 truncate">{q.title}</p>
            </div>
            <button
              onClick={() => onRemove(q.id)}
              className="text-slate-500 hover:text-rose-400 text-xs font-bold cursor-pointer"
              title="Прибрати зі збірки"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-2 border-t border-slate-800">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Назва сесії (необов’язково)"
          className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={() => onStart(title)}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
        >
          ▶ Розпочати сесію
        </button>
        <button
          onClick={onClear}
          className="w-full text-[11px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
        >
          Очистити збірку
        </button>
      </div>
    </aside>
  );
}