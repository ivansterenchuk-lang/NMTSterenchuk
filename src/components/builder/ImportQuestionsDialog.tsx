import { useState } from 'react';
import { AlertTriangle, FileUp, Loader2, X } from 'lucide-react';
import { readImportFile } from '@/lib/questionImport';
import type { MatchingQuestion, ScoringPreset } from '@/types/test';

interface ImportQuestionsDialogProps {
  scoringPreset: ScoringPreset;
  onImport: (questions: MatchingQuestion[]) => void;
  onClose: () => void;
}

const ACCEPTED_TYPES = '.txt,.csv';

export default function ImportQuestionsDialog({ scoringPreset, onImport, onClose }: ImportQuestionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MatchingQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [readError, setReadError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setReadError(null);
    setQuestions([]);
    setErrors([]);
    try {
      const result = await readImportFile(file, scoringPreset);
      setQuestions(result.questions);
      setErrors(result.errors);
    } catch {
      setReadError('Не вдалося прочитати файл. Перевірте, що це .txt або .csv.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-questions-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-teal-700">Імпорт</p>
            <h2 id="import-questions-title" className="mt-1 text-xl font-semibold text-slate-900">
              Імпортувати питання
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Формат файлу</p>
            <p className="mt-2">
              У текстовому файлі (.txt) кожне питання починається з рядка «Питання: текст», далі кожна пара в окремому
              рядку у вигляді «ліво - право», наприклад «1 - А». Рядок «- Д» додає відповідь без пари (відволікаючу).
            </p>
            <p className="mt-2">
              У таблиці (.csv, у Excel або Google Sheets: «Зберегти як» - CSV) три колонки: питання, ліва частина, права
              частина. Рядки з однаковим текстом питання належать одному завданню.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 px-6 py-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/50">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-teal-600" /> : <FileUp className="h-6 w-6 text-teal-600" />}
            <span className="text-sm font-medium text-slate-800">
              {fileName ? fileName : 'Оберіть файл .txt або .csv'}
            </span>
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>

          {readError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {readError}
            </p>
          )}

          {!loading && fileName && !readError && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">
                Знайдено питань: {questions.length}
              </p>
              {questions.length > 0 && (
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {questions.map((question) => (
                    <li key={question.id} className="px-4 py-3 text-sm">
                      <p className="font-medium text-slate-900">{question.prompt}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Пар: {question.leftItems.length}, варіантів: {question.rightItems.length}, балів: {question.maxScore}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {errors.length > 0 && (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Пропущено: {errors.length}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Скасувати
          </button>
          <button
            type="button"
            disabled={loading || questions.length === 0}
            onClick={() => onImport(questions)}
            className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Додати до тесту ({questions.length})
          </button>
        </div>
      </div>
    </div>
  );
}
