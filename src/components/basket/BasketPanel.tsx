import { useState } from 'react';
import { ShoppingBasket, Trash2, X } from 'lucide-react';
import CreateTestFromBasketDialog from '@/components/basket/CreateTestFromBasketDialog';
import type { BasketItem } from '@/types/test';

interface BasketPanelProps {
  items: BasketItem[];
  error: string | null;
  onRemove: (ids: string[]) => void;
  onCreated: (usedItemIds: string[]) => void;
}

export default function BasketPanel({ items, error, onRemove, onCreated }: BasketPanelProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const sourceCount = new Set(items.map((item) => item.source_test_title)).size;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))]">
        {open && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Мій кошик питань</p>
                <p className="text-xs text-slate-500">
                  {items.length} питань з {sourceCount} тестів
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Згорнути кошик"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  Кошик порожній. Додайте питання з бібліотеки.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-900">{item.question.prompt || 'Без тексту'}</p>
                        <p className="truncate text-xs text-slate-500">з тесту «{item.source_test_title}»</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove([item.id])}
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Прибрати з кошика"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={() => setCreating(true)}
                disabled={items.length === 0}
                className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Створити тест з обраного
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="ml-auto flex items-center gap-3 rounded-full bg-slate-900 py-3 pl-4 pr-5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-slate-800"
        >
          <ShoppingBasket className="h-5 w-5" />
          Мій кошик
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-500 px-2 text-xs font-semibold">
            {items.length}
          </span>
        </button>
      </div>

      {creating && (
        <CreateTestFromBasketDialog
          items={items}
          onClose={() => setCreating(false)}
          onCreated={(usedIds) => {
            setCreating(false);
            onCreated(usedIds);
          }}
        />
      )}
    </>
  );
}
