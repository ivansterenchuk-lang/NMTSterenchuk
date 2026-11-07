import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eraser, Type, Pen, Download, Trash2, Plus, Copy } from 'lucide-react';

type Point = { x: number; y: number };
type Line = { points: Point[]; color: string; width: number; tool: 'pen' | 'eraser' };
type TextItem = { x: number; y: number; text: string; color: string; size: number };
type ToolType = 'pen' | 'eraser' | 'text';

export default function Whiteboard({ studentName = 'Учень', isTeacher = false }: { studentName?: string, isTeacher?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Стан для кімнат
  const [roomId, setRoomId] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  // Стан дошки
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);
  
  const [color, setColor] = useState('#0ea5e9');
  const [width, setWidth] = useState(3);
  const [tool, setTool] = useState<ToolType>('pen');
  const [inputPos, setInputPos] = useState<{ x: number; y: number } | null>(null);
  const [inputText, setInputText] = useState('');

  // --- СТВОРЕННЯ / ПРИЄДНАННЯ ---
  const createRoom = () => {
    const newCode = 'BRD-' + Math.floor(1000 + Math.random() * 9000);
    setRoomId(newCode);
    setJoined(true);
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError('Введіть код дошки');
      return;
    }
    setRoomId(code);
    setJoined(true);
  };

  // --- СИНХРОНІЗАЦІЯ SUPABASE ---
  useEffect(() => {
    if (!supabase || !joined || !roomId) return;

    const loadBoard = async () => {
      const { data } = await supabase.from('whiteboards').select('data').eq('id', roomId).single();
      if (data && data.data) {
        setLines(data.data.lines || []);
        setTexts(data.data.texts || []);
      } else {
        await supabase.from('whiteboards').insert({ id: roomId, data: { lines: [], texts: [] } });
      }
    };
    loadBoard();

    const channel = supabase
      .channel(`whiteboard-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whiteboards', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new.data) {
            setLines(payload.new.data.lines || []);
            setTexts(payload.new.data.texts || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [roomId, joined]);

  const saveBoard = async (newLines: Line[], newTexts: TextItem[]) => {
    if (!supabase || !roomId) return;
    await supabase
      .from('whiteboards')
      .update({ data: { lines: newLines, texts: newTexts }, updated_at: new Date().toISOString() })
      .eq('id', roomId);
  };

  // --- МАЛЮВАННЯ ---
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const { x, y } = getCoordinates(e);
      setInputPos({ x, y });
      setInputText('');
      return;
    }
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setCurrentLine({ points: [{ x, y }], color, width, tool });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLine || tool === 'text') return;
    const { x, y } = getCoordinates(e);
    setCurrentLine({ ...currentLine, points: [...currentLine.points, { x, y }] });
  };

  const stopDrawing = () => {
    if (currentLine && tool !== 'text') {
      const newLines = [...lines, currentLine];
      setLines(newLines);
      saveBoard(newLines, texts);
    }
    setIsDrawing(false);
    setCurrentLine(null);
  };

  const handleTextSubmit = () => {
    if (!inputText.trim() || !inputPos) return;
    const newTextItem: TextItem = { x: inputPos.x, y: inputPos.y, text: inputText, color, size: width * 6 };
    const newTexts = [...texts, newTextItem];
    setTexts(newTexts);
    saveBoard(lines, newTexts);
    setInputPos(null);
    setInputText('');
  };

  const clearBoard = () => {
    if(confirm('Очистити дошку для всіх?')) {
      setLines([]); setTexts([]); saveBoard([], []);
    }
  };

  const saveAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `homework-${roomId}-${studentName}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

    const allLines = currentLine ? [...lines, currentLine] : lines;
    allLines.forEach((line) => {
      ctx.beginPath();
      ctx.strokeStyle = line.tool === 'eraser' ? '#ffffff' : line.color;
      ctx.lineWidth = line.tool === 'eraser' ? line.width * 4 : line.width;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      line.points.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    });

    texts.forEach((t) => {
      ctx.font = `${t.size}px sans-serif`; ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
    });
  }, [lines, currentLine, texts]);

  // --- ЕКРАН ВХОДУ ---
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto my-12 space-y-6">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100">
          <Pen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 text-center">Інтерактивна дошка</h2>
        <p className="text-sm text-slate-500 text-center">Створіть нову дошку або приєднайтеся до існуючої за кодом.</p>
        
        {isTeacher && (
          <button onClick={createRoom} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Створити нову дошку
          </button>
        )}

        <div className="w-full border-t border-slate-200 pt-6 space-y-3">
          <label className="text-xs font-bold text-slate-600 uppercase">Приєднатися за кодом</label>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Напр. BRD-1234"
              className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-teal-500 outline-none uppercase font-mono"
            />
            <button onClick={joinRoom} className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition">
              Увійти
            </button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
        </div>
      </div>
    );
  }

  // --- САМА ДОШКА ---
  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm w-full max-w-5xl mx-auto select-none">
      
      {/* Інфо про кімнату */}
      <div className="w-full flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Код дошки:</span>
          <span className="font-mono font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{roomId}</span>
          <button onClick={() => navigator.clipboard.writeText(roomId)} className="text-slate-400 hover:text-teal-600"><Copy className="w-4 h-4" /></button>
        </div>
        <button onClick={() => { setJoined(false); setRoomId(''); setLines([]); }} className="text-xs text-slate-400 hover:text-red-500 font-bold">
          Вийти з дошки
        </button>
      </div>

      {/* Панель інструментів */}
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 w-full justify-center">
        <button onClick={() => setTool('pen')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${tool === 'pen' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Pen className="w-4 h-4" /> Олівець</button>
        <button onClick={() => setTool('eraser')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${tool === 'eraser' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Eraser className="w-4 h-4" /> Гумка</button>
        <button onClick={() => setTool('text')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${tool === 'text' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Type className="w-4 h-4" /> Текст</button>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-500">Колір:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-500">Товщина:</label>
          <input type="range" min="1" max="20" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-24 accent-teal-600" />
        </div>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <button onClick={saveAsImage} className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"><Download className="w-4 h-4" /> Зберегти</button>
        <button onClick={clearBoard} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Очистити</button>
      </div>

      {/* Полотно */}
      <div className="relative w-full overflow-hidden bg-white rounded-xl shadow-inner border border-slate-300">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`w-full h-auto ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'} touch-none`}
        />
        {inputPos && (
          <div className="absolute z-10 bg-white shadow-lg border border-teal-300 rounded p-1" style={{ left: inputPos.x, top: inputPos.y - 20 }}>
            <input
              autoFocus
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setInputPos(null); }}
              onBlur={handleTextSubmit}
              className="px-2 py-1 outline-none text-black font-sans"
              style={{ fontSize: `${width * 6}px`, color: color }}
              placeholder="Введіть текст..."
            />
          </div>
        )}
      </div>
    </div>
  );
}