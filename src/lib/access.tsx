// src/lib/access.tsx

export const ACCOUNTS_KEY = 'nmt_accounts_v1';
export const SETTINGS_KEY = 'nmt_settings_v1';
export const CURRENT_TEACHER_ID = 'teacher-001';
export const SUPPORT_EMAIL = 'ivansterenchuk@gmail.com';
export const ADMIN_CONFIGURED = true;

// ---------- Типи ----------
export type TeacherFeatures = {
  pdf: boolean;
  classes: boolean;
  journal: boolean;
  mistakes: boolean;
};

export type TeacherAccount = {
  id: string;
  name: string;
  email: string;
  plan: 'trial' | 'pro' | 'free';
  expiresAt: string; // YYYY-MM-DD
  features?: TeacherFeatures; // Нові точкові доступи
};

export type PlatformSettings = {
  proPrice: number;
  trialDays: number;
};

export type Entitlement = {
  title: string;
  message: string;
  isPremium: boolean;
  features: TeacherFeatures; // Тепер права доступу передаються сюди
};

// ---------- Сховище (localStorage) ----------
export const loadAccounts = (): TeacherAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Міграція старих акаунтів (якщо у них немає features)
      return parsed.map((acc: any) => {
        if (!acc.features) {
          const isPro = acc.plan === 'pro' || acc.plan === 'trial';
          return {
            ...acc,
            features: { pdf: isPro, classes: isPro, journal: isPro, mistakes: isPro }
          };
        }
        return acc;
      });
    }
  } catch (e) {
    console.error('Error loading accounts', e);
  }
  
  // Дефолтний акаунт для тестів
  return [{
    id: CURRENT_TEACHER_ID,
    name: 'Іван Стеренчук',
    email: 'ivansterenchuk@gmail.com',
    plan: 'pro',
    expiresAt: '2026-12-31',
    features: { pdf: true, classes: true, journal: true, mistakes: true }
  }];
};

export const saveAccounts = (accounts: TeacherAccount[]) => {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving accounts', e);
  }
};

export const loadSettings = (): PlatformSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return { proPrice: 299, trialDays: 7 };
};

export const saveSettings = (settings: PlatformSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

// ---------- Адмін-сесія ----------
export const isAdminSession = (): boolean => {
  return sessionStorage.getItem('nmt_admin_session') === 'true';
};

export const setAdminSession = (val: boolean) => {
  if (val) {
    sessionStorage.setItem('nmt_admin_session', 'true');
  } else {
    sessionStorage.removeItem('nmt_admin_session');
  }
};

export const adminLogin = (user: string, pass: string): boolean => {
  if (user === 'admin' && pass === 'admin') {
    setAdminSession(true);
    return true;
  }
  return false;
};

// ---------- Права доступу ----------
export const getEntitlement = (account: TeacherAccount | undefined, settings: PlatformSettings): Entitlement => {
  // Базові (вимкнені) доступи за замовчуванням
  const noFeatures: TeacherFeatures = { pdf: false, classes: false, journal: false, mistakes: false };

  if (!account) {
    return { 
      title: 'Гість', 
      message: 'Увійдіть в систему', 
      isPremium: false,
      features: noFeatures
    };
  }
  
  const isExpired = new Date(account.expiresAt) < new Date();
  const isPremium = (account.plan === 'pro' || account.plan === 'trial') && !isExpired;

  // Якщо акаунт преміум, але фічі чомусь не задані — даємо всі
  let activeFeatures = account.features;
  if (isPremium && !activeFeatures) {
    activeFeatures = { pdf: true, classes: true, journal: true, mistakes: true };
  } 
  // Якщо підписка закінчилась або це free, але фічі залишились — забираємо їх
  else if (!isPremium) {
    activeFeatures = noFeatures;
  }

  return {
    title: isPremium ? 'PRO Тариф' : 'Базовий тариф',
    message: isPremium 
      ? 'Доступні всі обрані функції.' 
      : 'Обмежений доступ. Зверніться до адміністратора для активації функцій.',
    isPremium,
    features: activeFeatures || noFeatures
  };
};

// ---------- Утиліти для дат ----------
export const addMonths = (date: Date | string, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const fmtLong = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('uk-UA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const toYmd = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};