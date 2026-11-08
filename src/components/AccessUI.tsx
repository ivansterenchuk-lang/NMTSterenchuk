import React, { createContext, useContext, ReactNode } from 'react';
import type { Entitlement } from '../lib/access';

// Типізація для контексту доступу
type AccessContextType = {
  ent: Entitlement;
  teacherName: string;
  guard: (action: () => void) => void;
  printTest: (title: string, questions: any[]) => void;
};

// Створюємо сам контекст
const AccessContext = createContext<AccessContextType | null>(null);

// ================= ПРОВАЙДЕР =================
export function AccessProvider({ ent, teacherName, children }: { ent: Entitlement, teacherName: string, children: ReactNode }) {
  
  // Функція-охоронець: перевіряє, чи можна виконати дію (наприклад, згенерувати PDF)
  const guard = (action: () => void) => {
    // Перевіряємо, чи увімкнена функція PDF (для PRO тарифу)
    if (ent.features.pdf || ent.isPremium) {
      action();
    } else {
      alert('Ця функція доступна лише на тарифі PRO. Зверніться до адміністратора для активації.');
    }
  };

  // Функція для друку тесту
  const printTest = (title: string, questions: any[]) => {
    guard(() => {
      // Тут викликається вікно друку браузера. 
      // Якщо у тебе є специфічна функція з lib/pdf.ts, ти можеш замінити цей рядок.
      window.print(); 
    });
  };

  return (
    <AccessContext.Provider value={{ ent, teacherName, guard, printTest }}>
      {children}
    </AccessContext.Provider>
  );
}

// ================= ХУК =================
// Цей хук викликає AssignmentDetail.tsx і багато інших компонентів
export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};

// ================= КОМПОНЕНТИ UI =================
export function AccessBadge() {
  const { ent } = useAccess();
  return (
    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-default ${
      ent.isPremium 
        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' 
        : 'bg-slate-50 text-slate-500 border-slate-200'
    }`}>
      {ent.isPremium ? '💎 ' : '🆓 '}
      {ent.title}
    </span>
  );
}

export function PrintButton({ title, questions, className, children }: { title: string, questions: any[], className?: string, children?: ReactNode }) {
  const { printTest, ent } = useAccess();
  
  const defaultClass = "px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5";
  
  return (
    <button 
      onClick={() => printTest(title, questions)} 
      className={className || defaultClass}
    >
      {children || '📄 PDF для друку'}
      {!ent.isPremium && ' 🔒'}
    </button>
  );
}