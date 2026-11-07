import { useEffect, useState } from 'react';
import TestBuilderForm from '@/components/builder/TestBuilderForm';
import { fetchTest } from '@/lib/testRepository';
import type { Test } from '@/types/test';

interface TestBuilderPageProps {
  testId: string | null;
}

export default function TestBuilderPage({ testId }: TestBuilderPageProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>(
    testId ? 'loading' : 'ready',
  );

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    fetchTest(testId)
      .then((found) => {
        if (cancelled) return;
        setTest(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [testId]);

  if (status === 'loading') {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-slate-500">Завантаження...</p>;
  }
  if (status === 'missing') {
    return <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-red-700">Тест не знайдено.</p>;
  }
  if (status === 'error') {
    return (
      <p className="mx-auto max-w-5xl px-6 py-10 text-sm text-red-700" role="alert">
        Не вдалося завантажити тест. Оновіть сторінку.
      </p>
    );
  }

  return <TestBuilderForm key={test?.id ?? 'new'} initialTest={test} />;
}
