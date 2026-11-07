import React, { useState, useEffect } from 'react';

export default function MeetingLinkModal({ 
  session, 
  onClose, 
  onSave 
}: { 
  session: any | null; 
  onClose: () => void; 
  onSave: (id: string, url: string) => void; 
}) {
  const [url, setUrl] = useState('');

  // Коли відкривається вікно, підставляємо існуюче посилання, якщо воно є
  useEffect(() => {
    if (session) {
      setUrl(session.meetingUrl || '');
    }
  }, [session]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">Відеозустріч</h3>
          <p className="text-xs text-slate-400 mt-1">Сесія: {session.title}</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Посилання на Zoom, Google Meet або Teams</label>
          <input 
            type="url" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="https://meet.google.com/abc-defg-hij" 
            className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition" 
            autoFocus 
          />
        </div>
        
        <div className="flex space-x-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition">
            Скасувати
          </button>
          <button 
            onClick={() => onSave(session.id, url)} 
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}