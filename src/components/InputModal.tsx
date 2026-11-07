import React, { useState, useEffect } from 'react';

export default function InputModal({
  isOpen,
  title,
  placeholder,
  initialValue = '',
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  title: string;
  placeholder: string;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder={placeholder}
            className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none transition"
            autoFocus
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition cursor-pointer">
            Скасувати
          </button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer">
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}