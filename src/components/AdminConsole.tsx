import React, { useState, useMemo } from 'react';
import type { TeacherAccount, PlatformSettings } from '../lib/access';

// ================= ЛОГІН =================
export function AdminLogin({ onSuccess, onExit }: { onSuccess: () => void; onExit: () => void }) {
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === 'admin' && pass === 'admin') {
      onSuccess();
    } else {
      alert('Невірний логін або пароль! (Використовуйте admin / admin)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-black text-white text-center">Вхід в адмінку</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Логін (admin)"
            value={login}
            onChange={e => setLogin(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none"
          />
          <input
            type="password"
            placeholder="Пароль (admin)"
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none"
          />
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition">
            Увійти
          </button>
        </form>
        <button onClick={onExit} className="w-full text-xs text-slate-400 hover:text-white transition">
          ← Повернутися на сайт
        </button>
      </div>
    </div>
  );
}

// ================= ГОЛОВНА КОНСОЛЬ =================
export default function AdminConsole({
  accounts,
  setAccounts,
  settings,
  setSettings,
  onLogout,
  onExit
}: {
  accounts: TeacherAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<TeacherAccount[]>>;
  settings: PlatformSettings;
  setSettings: React.Dispatch<React.SetStateAction<PlatformSettings>>;
  library?: any[];
  onDeleteLibrary?: (id: number) => void;
  onLogout: () => void;
  onExit: () => void;
}) {
  
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'pro' | 'free'>('all');

  // --- РОЗРАХУНОК СТАТИСТИКИ ДЛЯ ДАШБОРДУ ---
  const stats = useMemo(() => {
    const total = accounts.length;
    const pro = accounts.filter(a => a.plan === 'pro').length;
    const free = total - pro;
    return { total, pro, free };
  }, [accounts]);

  // --- ФІЛЬТРАЦІЯ ТА ПОШУК ---
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = 
        (acc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (acc.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterPlan === 'all' ? true : acc.plan === filterPlan;
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchQuery, filterPlan]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getNextYearDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const togglePro = (teacherId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setAccounts(prev => {
      const newAccounts = prev.map(acc => {
        if (acc.id === teacherId) {
          const isPro = acc.plan === 'pro';
          // Вказуємо тип TeacherAccount, щоб TypeScript не сварився на plan: 'free' | 'pro'
          const updatedAcc: TeacherAccount = {
            ...acc,
            plan: isPro ? 'free' : 'pro',
            expiresAt: isPro ? '2024-01-01' : getNextYearDate(),
            features: isPro 
              ? { pdf: false, classes: false, journal: false, mistakes: false }
              : { pdf: true, classes: true, journal: true, mistakes: true }
          };
          return updatedAcc;
        }
        return acc;
      });

      // Зберігаємо оновлений список у пам'ять браузера
      localStorage.setItem('nmt_accounts_v1', JSON.stringify(newAccounts));
      
      return newAccounts;
    });

    if (selectedTeacher && selectedTeacher.id === teacherId) {
      const isPro = selectedTeacher.plan === 'pro';
      const updatedSelected: TeacherAccount = {
        ...selectedTeacher,
        plan: isPro ? 'free' : 'pro',
        expiresAt: isPro ? '2024-01-01' : getNextYearDate(),
        features: isPro 
          ? { pdf: false, classes: false, journal: false, mistakes: false }
          : { pdf: true, classes: true, journal: true, mistakes: true }
      };
      setSelectedTeacher(updatedSelected);
    }

    // Перезавантажуємо сторінку, щоб оновити статус на сайті
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Шапка */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-white">Суперадмін Панель</h1>
            <p className="text-sm text-slate-400">Управління вчителями, підписками та платформою</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={onExit} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition">← На сайт</button>
            <button onClick={onLogout} className="px-4 py-2 bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900 rounded-lg text-sm font-bold transition">Вийти</button>
          </div>
        </div>

        {/* БЛОК 1: ДАШБОРД (КАРТКИ СТАТИСТИКИ) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Всього вчителів</p>
              <h3 className="text-3xl font-black text-white mt-1">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-950 text-indigo-400 rounded-xl flex items-center justify-center text-2xl">👥</div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">PRO Підписки</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">{stats.pro}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-xl flex items-center justify-center text-2xl">💎</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Безкоштовні</p>
              <h3 className="text-3xl font-black text-slate-200 mt-1">{stats.free}</h3>
            </div>
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center text-2xl">🆓</div>
          </div>
        </div>

        {/* Налаштування платформи */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Глобальні налаштування</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.proPrice > 0} 
                onChange={(e) => setSettings({...settings, proPrice: e.target.checked ? 299 : 0})}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
              <span className="text-sm font-medium">Увімкнути платний режим (PRO)</span>
            </label>
            {settings.proPrice > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">Ціна PRO:</span>
                <input 
                  type="number" 
                  value={settings.proPrice} 
                  onChange={(e) => setSettings({...settings, proPrice: Number(e.target.value)})}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm w-20 outline-none focus:border-indigo-500"
                />
                <span className="text-sm text-slate-400">грн/міс</span>
              </div>
            )}
          </div>
        </div>

        {/* БЛОК 2: ТАБЛИЦЯ З ПОШУКОМ ТА ФІЛЬТРАМИ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          
          {/* Панель пошуку та фільтрів */}
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Пошук за ім'ям або email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex space-x-2 w-full md:w-auto">
              <button 
                onClick={() => setFilterPlan('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterPlan === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
              >
                Усі
              </button>
              <button 
                onClick={() => setFilterPlan('pro')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterPlan === 'pro' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
              >
                PRO
              </button>
              <button 
                onClick={() => setFilterPlan('free')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterPlan === 'free' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
              >
                Безкоштовні
              </button>
            </div>
          </div>

          {/* Сама таблиця */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Вчитель</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Статус</th>
                <th className="p-4 text-center">Дійсний до</th>
                <th className="p-4 text-center">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                    За вашим запитом нікого не знайдено
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => (
                  <tr 
                    key={acc.id} 
                    onClick={() => setSelectedTeacher(acc)}
                    className="hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="p-4 font-bold text-slate-200">{acc.name}</td>
                    <td className="p-4 text-slate-400">{acc.email}</td>
                    <td className="p-4 text-center">
                      {acc.plan === 'pro' ? (
                        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold">PRO</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-bold">FREE</span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-slate-300">
                      {acc.plan === 'pro' ? formatDate(acc.expiresAt) : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={(e) => togglePro(acc.id, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          acc.plan === 'pro' 
                            ? 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        }`}
                      >
                        {acc.plan === 'pro' ? 'Відключити' : 'Активувати PRO'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* МОДАЛЬНЕ ВІКНО ПРОФІЛЮ ВЧИТЕЛЯ */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTeacher(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {selectedTeacher.name ? selectedTeacher.name.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTeacher.name}</h3>
                  <p className="text-sm text-slate-400">{selectedTeacher.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTeacher(null)} className="text-slate-400 hover:text-rose-400 transition text-xl font-bold">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Поточний тариф:</span>
                {selectedTeacher.plan === 'pro' ? (
                  <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold">PRO Тариф</span>
                ) : (
                  <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">Безкоштовний</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Дійсний до:</span>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {selectedTeacher.plan === 'pro' ? formatDate(selectedTeacher.expiresAt) : '—'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => togglePro(selectedTeacher.id)}
              className={`w-full py-3 rounded-xl font-bold transition ${
                selectedTeacher.plan === 'pro' 
                  ? 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              {selectedTeacher.plan === 'pro' ? 'Забрати PRO-доступ' : 'Надати PRO-доступ на 1 рік'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}