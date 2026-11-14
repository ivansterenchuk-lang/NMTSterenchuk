import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import {
  SUBJECTS,
  KIND_LABELS,
  type Question,
  type QuestionType
} from '../lib/nmt';

type Props = {
  initial?: Question | null;
  onClose: () => void;
  onSave: (q: Question) => void;
};

const inp = 'w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition';
const ghostBtn = 'px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-teal-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm';

// 🔧 Генератор українських літер (А, Б, В, Г...)
const getLetter = (index: number) => String.fromCharCode(1040 + index);

// 🔧 Отримання індексу з літери (підтримує і англійські, і українські для сумісності)
const getIndexFromLetter = (letter: string) => {
  if (!letter) return -1;
  const code = letter.charCodeAt(0);
  if (code >= 1040 && code <= 1071) return code - 1040; // Українські А-Я
  if (code >= 65 && code <= 90) return code - 65; // Англійські A-Z (для старих тестів)
  return -1;
};

export default function QuestionBuilder({ initial, onClose, onSave }: Props) {
  const editing = initial !== null && initial !== undefined;

  const [subject, setSubject] = useState<string>(initial?.subject ?? 'Історія України');
  const [type, setType] = useState<QuestionType>(initial?.type ?? 'single');
  const [text, setText] = useState(initial?.text ?? '');
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState('');

  // Система оцінювання
  const [gradingSystem, setGradingSystem] = useState<'12' | '100' | 'preschool' | 'nus'>(
    (initial as any)?.gradingSystem ?? '12'
  );

  // 🔥 ВИПРАВЛЕНО: Додано as any для усунення помилки TypeScript
  const [points, setPoints] = useState<number>((initial as any)?.points ?? 1);
  const [pointsMode, setPointsMode] = useState<'all' | 'partial'>((initial as any)?.pointsMode ?? 'all');

  // Стан для модального вікна зображень
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageCallback, setImageCallback] = useState<((url: string) => void) | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');

  // 1. Одна або кілька відповідей
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean; image?: string }[]>(
    initial?.options ?? [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  );

  // 2. Відповідність
  const [leftCol, setLeftCol] = useState<{ text: string; image?: string }[]>(
    initial?.leftColumn?.map((x: any) => typeof x === 'string' ? { text: x } : x) ?? [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]
  );
  const [rightCol, setRightCol] = useState<{ text: string; image?: string }[]>(
    initial?.rightColumn?.map((x: any) => typeof x === 'string' ? { text: x } : x) ?? [{ text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }]
  );
  // За замовчуванням українські літери
  const [matches, setMatches] = useState<Record<number, string>>(
    initial?.correctMatches ?? { 0: 'А', 1: 'Б', 2: 'В', 3: 'Г' }
  );

  // 3. Послідовність
  const [sequence, setSequence] = useState<{ text: string; image?: string }[]>(
    initial?.sequenceItems?.map((x: any) => typeof x === 'string' ? { text: x } : x) ?? [{ text: '' }, { text: '' }, { text: '' }, { text: '' }]
  );

  // --- СУЧАСНЕ ВІКНО ДЛЯ ДОДАВАННЯ КАРТИНКИ ---
  const openImageModal = (callback: (url: string) => void) => {
    setImageCallback(() => callback);
    setTempImageUrl('');
    setIsImageModalOpen(true);
  };

  const confirmImage = () => {
    if (tempImageUrl.trim() && (tempImageUrl.trim().startsWith('http://') || tempImageUrl.trim().startsWith('https://'))) {
      if (imageCallback) imageCallback(tempImageUrl.trim());
      setIsImageModalOpen(false);
    } else {
      alert('Неправильний формат посилання. Воно має починатися з http:// або https://');
    }
  };

  // --- ОБРОБНИКИ ---
  const updateOption = (index: number, val: string) => {
    const newOpts = [...options];
    newOpts[index].text = val;
    setOptions(newOpts);
  };

  const updateOptionImage = (index: number, img?: string) => {
    const newOpts = [...options];
    newOpts[index].image = img;
    setOptions(newOpts);
  };

  const toggleCorrect = (index: number) => {
    const newOpts = options.map((opt, i) => ({
      ...opt,
      isCorrect: type === 'single' ? i === index : (i === index ? !opt.isCorrect : opt.isCorrect)
    }));
    setOptions(newOpts);
  };

  const updateLeft = (i: number, val: string) => {
    const newCol = [...leftCol]; newCol[i].text = val; setLeftCol(newCol);
  };
  const updateLeftImage = (i: number, img?: string) => {
    const newCol = [...leftCol]; newCol[i].image = img; setLeftCol(newCol);
  };

  const updateRight = (i: number, val: string) => {
    const newCol = [...rightCol]; newCol[i].text = val; setRightCol(newCol);
  };
  const updateRightImage = (i: number, img?: string) => {
    const newCol = [...rightCol]; newCol[i].image = img; setRightCol(newCol);
  };

  const removeLeftItem = (i: number) => {
    if (leftCol.length <= 2) return;
    const newLeft = leftCol.filter((_, k) => k !== i);
    setLeftCol(newLeft);

    const newMatches: Record<number, string> = {};
    let newIndex = 0;
    for (let k = 0; k < leftCol.length; k++) {
      if (k !== i) {
        if (matches[k]) newMatches[newIndex] = matches[k];
        newIndex++;
      }
    }
    setMatches(newMatches);
  };

  const removeRightItem = (i: number) => {
    if (rightCol.length <= 2) return;
    const newRight = rightCol.filter((_, k) => k !== i);
    setRightCol(newRight);

    const newMatches = { ...matches };
    Object.keys(newMatches).forEach((k) => {
      const leftIdx = Number(k);
      const letter = newMatches[leftIdx];
      const targetIdx = getIndexFromLetter(letter);
      
      if (targetIdx === i) {
        delete newMatches[leftIdx]; // Видаляємо відповідність, якщо елемент зник
      } else if (targetIdx > i) {
        newMatches[leftIdx] = getLetter(targetIdx - 1); // Зсуваємо літеру (напр., 'В' стає 'Б')
      }
    });
    setMatches(newMatches);
  };

  const updateSeq = (i: number, val: string) => {
    const newSeq = [...sequence]; newSeq[i].text = val; setSequence(newSeq);
  };
  const updateSeqImage = (i: number, img?: string) => {
    const newSeq = [...sequence]; newSeq[i].image = img; setSequence(newSeq);
  };

  const moveSeq = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sequence.length) return;
    const newSeq = [...sequence];
    [newSeq[i], newSeq[j]] = [newSeq[j], newSeq[i]];
    setSequence(newSeq);
  };

  const handleSave = () => {
    if (!text.trim()) { setError('Введіть текст питання.'); return; }

    let q: any = {
      id: initial?.id ?? Date.now(),
      subject,
      text: text.trim(),
      type,
      image: image || undefined,
      comment: comment.trim() || undefined,
      gradingSystem,
      points,         // 🔥 Зберігаємо бали
      pointsMode,     // 🔥 Зберігаємо режим нарахування
    };

    if (type === 'single' || type === 'multiple') {
      const validOptions = options.filter(o => o.text.trim() !== '' || o.image);
      if (validOptions.length < 2) { setError('Потрібно хоча б 2 варіанти відповіді.'); return; }
      if (!validOptions.some(o => o.isCorrect)) { setError('Позначте хоча б один правильний варіант.'); return; }
      q.options = validOptions;
    } 
    else if (type === 'matching') {
      const newLeft = leftCol.filter((c) => c.text.trim() !== '' || c.image);
      const newRight = rightCol.filter((c) => c.text.trim() !== '' || c.image);

      if (newLeft.length < 2 || newRight.length < 2) { 
        setError('Заповніть обидві колонки (мін. 2 елементи).'); 
        return; 
      }

      for (let i = 0; i < leftCol.length; i++) {
        const isLeftValid = leftCol[i].text.trim() !== '' || leftCol[i].image;
        if (isLeftValid) {
          const matchLetter = matches[i];
          if (!matchLetter) {
            setError('Вкажіть відповідність для кожного елемента лівої колонки.');
            return;
          }
          const rIdx = getIndexFromLetter(matchLetter);
          const rightItem = rightCol[rIdx];
          if (!rightItem || (rightItem.text.trim() === '' && !rightItem.image)) {
            setError(`Відповідник «${matchLetter}» порожній. Заповніть його або оберіть інший.`);
            return;
          }
        }
      }

      const finalMatches: Record<number, string> = {};
      let validLeftIndex = 0;
      for (let i = 0; i < leftCol.length; i++) {
        if (leftCol[i].text.trim() !== '' || leftCol[i].image) {
          finalMatches[validLeftIndex] = matches[i];
          validLeftIndex++;
        }
      }

      q.leftColumn = newLeft;
      q.rightColumn = newRight;
      q.correctMatches = finalMatches;
    } 
    else if (type === 'sequence') {
      const vSeq = sequence.filter(c => c.text.trim() !== '' || c.image);
      if (vSeq.length < 2) { setError('Потрібно хоча б 2 елементи послідовності.'); return; }
      q.sequenceItems = vSeq;
    }

    onSave(q);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Шапка */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3">
            <select value={subject} disabled={editing} onChange={e => setSubject(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-600 shadow-sm cursor-pointer disabled:opacity-60">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={gradingSystem} onChange={e => setGradingSystem(e.target.value as any)} className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-600 shadow-sm cursor-pointer">
              <option value="12">12-бальна</option>
              <option value="100">100-бальна</option>
              <option value="preschool">Без оцінки</option>
              <option value="nus">НУШ</option>
            </select>
            
            <div className="flex flex-wrap bg-slate-200 p-1 rounded-xl text-xs font-bold border border-slate-300">
              {(['single', 'multiple', 'matching', 'sequence'] as QuestionType[]).map(k => (
                <button key={k} onClick={() => { setType(k); setError(''); }} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${type === k ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300'}`}>
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer">
              {editing ? 'Зберегти зміни' : 'Створити питання'}
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer transition"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Тіло */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {/* Текст питання + Зображення */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Текст питання</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Введіть текст завдання..." className={`${inp} resize-none`} />
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button 
                type="button"
                onClick={() => openImageModal(setImage)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition text-sm text-slate-700 font-bold shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-teal-600" />
                Додати фото до питання
              </button>
              
              {/* 🔥 Пункт 3: Збільшене прев'ю картинки */}
              {image && (
                <div className="relative">
                  <img src={image} alt="Preview" className="h-24 w-auto max-w-[200px] object-contain rounded-lg border border-slate-300 shadow-sm bg-slate-100 p-1" />
                  <button onClick={() => setImage(undefined)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>

          {/* 🔥 Пункт 6: Налаштування балів */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Кількість балів за питання:</label>
              <input
                type="number"
                min="1"
                value={points}
                onChange={e => setPoints(Math.max(1, Number(e.target.value)))}
                className="w-16 p-1.5 border border-slate-300 rounded-lg text-sm font-bold text-center outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Режим нарахування:</label>
              <select
                value={pointsMode}
                onChange={e => setPointsMode(e.target.value as any)}
                className="p-1.5 border border-slate-300 rounded-lg text-sm font-bold outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">Усе або нічого</option>
                <option value="partial">Часткові (за кожну правильну)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Коментар (для роботи над помилками)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Пояснення, чому відповідь саме така..." className={`${inp} resize-none`} />
          </div>

          <hr className="border-slate-200" />

          {/* РЕНДЕР ДЛЯ ЗВИЧАЙНИХ ПИТАНЬ */}
          {(type === 'single' || type === 'multiple') && (
            <div className="space-y-3">
              <span className="text-sm font-bold text-slate-900 block mb-3">
                Варіанти відповіді (оберіть {type === 'single' ? 'один' : 'кілька'} правильних)
              </span>
              {options.map((opt, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 flex-1">
                    <input type={type === 'single' ? 'radio' : 'checkbox'} checked={opt.isCorrect} onChange={() => toggleCorrect(i)} className={`w-5 h-5 cursor-pointer accent-teal-600 ${type === 'single' ? 'rounded-full' : 'rounded'}`} />
                    <span className="text-sm font-black text-slate-500 w-5 text-center">{getLetter(i)}</span>
                    <input value={opt.text} onChange={e => updateOption(i, e.target.value)} className="flex-1 bg-white p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition" placeholder={`Варіант ${getLetter(i)}`} />
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {opt.image ? (
                      <div className="relative">
                        <img src={opt.image} alt="Opt" className="h-16 w-16 object-contain rounded border border-slate-300 bg-slate-100 p-1" />
                        <button onClick={() => updateOptionImage(i, undefined)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => openImageModal((url) => updateOptionImage(i, url))} 
                        className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-teal-600 transition shadow-sm cursor-pointer"
                        title="Додати фото за посиланням"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => setOptions(options.filter((_, k) => k !== i))} disabled={options.length <= 2} className="p-2 text-slate-400 hover:text-red-600 transition cursor-pointer disabled:opacity-30 bg-white rounded-lg border border-slate-300 hover:bg-red-50 shadow-sm"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
              {options.length < 7 && (
                <button onClick={() => setOptions([...options, { text: '', isCorrect: false }])} className={ghostBtn}><Plus className="w-4 h-4" /> Додати варіант</button>
              )}
            </div>
          )}

          {/* РЕНДЕР ДЛЯ ВІДПОВІДНОСТІ */}
          {type === 'matching' && (
            <div className="space-y-4">
              <span className="text-sm font-bold text-slate-900 block">Встановлення відповідності</span>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Ліва колонка */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-teal-800 uppercase tracking-wider block mb-2 bg-teal-50 p-2 rounded-lg">Ліва колонка (Терміни)</span>
                  {leftCol.map((item, i) => (
                    <div key={i} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-500 w-4">{i + 1}</span>
                        <input value={item.text} onChange={e => updateLeft(i, e.target.value)} className="flex-1 bg-white p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-teal-600 transition" placeholder={`Термін ${i + 1}`} />
                        <select value={matches[i] || ''} onChange={e => setMatches({ ...matches, [i]: e.target.value })} className="p-2 bg-teal-50 border border-teal-300 rounded-lg text-teal-900 text-xs font-bold outline-none cursor-pointer">
                          <option value="">—</option>
                          {rightCol.map((_, c) => <option key={c} value={getLetter(c)}>{getLetter(c)}</option>)}
                        </select>
                        <button onClick={() => removeLeftItem(i)} disabled={leftCol.length <= 2} className="p-1.5 text-slate-400 hover:text-red-600 transition disabled:opacity-30 bg-white rounded-lg border border-slate-300 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        {item.image ? (
                          <div className="relative">
                            <img src={item.image} className="h-16 w-16 object-contain rounded border border-slate-300 bg-slate-100 p-1" />
                            <button onClick={() => updateLeftImage(i, undefined)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => openImageModal((url) => updateLeftImage(i, url))} className="text-[11px] text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                            <ImageIcon className="w-3.5 h-3.5" /> Додати фото
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setLeftCol([...leftCol, { text: '' }])} className={ghostBtn}><Plus className="w-4 h-4" /> Додати термін</button>
                </div>

                {/* Права колонка */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-teal-800 uppercase tracking-wider block mb-2 bg-teal-50 p-2 rounded-lg">Права колонка (Відповідники)</span>
                  {rightCol.map((item, i) => (
                    <div key={i} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-500 w-4">{getLetter(i)}</span>
                        <input value={item.text} onChange={e => updateRight(i, e.target.value)} className="flex-1 bg-white p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-teal-600 transition" placeholder={`Варіант ${getLetter(i)}`} />
                        <button onClick={() => removeRightItem(i)} disabled={rightCol.length <= 2} className="p-1.5 text-slate-400 hover:text-red-600 transition disabled:opacity-30 bg-white rounded-lg border border-slate-300 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        {item.image ? (
                          <div className="relative">
                            <img src={item.image} className="h-16 w-16 object-contain rounded border border-slate-300 bg-slate-100 p-1" />
                            <button onClick={() => updateRightImage(i, undefined)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => openImageModal((url) => updateRightImage(i, url))} className="text-[11px] text-teal-600 hover:underline cursor-pointer flex items-center gap-1 font-bold">
                            <ImageIcon className="w-3.5 h-3.5" /> Додати фото
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setRightCol([...rightCol, { text: '' }])} className={ghostBtn}><Plus className="w-4 h-4" /> Додати відповідник</button>
                </div>
              </div>
            </div>
          )}

          {/* РЕНДЕР ДЛЯ ПОСЛІДОВНОСТІ */}
          {type === 'sequence' && (
            <div className="space-y-3">
              <span className="text-sm font-bold text-slate-900 block">Встановлення послідовності</span>
              {sequence.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-black text-teal-800 bg-teal-100 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-teal-200">{i + 1}</span>
                    <input value={item.text} onChange={e => updateSeq(i, e.target.value)} className="flex-1 bg-white p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-teal-600 transition" placeholder={`Подія ${i + 1}`} />
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {item.image ? (
                      <div className="relative">
                        <img src={item.image} className="h-16 w-16 object-contain rounded border border-slate-300 bg-slate-100 p-1" />
                        <button onClick={() => updateSeqImage(i, undefined)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => openImageModal((url) => updateSeqImage(i, url))} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-teal-600 transition shadow-sm cursor-pointer" title="Додати фото за посиланням">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveSeq(i, -1)} disabled={i === 0} className="p-1 text-slate-500 hover:text-teal-700 disabled:opacity-30 bg-white rounded border border-slate-300 cursor-pointer"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => moveSeq(i, 1)} disabled={i === sequence.length - 1} className="p-1 text-slate-500 hover:text-teal-700 disabled:opacity-30 bg-white rounded border border-slate-300 cursor-pointer"><ArrowDown className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => setSequence(sequence.filter((_, k) => k !== i))} disabled={sequence.length <= 2} className="p-2 text-slate-400 hover:text-red-600 transition disabled:opacity-30 bg-white rounded-lg border border-slate-300 hover:bg-red-50 cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setSequence([...sequence, { text: '' }])} className={ghostBtn}><Plus className="w-4 h-4" /> Додати подію</button>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl p-3">{error}</div>}
        </div>
      </div>

      {/* 🔥 Пункт 8: Сучасне модальне вікно для додавання URL картинки */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Додати зображення за посиланням</h3>
              <button onClick={() => setIsImageModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none transition"
                autoFocus
              />
              
              {/* Попередній перегляд картинки */}
              {tempImageUrl && (tempImageUrl.startsWith('http://') || tempImageUrl.startsWith('https://')) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex justify-center">
                  <img src={tempImageUrl} alt="Preview" className="max-h-48 w-auto object-contain rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsImageModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer">Скасувати</button>
                <button onClick={confirmImage} className="px-4 py-2 bg-teal-600 text-white font-bold hover:bg-teal-700 rounded-xl shadow-md transition cursor-pointer">Додати</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}