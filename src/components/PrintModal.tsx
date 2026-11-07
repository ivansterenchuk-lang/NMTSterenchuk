import { useState } from 'react';
import { SUBJECTS, maxPoints, type Question } from '../lib/nmt';
import { printHtml, worksheetHtml, type WorksheetOptions } from '../lib/pdf';

type Props = {
  title: string;
  questions: Question[];
  teacher?: string;
  onClose: () => void;
};

type Mode = WorksheetOptions['mode'];

const MODES: [Mode, string, string][] = [
  ['student', 'Для учнів', 'Лише питання, без відповідей'],
  ['key', 'Для учнів + ключ', 'Питання та окрема сторінка з правильними відповідями'],
  ['teacher', 'Версія вчителя', 'Питання з позначеними правильними відповідями']
];

const inp =
  'w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none';

export default function PrintModal({ title, questions, teacher, onClose }: Props) {
  const [workTitle, setWorkTitle] = useState(title);
  const [mode, setMode] = useState<Mode>('student');
  const [variants, setVariants] = useState(1);
  const [layout, setLayout] = useState<'inline' | 'sheet'>('inline');
  const [school, setSchool] = useState('');
  const [group, setGroup] = useState('');
  const [date, setDate] = useState('');

  const max = questions.reduce((s, q) => s + maxPoints(q), 0);
  const subj = SUBJECTS[questions[0]?.subject ?? 'history'].label;

  const download = () => {
    const name = workTitle.trim() || title;
    const html = worksheetHtml({
      title: name,
      school: school.trim() || undefined,
      group: group.trim() || undefined,
      date: date ? new Date(`${date}T12:00:00`).toLocaleDateString('uk-UA') : undefined,
      teacher,
      questions,
      mode,
      variants,
      layout
    });
    printHtml(html, `${name}${mode === 'teacher' ? ' (вчитель)' : ''}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Завантажити PDF для друку</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {subj} · {questions.length} пит. · {max} б
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-400">Назва роботи</label>
            <input value={workTitle} onChange={e => setWorkTitle(e.target.value)} className={inp} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-indigo-400">Версія документа</label>
            {MODES.map(([k, label, hint]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                  mode === k ? 'bg-indigo-950 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <p className="text-sm font-bold text-slate-200">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Кількість варіантів</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setVariants(n)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      variants === n
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {variants > 1 && (
                <p className="text-[11px] text-slate-500">Питання й варіанти відповідей перемішуються, ключ — для кожного варіанту.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Відповіді учнів</label>
              <select
                value={layout}
                disabled={mode === 'teacher'}
                onChange={e => setLayout(e.target.value as 'inline' | 'sheet')}
                className={`${inp} disabled:opacity-50`}
              >
                <option value="inline">Під кожним питанням</option>
                <option value="sheet">В окремому бланку відповідей</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-bold text-slate-400">Школа (необов’язково)</label>
              <input value={school} onChange={e => setSchool(e.target.value)} className={inp} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400">Клас / група</label>
              <input value={group} onChange={e => setGroup(e.target.value)} placeholder="Залиште порожнім — буде лінія" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Після натискання відкриється вікно друку. Оберіть там «Зберегти як PDF» або друкуйте одразу.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={download}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            📄 Підготувати PDF
          </button>
        </div>
      </div>
    </div>
  );
}