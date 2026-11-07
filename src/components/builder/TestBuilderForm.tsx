import { useState } from 'react';
import { AlertTriangle, ArrowLeft, FileUp, Loader2, Plus, Save } from 'lucide-react';
import ImportQuestionsDialog from '@/components/builder/ImportQuestionsDialog';
import MatchingQuestionEditor from '@/components/builder/MatchingQuestionEditor';
import NotebookQuestionEditor from '@/components/builder/NotebookQuestionEditor';
import ScoringPresetPicker from '@/components/builder/ScoringPresetPicker';
import TimeLimitSettings from '@/components/builder/TimeLimitSettings';
import { createItemId } from '@/lib/matching';
import { getQuestionErrors } from '@/lib/questionRules';
import { MAX_TIME_LIMIT_MINUTES } from '@/lib/countdown';
import { createTest, updateTest } from '@/lib/testRepository';
import { navigate } from '@/lib/router';
import {
  NMT_MATCHING_MAX_SCORE,
  NMT_TEST_MAX_SCORE,
  getTestMaxScore,
} from '@/lib/scoring';
import type { MatchingQuestion, NotebookQuestion, Question, ScoringPreset, Test } from '@/types/test';

interface TestBuilderFormProps {
  initialTest: Test | null;
}

function createMatchingQuestion(scoringPreset: ScoringPreset): MatchingQuestion {
  return {
    id: createItemId(),
    type: 'matching',
    prompt: '',
    leftItems: [],
    rightItems: [],
    correctPairs: {},
    maxScore: scoringPreset === 'nmt' ? NMT_MATCHING_MAX_SCORE : 1,
    scoringMode: 'partial',
  };
}

function createNotebookQuestion(): NotebookQuestion {
  return { id: createItemId(), type: 'notebook', prompt: '', maxScore: 1 };
}

export default function TestBuilderForm({ initialTest }: TestBuilderFormProps) {
  const [title, setTitle] = useState(initialTest?.title ?? '');
  const [topic, setTopic] = useState(initialTest?.topic ?? '');
  const [scoringPreset, setScoringPreset] = useState<ScoringPreset>(initialTest?.scoring_preset ?? 'custom');
  const [questions, setQuestions] = useState<Question[]>(initialTest?.questions ?? []);
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(initialTest?.time_limit_minutes != null);
  const [timeLimitInput, setTimeLimitInput] = useState(String(initialTest?.time_limit_minutes ?? 30));
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const totalMaxScore = getTestMaxScore(questions);
  const nmtMismatch = scoringPreset === 'nmt' && totalMaxScore !== NMT_TEST_MAX_SCORE;

  const updateQuestion = (id: string, next: Question) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? next : q)));

  const removeQuestion = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const handlePresetChange = (preset: ScoringPreset) => {
    setScoringPreset(preset);
    if (preset === 'nmt') {
      setQuestions((prev) =>
        prev.map((q) => (q.type === 'matching' ? { ...q, maxScore: NMT_MATCHING_MAX_SCORE } : q)),
      );
    }
  };

  const handleSave = async () => {
    setSaveError(null);

    if (!title.trim()) {
      setSaveError('Додайте назву тесту.');
      return;
    }
    if (questions.length === 0) {
      setSaveError('Додайте хоча б одне питання.');
      return;
    }
    const hasErrors = questions.some((q) => getQuestionErrors(q).length > 0);
    if (hasErrors) {
      setSaveError('Виправте помилки у питаннях перед збереженням.');
      return;
    }

    const timeLimitMinutes = timeLimitEnabled ? Number(timeLimitInput) : null;
    if (timeLimitMinutes !== null && (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes < 1 || timeLimitMinutes > MAX_TIME_LIMIT_MINUTES)) {
      setSaveError(`Вкажіть ліміт часу від 1 до ${MAX_TIME_LIMIT_MINUTES} хвилин.`);
      return;
    }

    setSaving(true);
    try {
      const input = { title: title.trim(), questions, scoringPreset, timeLimitMinutes, topic: topic.trim() || null };
      if (initialTest) {
        await updateTest(initialTest.id, input);
      } else {
        await createTest(input);
      }
      navigate('/tests');
    } catch {
      setSaveError('Не вдалося зберегти тест. Спробуйте ще раз.');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/tests')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        До списку тестів
      </button>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">
            {initialTest ? 'Редагування тесту' : 'Новий тест'}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Конструктор тесту</h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Зберегти тест
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Назва тесту</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Наприклад: Географія, 7 клас"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </label>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-slate-700">Предмет або тема</span>
          <input
            type="text"
            value={topic}
            maxLength={80}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Наприклад: Історія України, Середньовіччя"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <span className="mt-1.5 block text-xs text-slate-500">Використовується в аналітиці за темами</span>
        </label>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <ScoringPresetPicker value={scoringPreset} onChange={handlePresetChange} />
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-teal-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-800">Максимальний бал тесту</p>
            <p className="mt-0.5 text-xs text-teal-700">Сума балів за всі питання</p>
          </div>
          <p className="text-3xl font-semibold text-slate-900">
            {totalMaxScore}
            {scoringPreset === 'nmt' && (
              <span className="ml-2 text-base font-normal text-slate-500">з {NMT_TEST_MAX_SCORE}</span>
            )}
          </p>
        </div>

        {nmtMismatch && (
          <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              За стандартом НМТ тест має мати {NMT_TEST_MAX_SCORE} балів. Зараз їх {totalMaxScore}. Конструктор поки
              підтримує лише завдання на відповідність, тому повний набір НМТ зібрати ще не можна.
            </span>
          </p>
        )}

        <TimeLimitSettings
          enabled={timeLimitEnabled}
          minutes={timeLimitInput}
          onToggle={setTimeLimitEnabled}
          onMinutesChange={setTimeLimitInput}
        />
      </div>

      <div className="mt-6 space-y-6">
        {questions.map((question, index) =>
          question.type === 'matching' ? (
            <MatchingQuestionEditor
              key={question.id}
              question={question}
              index={index}
              scoringPreset={scoringPreset}
              onChange={(next) => updateQuestion(question.id, next)}
              onRemove={() => removeQuestion(question.id)}
            />
          ) : (
            <NotebookQuestionEditor
              key={question.id}
              question={question}
              index={index}
              onChange={(next) => updateQuestion(question.id, next)}
              onRemove={() => removeQuestion(question.id)}
            />
          ),
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setQuestions((prev) => [...prev, createMatchingQuestion(scoringPreset)])}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-5 text-sm font-medium text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-700"
        >
          <Plus className="h-4 w-4" />
          Додати питання: Встановлення відповідності
        </button>
        <button
          type="button"
          onClick={() => setQuestions((prev) => [...prev, createNotebookQuestion()])}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-5 text-sm font-medium text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-700"
        >
          <Plus className="h-4 w-4" />
          Додати питання: Розв'язання в зошиті
        </button>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-5 text-sm font-medium text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-700"
        >
          <FileUp className="h-4 w-4" />
          Імпортувати питання
        </button>
      </div>

      {importOpen && (
        <ImportQuestionsDialog
          scoringPreset={scoringPreset}
          onClose={() => setImportOpen(false)}
          onImport={(imported) => {
            setQuestions((prev) => [...prev, ...imported]);
            setImportOpen(false);
          }}
        />
      )}

      {saveError && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {saveError}
        </p>
      )}
    </div>
  );
}
