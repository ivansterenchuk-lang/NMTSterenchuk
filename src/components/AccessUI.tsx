import { createContext, useContext, useState, type ReactNode } from 'react';
import { SUPPORT_EMAIL, type Entitlement } from '../lib/access';
import type { Question } from '../lib/nmt';
import PrintModal from './PrintModal';
import { Lock, Star, CheckCircle2 } from 'lucide-react';

type Ctx = {
  ent: Entitlement;
  guard: (fn: () => void) => void;
  printTest: (title: string, questions: Question[]) => void;
  showInfo: () => void;
};

const OPEN: Entitlement = { 
  title: 'PRO Тариф', 
  message: 'Доступні всі функції.', 
  isPremium: true, 
  features: { pdf: true, classes: true, journal: true, mistakes: true } 
};

const AccessCtx = createContext<Ctx>({
  ent: OPEN,
  guard: f => f(),
  printTest: () => {},
  showInfo: () => {}
});

export const useAccess = (): Ctx => useContext(AccessCtx);

function AccessModal({ ent, onClose }: { ent: Entitlement; onClose: () => void }) {
  const ok = ent.features.pdf;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-6 py-8 text-center space-y-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border ${ok ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
            {ok ? <Star className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{ent.title}</h3>
          <p className="text-sm text-slate-600">{ent.message}</p>
        </div>

        <div className="px-6 pb-6 space-y-2 text-sm text-slate-700 bg-slate-50 py-4 border-y border-slate-200">
          <p className="font-bold text-slate-900 mb-3">Що входить у PRO-доступ:</p>
          <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Завантаження PDF результатів</p>
          <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Друк тестів та контрольних (до 4 варіантів)</p>
          <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Створення класів та призначення ДЗ</p>
          <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ведення журналу та робота над помилками</p>
        </div>

        {!ok && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
            <p className="text-xs text-amber-800 text-center font-medium leading-relaxed">
              Щоб активувати функцію, зверніться до адміністратора платформи
              {SUPPORT_EMAIL ? (
                <>: <br/><a className="font-bold text-teal-600 hover:underline text-sm" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></>
              ) : '.'}
            </p>
          </div>
        )}

        <div className="px-6 py-4 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition cursor-pointer"
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccessProvider({ ent, teacherName, children }: { ent: Entitlement; teacherName?: string; children: ReactNode }) {
  const [modal, setModal] = useState(false);
  const [print, setPrint] = useState<{ title: string; questions: Question[] } | null>(null);

  const guard = (fn: () => void) => {
    if (ent.features.pdf) fn();
    else setModal(true);
  };

  const printTest = (title: string, questions: Question[]) =>
    guard(() => {
      if (questions.length === 0) {
        alert('У цьому тесті ще немає питань.');
        return;
      }
      setPrint({ title, questions });
    });

  return (
    <AccessCtx.Provider value={{ ent, guard, printTest, showInfo: () => setModal(true) }}>
      {children}
      {modal && <AccessModal ent={ent} onClose={() => setModal(false)} />}
      {print && (
        <PrintModal title={print.title} questions={print.questions} teacher={teacherName} onClose={() => setPrint(null)} />
      )}
    </AccessCtx.Provider>
  );
}

// Мітка статусу в шапці
export function AccessBadge() {
  const { ent, showInfo } = useAccess();
  
  const label = ent.features.pdf ? '⭐ PRO Доступ' : '🔒 Обмежений доступ';
  const tone = ent.features.pdf
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <button
      onClick={showInfo}
      title="Мій доступ до функцій"
      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer shadow-sm ${tone}`}
    >
      {label}
    </button>
  );
}

// Кнопка, що виконує дію лише за наявності доступу
export function GuardButton({
  onAction,
  className,
  title,
  children
}: {
  onAction: () => void;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const { guard, ent } = useAccess();
  return (
    <button
      title={title}
      className={className}
      onClick={e => {
        e.stopPropagation();
        guard(onAction);
      }}
    >
      {children}
      {!ent.features.pdf && ' 🔒'}
    </button>
  );
}

// Кнопка «PDF для друку» (відкриває вікно налаштувань)
export function PrintButton({
  title,
  questions,
  className,
  children
}: {
  title: string;
  questions: Question[];
  className?: string;
  children: ReactNode;
}) {
  const { printTest, ent } = useAccess();
  return (
    <button
      title="Завантажити для очного використання"
      className={className}
      onClick={e => {
        e.stopPropagation();
        printTest(title, questions);
      }}
    >
      {children}
      {!ent.features.pdf && ' 🔒'}
    </button>
  );
}