import React, { useState } from 'react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    title: string, 
    duration: number | undefined, 
    startTime: string | undefined, 
    endTime: string | undefined, 
    mode: 'active' | 'scheduled' | 'managed',
    timeLimitType: 'test' | 'question',
    gradingSystem: '12' | '100' | 'preschool' | 'nus',
    maxScore: number,
    minScore: number,
    showResults: boolean,
    showErrors: boolean,
    showCorrectAnswers: boolean
  ) => void;
}

export default function CreateSessionModal({ isOpen, onClose, onCreate }: CreateSessionModalProps) {
  const [title, setTitle] = useState('Новий тест з історії');
  const [duration, setDuration] = useState('45');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [mode, setMode] = useState<'active' | 'scheduled' | 'managed'>('active');
  const [timeLimitType, setTimeLimitType] = useState<'test' | 'question'>('test');
  const [gradingSystem, setGradingSystem] = useState<'12' | '100' | 'preschool' | 'nus'>('12');
  const [maxScore, setMaxScore] = useState(12);
  const [minScore, setMinScore] = useState(3);
  
  const [showResults, setShowResults] = useState(true);
  const [showErrors, setShowErrors] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const [theme, setTheme] = useState('standard');
  const [accessCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  
  // Твої посилання
  const joinLink = `https://nmt-hub.com/test/start/${accessCode.toLowerCase()}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinLink)}`;

  const modeDescriptions = {
    active: "ⓘ Тест доступний одразу після створення. Жодних обмежень за часом.",
    scheduled: "ⓘ Почати тестування можна лише в заданий час. Цей режим ідеально підходить для перевірки знань учнів вдома.",
    managed: "ⓘ Почати проходження можна лише за вказівкою вчителя. Вчитель сам визначає момент старту."
  };

  if (!isOpen) return null;

  const handleSave = () => {
    onCreate(
      title, 
      duration ? Number(duration) : undefined, 
      mode === 'scheduled' ? startTime : undefined, 
      mode === 'scheduled' ? endTime : undefined, 
      mode,
      timeLimitType,
      gradingSystem,
      maxScore,
      minScore,
      showResults,
      showErrors,
      showCorrectAnswers
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 text-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl my-8 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* ЛІВА ЧАСТИНА (Налаштування) */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto max-h-[85vh] pb-24">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Налаштування та редагування тестування</h2>
            <p className="text-sm text-slate-500 mt-1">Налаштуйте параметри для ваших учнів</p>
          </div>

          {/* Назва */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Назва тестування:</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-white border border-slate-300 text-slate-900 rounded-xl text-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition" />
            <p className="text-xs text-slate-400">ⓘ Як приклад, Ви можете вказати назву класу</p>
          </div>

          {/* Режими */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Режими тестування:</label>
            <div className="flex bg-slate-200/50 rounded-xl p-1 gap-1">
              <button onClick={() => setMode('active')} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${mode === 'active' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:bg-white/50'}`}>
                <span className="text-red-500">▶</span> <span>Активний</span>
              </button>
              <button onClick={() => setMode('scheduled')} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${mode === 'scheduled' ? 'bg-teal-500 shadow text-white' : 'text-slate-500 hover:bg-white/50'}`}>
                <span>⏰</span> <span>Запланований</span>
              </button>
              <button onClick={() => setMode('managed')} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${mode === 'managed' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:bg-white/50'}`}>
                <span className="text-blue-400">🦅</span> <span>Керований</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 h-8">{modeDescriptions[mode]}</p>
          </div>

          {/* Блок Приєднати учнів */}
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Приєднати учнів:</h3>
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Перейдіть за посиланням:</p>
                  <div className="flex items-center bg-white border border-teal-200 rounded-lg overflow-hidden">
                    <input type="text" readOnly value={joinLink} className="flex-1 p-2 bg-transparent text-teal-600 font-medium outline-none" />
                    <button onClick={() => navigator.clipboard.writeText(joinLink)} className="p-2 text-teal-400 hover:text-teal-600">📋</button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Код доступу:</p>
                    <div className="flex items-center bg-white border border-teal-200 rounded-lg overflow-hidden w-40">
                      <input type="text" readOnly value={accessCode} className="flex-1 p-2 bg-transparent text-teal-600 font-bold outline-none" />
                      <button onClick={() => navigator.clipboard.writeText(accessCode)} className="p-2 text-teal-400 hover:text-teal-600">📋</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-slate-600 mb-2">Доступ по QR-коду:</p>
                <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 border-4 border-white shadow-sm rounded-lg" />
              </div>
            </div>
          </div>

          {/* Час */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Обмеження</h3>
            {mode === 'scheduled' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Введіть дату початку:</label>
                  <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Введіть дату закінчення:</label>
                  <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Обмеження часу:</label>
                <select value={timeLimitType} onChange={(e) => setTimeLimitType(e.target.value as any)} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none appearance-none">
                  <option value="test">Весь тест</option>
                  <option value="question">Кожне запитання</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Введіть час тестування (хв.):</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={showResults} onChange={(e) => setShowResults(e.target.checked)} className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
                <span className="text-slate-700">Показати результати.</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={showErrors} onChange={(e) => setShowErrors(e.target.checked)} className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
                <span className="text-slate-700">Показати роботу над помилками.</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={showCorrectAnswers} onChange={(e) => setShowCorrectAnswers(e.target.checked)} className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
                <span className="text-slate-700">Показувати правильні відповіді в роботі над помилками.</span>
              </label>
            </div>
          </div>

          {/* Оцінювання */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-900">Оцінювання</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-bold text-slate-700">Система оцінювання:</label>
                <select value={gradingSystem} onChange={(e) => setGradingSystem(e.target.value as any)} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none appearance-none">
                  <option value="12">Для учнів (12 балів)</option>
                  <option value="preschool">Для дошкільнят/Початкова освіта</option>
                  <option value="100">Для студентів (100 балів)</option>
                  <option value="nus">Рівнева оцінка (НУШ)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Макс. бал за тест:</label>
                <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Мін. бал за тест:</label>
                <input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none" />
              </div>
            </div>
          </div>

        </div>

        {/* ПРАВА ЧАСТИНА (Інформація) */}
        <div className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-teal-600">Інформація</h3>
            <div className="space-y-3 text-sm">
              <p><span className="font-bold text-slate-900">Назва:</span> {title}</p>
              <p><span className="font-bold text-slate-900">Створено:</span> {new Date().toLocaleString('uk-UA')}</p>
              <p><span className="font-bold text-slate-900">Статус:</span> <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">● активний</span></p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-lg font-bold text-teal-600 mb-3">Режим доступу</h4>
              <p className="flex items-center space-x-2 font-bold text-slate-700"><span className="text-red-500">▶</span> <span>{mode === 'active' ? 'Активний' : mode === 'scheduled' ? 'Запланований' : 'Керований'}</span></p>
            </div>
          </div>
        </div>

        {/* КНОПКИ ВНИЗУ */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-between items-center rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button onClick={handleSave} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-lg cursor-pointer">
            Зберегти та створити
          </button>
          <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition shadow-sm cursor-pointer">
            Скасувати
          </button>
        </div>

      </div>
    </div>
  );
}