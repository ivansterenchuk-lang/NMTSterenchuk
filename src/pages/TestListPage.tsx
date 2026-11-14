import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, CheckCircle2, ListChecks, Link2, ListOrdered, FileText } from 'lucide-react';
import TestCard from '@/components/library/TestCard';
import { navigate } from '@/lib/router';
import { deleteTest, fetchTests, updateTestTitle } from '@/lib/testRepository';
import type { BasketItem, Question, Test } from '@/types/test';

interface TestListPageProps {
  userId: string;
  basketItems: BasketItem[];
  onAddToBasket: (question: Question, sourceTestTitle: string) => void;
  basketError: string | null;
}

export default function TestListPage({ userId, basketItems, onAddToBasket, basketError }: TestListPageProps) {
  const [tests, setTests] = useState<Test[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const inBasket = useMemo(
    () => new Set(basketItems.map((item) => item.question_id)),
    [basketItems],
  );

  useEffect(() => {
    fetchTests()
      .then(setTests)
      .catch(() => setLoadError('Не вдалося завантажити тести. Оновіть сторінку.'));
  }, []);

  const handleDelete = async (test: Test) => {
    if (!window.confirm(`Видалити тест "${test.title}" разом з усіма результатами учнів?`)) return;
    setBusyId(test.id);
    setCardError(null);
    try {
      await deleteTest(test.id);
      setTests((prev) => prev?.filter((t) => t.id !== test.id) ?? null);
    } catch {
      setCardError('Не вдалося видалити тест. Спробуйте ще раз.');
    } finally {
      setBusyId(null);
    }
  };

  // 🔥 НОВЕ: Обробник зміни назви
  const handleRename = async (testId: string, newTitle: string) => {
    try {
      await updateTestTitle(testId, newTitle);
      // Оновлюємо локальний стан, щоб не перезавантажувати сторінку
      setTests((prev) => 
        prev ? prev.map(t => t.id === testId ? { ...t, title: newTitle } : t) : null
      );
    } catch (err) {
      setCardError('Не вдалося змінити назву тесту. Спробуйте ще раз.');
    }
  };

  const ownTests = tests?.filter((t) => t.owner_id === userId) ?? [];
  const libraryTests = tests?.filter((t) => t.owner_id !== userId) ?? [];

  const error = loadError ?? cardError ?? basketError;

  // 🔥 Пункт 9: Розрахунок статистики для плаваючого вікна
  const stats = useMemo(() => {
    const res = { single: 0, multiple: 0, matching: 0, sequence: 0, notebook: 0, total: 0 };
    ownTests.forEach(test => {
      test.questions.forEach(q => {
        res.total++;
        // Визначаємо тип (з урахуванням сумісності старих тестів)
        const type = (q as any).type;
        if (type === 'matching' || (q as any).leftItems?.length > 0 || (q as any).leftColumn) res.matching++;
        else if (type === 'single') res.single++;
        else if (type === 'multiple') res.multiple++;
        else if (type === 'sequence') res.sequence++;
        else res.notebook++; // Якщо тип невідомий (наприклад, зошит)
      });
    });
    return res;
  }, [ownTests]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:pr-64 relative">
      
      {/* 🔥 Пункт 9: Плаваюче вікно зі статистикою (видно тільки на великих екранах) */}
      {ownTests.length > 0 && (
        <div className="hidden lg:block fixed right-6 top-24 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-5 z-10">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
            📊 Ваша статистика
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Одна відп.</span>
              <span className="font-bold text-slate-900">{stats.single}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><ListChecks className="w-4 h-4 text-blue-500"/> Множинний</span>
              <span className="font-bold text-slate-900">{stats.multiple}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><Link2 className="w-4 h-4 text-purple-500"/> Відповідність</span>
              <span className="font-bold text-slate-900">{stats.matching}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><ListOrdered className="w-4 h-4 text-amber-500"/> Послідовність</span>
              <span className="font-bold text-slate-900">{stats.sequence}</span>
            </div>
            {stats.notebook > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500"/> Зошит</span>
                <span className="font-bold text-slate-900">{stats.notebook}</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center font-black text-slate-900">
            <span>Всього:</span>
            <span className="text-teal-600 text-lg">{stats.total}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Бібліотека тестів</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Тести та питання</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tests/new')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Створити тест
        </button>
      </div>

      {error && (
        <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {tests === null && !loadError && <p className="mt-10 text-sm text-slate-500">Завантаження...</p>}

      {tests?.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 font-medium text-slate-800">Тестів ще немає</p>
          <p className="mt-1 text-sm text-slate-500">Створіть перший тест, щоб учні могли його пройти.</p>
        </div>
      )}

      {ownTests.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Мої тести</h2>
          <ul className="mt-4 grid gap-4">
            {ownTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                isOwner
                inBasket={inBasket}
                onAddToBasket={onAddToBasket}
                onDelete={handleDelete}
                onRename={handleRename} // 🔥 Передаємо функцію зміни назви
                busy={busyId === test.id}
                onError={setCardError}
              />
            ))}
          </ul>
        </section>
      )}

      {libraryTests.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Інші тести</h2>
          <ul className="mt-4 grid gap-4">
            {libraryTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                isOwner={false}
                inBasket={inBasket}
                onAddToBasket={onAddToBasket}
                onDelete={handleDelete}
                onRename={handleRename} 
                busy={busyId === test.id}
                onError={setCardError}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}