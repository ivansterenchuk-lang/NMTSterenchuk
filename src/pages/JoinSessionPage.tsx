import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import TakeTestPage from '@/pages/TakeTestPage';
import { fetchSessionCodeStatus, fetchSessionShuffle, findActiveSession } from '@/lib/sessionRepository';
import type { SessionShuffleOptions } from '@/types/test';

interface JoinSessionPageProps {
  code: string;
}

type JoinStatus = 'loading' | 'ready' | 'expired' | 'closed' | 'not_found' | 'error';

interface JoinTarget {
  sessionId: string;
  testId: string;
  shuffle: SessionShuffleOptions;
}

export default function JoinSessionPage({ code }: JoinSessionPageProps) {
  const [target, setTarget] = useState<JoinTarget | null>(null);
  const [status, setStatus] = useState<JoinStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const found = await findActiveSession(code);
        if (cancelled) return;
        if (found) {
          const shuffle = await fetchSessionShuffle(found.sessionId);
          if (cancelled) return;
          setTarget({ ...found, shuffle });
          setStatus('ready');
          return;
        }
        const codeStatus = await fetchSessionCodeStatus(code);
        if (!cancelled) setStatus(codeStatus === 'active' ? 'not_found' : codeStatus);
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Підключаємо до сесії...
      </div>
    );
  }

  if (status === 'ready' && target) {
    return <TakeTestPage key={target.sessionId} testId={target.testId} sessionId={target.sessionId} sessionCode={code} shuffle={target.shuffle} />;
  }

  const ended = status === 'expired' || status === 'closed';

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <p className="text-lg font-semibold text-slate-900">
        {ended ? 'Термін дії цієї сесії закінчився' : status === 'error' ? 'Не вдалося підключитися' : 'Сесію не знайдено'}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {status === 'expired' && 'Час прийому відповідей минув. Уточніть у вчителя новий код.'}
        {status === 'closed' && 'Вчитель завершив прийом відповідей. Уточніть у вчителя новий код.'}
        {status === 'error' && 'Перевірте з\'єднання з інтернетом і спробуйте ще раз.'}
        {status === 'not_found' && 'Код неправильний. Уточніть код у вчителя.'}
      </p>
    </div>
  );
}
