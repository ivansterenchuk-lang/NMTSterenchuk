import React from 'react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-6 text-center">
        <div className="w-16 h-16 bg-rose-950/50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl border border-rose-800/50">
          ⚠️
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-slate-400 mt-2">{message}</p>
        </div>
        <div className="flex space-x-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition">
            Скасувати
          </button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-rose-600/20">
            Підтвердити
          </button>
        </div>
      </div>
    </div>
  );
}