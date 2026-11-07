import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import NotebookToolbar from '@/components/notebook/NotebookToolbar';
import {
  createStrokeFromPoint,
  drawNotebookStrokes,
  extendStroke,
  getTextSize,
  NOTEBOOK_HEIGHT,
  NOTEBOOK_INK,
  NOTEBOOK_TOOLS,
  NOTEBOOK_WIDTH,
  NOTEBOOK_WIDTHS,
  type NotebookInkName,
} from '@/lib/notebookDrawing';
import type { NotebookPoint, NotebookStroke, NotebookTool } from '@/types/test';

const ALL_INKS = Object.keys(NOTEBOOK_INK) as NotebookInkName[];
const PIXEL_SCALE = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

const PAPER_STYLE = {
  aspectRatio: `${NOTEBOOK_WIDTH} / ${NOTEBOOK_HEIGHT}`,
  containerType: 'inline-size',
  backgroundColor: '#fffdf8',
  backgroundImage:
    'linear-gradient(to right, rgba(148, 163, 184, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
} as const;

interface TextDraft {
  at: NotebookPoint;
  value: string;
}

interface NotebookCanvasProps {
  label: string;
  strokes: NotebookStroke[];
  onChange?: (strokes: NotebookStroke[]) => void;
  underlay?: NotebookStroke[];
  tools?: NotebookTool[];
  inks?: NotebookInkName[];
}

function toLogicalPoint(event: PointerEvent<HTMLCanvasElement>): NotebookPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * NOTEBOOK_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * NOTEBOOK_HEIGHT,
  };
}

function isZeroSizeShape(stroke: NotebookStroke): boolean {
  return 'to' in stroke && stroke.from.x === stroke.to.x && stroke.from.y === stroke.to.y;
}

export default function NotebookCanvas({
  label,
  strokes,
  onChange,
  underlay,
  tools = NOTEBOOK_TOOLS,
  inks = ALL_INKS,
}: NotebookCanvasProps) {
  const [tool, setTool] = useState<NotebookTool>('pen');
  const [ink, setInk] = useState<NotebookInkName>(inks[0]);
  const [width, setWidth] = useState<number>(NOTEBOOK_WIDTHS[1]);
  const [draft, setDraft] = useState<NotebookStroke | null>(null);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
  const textCancelled = useRef(false);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const underlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const editable = Boolean(onChange);
  const visibleStrokes = draft ? [...strokes, draft] : strokes;

  useEffect(() => {
    const ctx = mainCanvasRef.current?.getContext('2d');
    if (ctx) drawNotebookStrokes(ctx, visibleStrokes);
  }, [visibleStrokes]);

  useEffect(() => {
    const ctx = underlayCanvasRef.current?.getContext('2d');
    if (ctx) drawNotebookStrokes(ctx, underlay ?? []);
  }, [underlay]);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!editable || event.button !== 0 || textDraft) return;
    const point = toLogicalPoint(event);
    if (tool === 'text') {
      setTextDraft({ at: point, value: '' });
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraft(createStrokeFromPoint(tool, point, NOTEBOOK_INK[ink].value, width));
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!draft) return;
    const point = toLogicalPoint(event);
    setDraft(extendStroke(draft, point));
  };

  const handlePointerEnd = () => {
    if (!draft || !onChange) return;
    setDraft(null);
    if (isZeroSizeShape(draft)) return;
    onChange([...strokes, draft]);
  };

  const finishText = () => {
    if (textDraft && !textCancelled.current && textDraft.value.trim() && onChange) {
      onChange([
        ...strokes,
        { kind: 'text', color: NOTEBOOK_INK[ink].value, width, at: textDraft.at, text: textDraft.value.trim() },
      ]);
    }
    textCancelled.current = false;
    setTextDraft(null);
  };

  const handleTextKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      textCancelled.current = true;
      event.currentTarget.blur();
    }
  };

  const handleUndo = () => onChange?.(strokes.slice(0, -1));

  const handleClear = () => {
    if (window.confirm('Очистити весь зошит? Це видалить усі записи на сторінці.')) onChange?.([]);
  };

  return (
    <div className="space-y-3">
      {editable && (
        <NotebookToolbar
          tools={tools}
          tool={tool}
          onTool={setTool}
          inks={inks}
          ink={ink}
          onInk={setInk}
          width={width}
          onWidth={setWidth}
          canUndo={strokes.length > 0}
          onUndo={handleUndo}
          canClear={strokes.length > 0}
          onClear={handleClear}
          onSymbol={(symbol) => setTextDraft((current) => (current ? { ...current, value: current.value + symbol } : current))}
        />
      )}

      <div className="relative w-full overflow-hidden rounded-xl border border-slate-300 shadow-inner" style={PAPER_STYLE}>
        <canvas
          ref={underlayCanvasRef}
          width={NOTEBOOK_WIDTH * PIXEL_SCALE}
          height={NOTEBOOK_HEIGHT * PIXEL_SCALE}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <canvas
          ref={mainCanvasRef}
          width={NOTEBOOK_WIDTH * PIXEL_SCALE}
          height={NOTEBOOK_HEIGHT * PIXEL_SCALE}
          role="img"
          aria-label={label}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className={`absolute inset-0 h-full w-full touch-none ${editable ? 'cursor-crosshair' : ''}`}
        />

        {textDraft && (
          <input
            type="text"
            autoFocus
            aria-label="Текст або формула"
            value={textDraft.value}
            onChange={(event) => setTextDraft({ ...textDraft, value: event.target.value })}
            onKeyDown={handleTextKey}
            onBlur={finishText}
            placeholder="Введіть текст"
            className="absolute z-10 min-w-[8rem] border-b-2 border-dashed border-teal-500 bg-white/80 px-1 outline-none"
            style={{
              left: `${(textDraft.at.x / NOTEBOOK_WIDTH) * 100}%`,
              top: `${(textDraft.at.y / NOTEBOOK_HEIGHT) * 100}%`,
              color: NOTEBOOK_INK[ink].value,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: `${(getTextSize(width) / NOTEBOOK_WIDTH) * 100}cqw`,
            }}
          />
        )}
      </div>
    </div>
  );
}
