export const ME_ID = 'student-me';

export type Submission = {
  studentId: string;
  name: string;
  score: number;
  max: number;
  items: any[];
  answers: any;
  submittedAt: string;
  late?: boolean;
};

export type Assignment = {
  id: string;
  title: string;
  questions: any[];
  instructions?: string;
  due?: string;
  createdAt?: string;
  submissions?: Submission[];
  durationMinutes?: number;
  startTime?: string;
};

export type ClassItem = {
  id: string;
  name: string;
  section?: string;
  code: string;
  teacherName?: string;
  acceptJoins?: boolean;
  students: { id: string; name: string }[];
  assignments: Assignment[];
  posts?: any[];
};

export type LibraryGroup = {
  id: number;
  title: string;
  questions: any[];
};

export type HwStatus = 'todo' | 'overdue' | 'done';

// ================= УТИЛІТИ =================

export const avgTwelve = (subs: Submission[]): number | null => {
  if (!subs || subs.length === 0) return null;
  const total = subs.reduce((acc, s) => acc + (s.score / s.max) * 12, 0);
  return total / subs.length;
};

export const fmtDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const generateCode = (prefix: string[] | string = 'CLS'): string => {
  if (Array.isArray(prefix)) {
    let code = '';
    do {
      code = 'CLS-' + Math.floor(1000 + Math.random() * 9000);
    } while (prefix.includes(code));
    return code;
  }
  return prefix + '-' + Math.floor(1000 + Math.random() * 9000);
};

export const joinLink = (code: string): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?join=${encodeURIComponent(code)}`;
};

export const allCodes = (classes: ClassItem[]): string[] => {
  const codes: string[] = [];
  (classes || []).forEach(c => {
    (c.assignments || []).forEach(a => {
      if (a.id) codes.push(a.id);
    });
  });
  return codes;
};

export const subOf = (aOrSubs: any, studentId: string): Submission | undefined => {
  const subs = Array.isArray(aOrSubs) ? aOrSubs : (aOrSubs?.submissions || []);
  if (!subs || !Array.isArray(subs)) return undefined;
  return subs.find((s: any) => s.studentId === studentId);
};

export const pct = (scoreOrSub: any, max?: number): number => {
  if (typeof scoreOrSub === 'object' && scoreOrSub !== null) {
    if (!scoreOrSub.max || scoreOrSub.max === 0) return 0;
    return Math.round((scoreOrSub.score / scoreOrSub.max) * 100);
  }
  if (!max || max === 0) return 0;
  return Math.round((scoreOrSub / max) * 100);
};

export const toTwelve = (scoreOrPercentOrSub: any, max?: number): number => {
  if (typeof scoreOrPercentOrSub === 'object' && scoreOrPercentOrSub !== null) {
    if (!scoreOrPercentOrSub.max || scoreOrPercentOrSub.max === 0) return 0;
    return Math.round((scoreOrPercentOrSub.score / scoreOrPercentOrSub.max) * 12);
  }
  if (max !== undefined) {
    if (!max || max === 0) return 0;
    return Math.round((scoreOrPercentOrSub / max) * 12);
  }
  return Math.round((scoreOrPercentOrSub / 100) * 12);
};

export const extractCode = (input: string): string => {
  if (!input) return '';
  if (input.includes('join=')) {
    const parts = input.split('join=');
    return parts[1].split('&')[0].toUpperCase().trim();
  }
  return input.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().trim();
};

// ================= ЛОГІКА КЛАСІВ ТА СЕСІЙ =================

export const loadClasses = (): ClassItem[] => {
  try {
    const raw = localStorage.getItem('nmt-classes-v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveClasses = (classes: ClassItem[]) => {
  try {
    localStorage.setItem('nmt-classes-v1', JSON.stringify(classes));
  } catch (e) {
    console.error('Error saving classes', e);
  }
};

export const normalizeCode = (code: string) => (code || '').trim().toUpperCase();

export const findSession = (classes: ClassItem[], code: string) => {
  for (const cls of (classes || [])) {
    for (const a of (cls.assignments || [])) {
      if (a.id.replace(/[^A-Z0-9]/g, '') === code.replace(/[^A-Z0-9]/g, '')) {
        return { cls, a };
      }
    }
  }
  return null;
};

export const readJoinParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('join');
};

export const splitName = (fullName: string) => {
  const parts = (fullName || '').trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
};

export const addAssignment = (classes: ClassItem[], classId: string, assignmentData: any): ClassItem[] => {
  return (classes || []).map(c => {
    if (c.id !== classId) return c;
    const newAssignment: Assignment = {
      id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      title: assignmentData.title,
      questions: assignmentData.questions || [],
      instructions: assignmentData.instructions,
      due: assignmentData.due,
      createdAt: new Date().toISOString(),
      submissions: []
    };
    return {
      ...c,
      assignments: [...(c.assignments || []), newAssignment]
    };
  });
};

export const hwStatus = (a: Assignment, studentId?: string): HwStatus => {
  if (studentId) {
    const sub = subOf(a, studentId);
    if (sub) return 'done';
    if (a.due && new Date(a.due) < new Date()) return 'overdue';
    return 'todo';
  }
  if (a.due && new Date(a.due) < new Date()) return 'overdue';
  return 'todo';
};

export const questionStats = (submissions: Submission[], questionIndex: number) => {
  let correct = 0;
  let total = 0;
  (submissions || []).forEach(sub => {
    if (sub.items && sub.items[questionIndex] !== undefined) {
      total++;
      if (sub.items[questionIndex] === 1) correct++;
    }
  });
  return { correct, total };
};

export const totalMax = (assignment: Assignment): number => {
  if (!assignment.questions || assignment.questions.length === 0) return 0;
  return assignment.questions.length;
};

export const guestSubs = (submissions: Submission[]): Submission[] => {
  return submissions || [];
};