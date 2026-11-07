import { useState } from 'react';
import { GraduationCap, BookOpen, Lock, ArrowLeft } from 'lucide-react';

type Props = {
  onSelectRole: (role: 'teacher' | 'student') => void;
};

export default function LandingPage({ onSelectRole }: Props) {
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Пароль для входу вчителя
    if (password === 'admin') {
      onSelectRole('teacher');
    } else {
      setError('Невірний пароль!');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Декоративні фони */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl"></div>

      <div className="z-10 max-w-4xl w-full space-y-12 text-center">
        
        {/* Логотип */}
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-teal-500/20">
            ⚡
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">NMT-HUB</h1>
            <p className="text-sm md:text-base text-teal-600 font-bold uppercase tracking-widest mt-2">Екзаменаційна система</p>
          </div>
        </div>

        {/* Вибір ролі або Форма входу */}
        {!showTeacherLogin ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500 delay-150">
            
            {/* Картка Вчителя */}
            <button
              onClick={() => setShowTeacherLogin(true)}
              className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-4 cursor-pointer"
            >
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Я Вчитель</h2>
                <p className="text-sm text-slate-500 mt-2">Створюйте класи, призначайте тести та керуйте навчальним процесом.</p>
              </div>
              <div className="pt-2 w-full">
                <span className="block w-full py-3 bg-slate-900 group-hover:bg-teal-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Вхід для вчителя
                </span>
              </div>
            </button>

            {/* Картка Учня */}
            <button
              onClick={() => onSelectRole('student')}
              className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center text-center space-y-4 cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Я Учень</h2>
                <p className="text-sm text-slate-500 mt-2">Приєднуйтесь до класів за кодом, виконуйте домашні завдання та переглядайте оцінки.</p>
              </div>
              <div className="pt-2 w-full">
                <span className="block w-full py-3 bg-slate-900 group-hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
                  Перейти до навчання
                </span>
              </div>
            </button>

          </div>
        ) : (
          /* Форма входу для вчителя */
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => { setShowTeacherLogin(false); setError(''); setPassword(''); }}
              className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1 mb-6 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Вхід для вчителя</h2>
            <p className="text-sm text-slate-500 mb-6">Введіть пароль для доступу до кабінету</p>

            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введіть пароль (admin)"
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-center font-bold text-lg text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                  autoFocus
                />
                {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Увійти
              </button>
            </form>
          </div>
        )}

        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} NMT-HUB. Всі права захищені.
        </p>
      </div>
    </div>
  );
}