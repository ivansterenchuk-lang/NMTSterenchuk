import type { NotebookPoint, NotebookStroke, NotebookTool } from '@/types/test';

export const NOTEBOOK_WIDTH = 800;
export const NOTEBOOK_HEIGHT = 1000;

export const NOTEBOOK_INK = {
  black: { label: 'Чорний', value: '#0f172a' },
  blue: { label: 'Синій', value: '#1d4ed8' },
  green: { label: 'Зелений', value: '#15803d' },
  red: { label: 'Червоний', value: '#dc2626' },
} as const;

export type NotebookInkName = keyof typeof NOTEBOOK_INK;

export const NOTEBOOK_WIDTHS = [2, 4, 8] as const;

export const NOTEBOOK_TOOLS: NotebookTool[] = ['pen', 'eraser', 'line', 'circle', 'triangle', 'text'];

export function getTextSize(width: number): number {
  return width * 6 + 12;
}

export function getTrianglePoints(from: NotebookPoint, to: NotebookPoint): [NotebookPoint, NotebookPoint, NotebookPoint] {
  const left = Math.min(from.x, to.x);
  const right = Math.max(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const bottom = Math.max(from.y, to.y);
  return [
    { x: (left + right) / 2, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

function tracePolyline(ctx: CanvasRenderingContext2D, points: NotebookPoint[]): void {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: NotebookStroke): void {
  ctx.save();
  ctx.globalCompositeOperation = stroke.kind === 'pen' && stroke.eraser ? 'destination-out' : 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;

  if (stroke.kind === 'pen') {
    tracePolyline(ctx, stroke.points);
  } else if (stroke.kind === 'line') {
    tracePolyline(ctx, [stroke.from, stroke.to]);
  } else if (stroke.kind === 'circle') {
    const radius = Math.hypot(stroke.to.x - stroke.from.x, stroke.to.y - stroke.from.y);
    ctx.beginPath();
    ctx.arc(stroke.from.x, stroke.from.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stroke.kind === 'triangle') {
    const [apex, bottomRight, bottomLeft] = getTrianglePoints(stroke.from, stroke.to);
    tracePolyline(ctx, [apex, bottomRight, bottomLeft, apex]);
  } else if (stroke.kind === 'text') {
    ctx.font = `${getTextSize(stroke.width)}px Georgia, 'Times New Roman', serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(stroke.text, stroke.at.x, stroke.at.y);
  }
  ctx.restore();
}

export function drawNotebookStrokes(ctx: CanvasRenderingContext2D, strokes: NotebookStroke[]): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(ctx.canvas.width / NOTEBOOK_WIDTH, 0, 0, ctx.canvas.height / NOTEBOOK_HEIGHT, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) drawStroke(ctx, stroke);
}

export function extendStroke(stroke: NotebookStroke, point: NotebookPoint): NotebookStroke {
  if (stroke.kind === 'pen') return { ...stroke, points: [...stroke.points, point] };
  if (stroke.kind === 'text') return stroke;
  return { ...stroke, to: point };
}

export function createStrokeFromPoint(
  tool: NotebookTool,
  point: NotebookPoint,
  ink: string,
  width: number,
): NotebookStroke | null {
  if (tool === 'pen' || tool === 'eraser') {
    return { kind: 'pen', eraser: tool === 'eraser', color: ink, width, points: [point] };
  }
  if (tool === 'line' || tool === 'circle' || tool === 'triangle') {
    return { kind: tool, color: ink, width, from: point, to: point };
  }
  return null;
}
