import React, { useState, useEffect } from 'react';

export default function EditSessionModal({ 
  session, 
  onClose, 
  onSave 
}: { 
  session: any | null; 
  onClose: () => void; 
  onSave: (id: string, data: any) => void; 
}) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Коли відкривається вікно, заповнюємо поля даними сесії
  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setDuration(session.durationMinutes?.toString() || '');
      setStartTime(session.startTime || '');
      setEndTime(session.endTime || '');
    }
  }, [session]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Налаштування сесії</h3>
          <p className="text-xs text-slate-400 mt-1">Код: {session.id}</p>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Назва сесії</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Тривалість (хвилин)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Наприклад: 45" className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Час початку</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Час завершення</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition" />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition">Скасувати</button>
          <button 
            onClick={() => {
              onSave(session.id, {
                title: title.trim() || 'Без назви',
                durationMinutes: Number(duration) || undefined,
                startTime: startTime || undefined,
                endTime: endTime || undefined
              });
            }} 
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}