import { useState } from 'react';
import { GraduationCap, BookOpen } from 'lucide-react';
import AuthModal from './AuthModal';

type Props = {
  onSelectRole: (role: 'teacher' | 'student') => void;
};

export default function LandingPage({ onSelectRole }: Props) {
  const [showAuthModal, setShowAuthModal] = useState(false);

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

        {/* Вибір ролі */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500 delay-150">
          
          {/* Картка Вчителя */}
          <button
            onClick={() => setShowAuthModal(true)}
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
              <span className="block w-full py-3 bg-slate-900 group-hover:bg-teal-600 text-white font-bold rounded-xl transition-colors">
                Вхід / Реєстрація
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

        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} NMT-HUB. Всі права захищені.
        </p>
      </div>

      {/* Модальне вікно входу/реєстрації */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            setShowAuthModal(false);
            onSelectRole('teacher');
          }} 
        />
      )}
    </div>
  );
}