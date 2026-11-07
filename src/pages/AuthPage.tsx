import { useState, type FormEvent } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { signIn, signUp } from '@/lib/auth';
import { navigate } from '@/lib/router';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || password.length < 6) {
      setError('Введіть пошту та пароль щонайменше з 6 символів.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const hasSession = await signUp(email.trim(), password);
        if (!hasSession) setNotice('Акаунт створено. Тепер увійдіть із вашою поштою та паролем.');
        setMode('signin');
      } else {
        await signIn(email.trim(), password);
      }
    } catch {
      setError(
        isSignUp
          ? 'Не вдалося створити акаунт. Можливо, така пошта вже зареєстрована.'
          : 'Не вдалося увійти. Перевірте пошту та пароль.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
          {isSignUp ? 'Створення акаунта вчителя' : 'Вхід для вчителя'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSignUp
            ? 'Ваші тести, кошик і сесії будуть доступні лише вам.'
            : 'Увійдіть, щоб керувати тестами та бачити результати учнів.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Електронна пошта</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Пароль</span>
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? 'Створити акаунт' : 'Увійти'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'signin' : 'signup');
            setError(null);
            setNotice(null);
          }}
          className="mt-6 w-full text-center text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          {isSignUp ? 'Вже маю акаунт. Увійти' : 'Немає акаунта? Зареєструватися'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="mt-3 w-full text-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Я учень: самостійне тренування без входу
        </button>
      </div>
    </div>
  );
}
