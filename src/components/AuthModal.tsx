import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, User } from 'lucide-react';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Нові стани для імені та прізвища
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError('База даних не підключена');
      return;
    }

    // Перевірка імені та прізвища при реєстрації
    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      setError("Будь ласка, введіть ім'я та прізвище");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (password.length < 6) {
      setError('Пароль має бути не менше 6 символів');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Передаємо ім'я та прізвище в метадані Supabase
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
            }
          }
        });
        if (error) throw error;
        
        alert('Реєстрація успішна! Тепер ви можете увійти.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
      onSuccess();
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError('Невірний email або пароль');
      } else if (err.message === 'User already registered') {
        setError('Користувач з таким email вже існує');
      } else if (err.message === 'Failed to fetch') {
        setError("Помилка з'єднання з сервером. Перевірте налаштування Supabase (URL та Anon Key) або інтернет.");
      } else {
        setError(err.message || 'Сталася помилка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900">
            {isLogin ? 'Вхід для вчителя' : 'Реєстрація вчителя'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin ? 'Введіть дані вашого акаунту' : 'Створіть новий акаунт для роботи'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ПОЛЯ ІМЕНІ ТА ПРІЗВИЩА (тільки для реєстрації) */}
          {!isLogin && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Ім'я</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Іван"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Прізвище</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Стеренчук"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Підтвердіть пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-sm transition flex justify-center items-center gap-2 mt-6 cursor-pointer"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-slate-500 hover:text-teal-600 font-medium transition cursor-pointer"
          >
            {isLogin ? 'Немає акаунту? Зареєструватися' : 'Вже є акаунт? Увійти'}
          </button>
        </div>

      </div>
    </div>
  );
}