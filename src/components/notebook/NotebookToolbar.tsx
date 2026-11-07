import type { LucideIcon } from 'lucide-react';
import { Circle, Eraser, Pencil, Ruler, Trash2, Triangle, Type, Undo2 } from 'lucide-react';
import { NOTEBOOK_INK, NOTEBOOK_WIDTHS, type NotebookInkName } from '@/lib/notebookDrawing';
import type { NotebookTool } from '@/types/test';

const TOOL_META: Record<NotebookTool, { label: string; icon: LucideIcon }> = {
  pen: { label: 'Олівець або ручка', icon: Pencil },
  eraser: { label: 'Гумка', icon: Eraser },
  line: { label: 'Лінійка: пряма', icon: Ruler },
  circle: { label: 'Коло', icon: Circle },
  triangle: { label: 'Трикутник', icon: Triangle },
  text: { label: 'Текст або формула', icon: Type },
};

export const FORMULA_SYMBOLS = ['²', '³', '√', 'π', '°', '±', '×', '÷', '≤', '≥', '≠', '∞', 'α', 'β', 'Δ', '→'];

interface NotebookToolbarProps {
  tools: NotebookTool[];
  tool: NotebookTool;
  onTool: (tool: NotebookTool) => void;
  inks: NotebookInkName[];
  ink: NotebookInkName;
  onInk: (ink: NotebookInkName) => void;
  width: number;
  onWidth: (width: number) => void;
  canUndo: boolean;
  onUndo: () => void;
  canClear: boolean;
  onClear: () => void;
  onSymbol: (symbol: string) => void;
}

const groupClass = 'flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200';
const iconButtonBase =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export default function NotebookToolbar({
  tools,
  tool,
  onTool,
  inks,
  ink,
  onInk,
  width,
  onWidth,
  canUndo,
  onUndo,
  canClear,
  onClear,
  onSymbol,
}: NotebookToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className={groupClass} role="group" aria-label="Інструменти">
          {tools.map((name) => {
            const { label, icon: Icon } = TOOL_META[name];
            const active = tool === name;
            return (
              <button
                key={name}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={active}
                onClick={() => onTool(name)}
                className={`${iconButtonBase} ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className={groupClass} role="group" aria-label="Колір">
          {inks.map((name) => (
            <button
              key={name}
              type="button"
              title={NOTEBOOK_INK[name].label}
              aria-label={NOTEBOOK_INK[name].label}
              aria-pressed={ink === name}
              onClick={() => onInk(name)}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                ink === name ? 'ring-2 ring-slate-900 ring-offset-2' : ''
              }`}
              style={{ backgroundColor: NOTEBOOK_INK[name].value }}
            />
          ))}
        </div>

        <div className={groupClass} role="group" aria-label="Товщина лінії">
          {NOTEBOOK_WIDTHS.map((value) => (
            <button
              key={value}
              type="button"
              title={`Товщина ${value}`}
              aria-label={`Товщина ${value}`}
              aria-pressed={width === value}
              onClick={() => onWidth(value)}
              className={`${iconButtonBase} ${width === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="block rounded-full bg-current" style={{ width: value * 2 + 4, height: value * 2 + 4 }} />
            </button>
          ))}
        </div>

        <div className={`${groupClass} ml-auto`}>
          <button
            type="button"
            title="Скасувати останній штрих"
            aria-label="Скасувати останній штрих"
            disabled={!canUndo}
            onClick={onUndo}
            className={`${iconButtonBase} text-slate-600 hover:bg-slate-100`}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Очистити зошит"
            aria-label="Очистити зошит"
            disabled={!canClear}
            onClick={onClear}
            className={`${iconButtonBase} text-red-600 hover:bg-red-50`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tool === 'text' && (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Математичні символи">
          {FORMULA_SYMBOLS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSymbol(symbol)}
              className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg bg-white px-2 text-sm text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-teal-50 hover:text-teal-700"
            >
              {symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
