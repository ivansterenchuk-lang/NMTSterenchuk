import { useCallback, useEffect, useState } from 'react';
import { addBasketItem, fetchBasket, removeBasketItems } from '@/lib/basketRepository';
import type { BasketItem, Question } from '@/types/test';

export function useBasket(enabled: boolean) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchBasket()
      .then((rows) => {
        if (active) setItems(rows);
      })
      .catch(() => {
        if (active) setError('Не вдалося завантажити кошик.');
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  const add = useCallback(async (question: Question, sourceTestTitle: string) => {
    setError(null);
    try {
      const created = await addBasketItem(question, sourceTestTitle);
      if (created) setItems((prev) => [...prev, created]);
    } catch {
      setError('Не вдалося додати питання до кошика.');
    }
  }, []);

  const remove = useCallback(async (ids: string[]) => {
    setError(null);
    try {
      await removeBasketItems(ids);
      setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    } catch {
      setError('Не вдалося змінити кошик.');
    }
  }, []);

  return { items, error, add, remove, setError };
}
