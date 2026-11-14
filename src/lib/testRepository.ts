import { createItemId } from '@/lib/matching';
import { getQuestionContentKey, isMatchingQuestion, scoreQuestion } from '@/lib/questionRules';
import { NMT_MATCHING_MAX_SCORE } from '@/lib/scoring';
import { supabase } from '@/lib/supabase';
import type {
  Answers,
  NotebookReviews,
  NotebookWork,
  Question,
  ScoringPreset,
  Test,
  TestAttempt,
} from '@/types/test';

export interface TestInput {
  title: string;
  questions: Question[];
  scoringPreset: ScoringPreset;
  timeLimitMinutes: number | null;
  topic: string | null;
}

const TEST_COLUMNS = 'id, title, questions, scoring_preset, time_limit_minutes, topic, owner_id, created_at';
const ATTEMPT_COLUMNS =
  'id, test_id, session_id, student_name, answers, notebooks, notebook_reviews, score, max_score, created_at';

export async function fetchTests(): Promise<Test[]> {
  const { data, error } = await supabase! // 🔥 Додано !
    .from('tests')
    .select(TEST_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Test[];
}

export async function fetchTest(id: string): Promise<Test | null> {
  const { data, error } = await supabase! // 🔥 Додано !
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Test | null) ?? null;
}

export async function createTest(input: TestInput): Promise<Test> {
  const { data, error } = await supabase! // 🔥 Додано !
    .from('tests')
    .insert({
      title: input.title,
      questions: input.questions,
      scoring_preset: input.scoringPreset,
      time_limit_minutes: input.timeLimitMinutes,
      topic: input.topic,
    })
    .select(TEST_COLUMNS)
    .single();
  if (error) throw error;
  return data as Test;
}

export async function updateTest(id: string, input: TestInput): Promise<void> {
  const { error } = await supabase! // 🔥 Додано !
    .from('tests')
    .update({
      title: input.title,
      questions: input.questions,
      scoring_preset: input.scoringPreset,
      time_limit_minutes: input.timeLimitMinutes,
      topic: input.topic,
    })
    .eq('id', id);
  if (error) throw error;
}

// 🔥 НОВА ФУНКЦІЯ: Оновлення лише назви тесту
export async function updateTestTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase! // 🔥 Додано !
    .from('tests')
    .update({ title })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTest(id: string): Promise<void> {
  const { error } = await supabase!.from('tests').delete().eq('id', id); // 🔥 Додано !
  if (error) throw error;
}

export async function fetchTestAttempts(testId: string, sessionId?: string): Promise<TestAttempt[]> {
  let query = supabase! // 🔥 Додано !
    .from('test_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('test_id', testId);
  if (sessionId) query = query.eq('session_id', sessionId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TestAttempt[];
}

export async function fetchAttemptsForTests(testIds: string[]): Promise<TestAttempt[]> {
  if (testIds.length === 0) return [];
  const { data, error } = await supabase! // 🔥 Додано !
    .from('test_attempts')
    .select(ATTEMPT_COLUMNS)
    .in('test_id', testIds);
  if (error) throw error;
  return (data ?? []) as TestAttempt[];
}

export async function appendQuestionToTest(testId: string, question: Question): Promise<'added' | 'duplicate'> {
  const target = await fetchTest(testId);
  if (!target) throw new Error('Test not found');

  const contentKey = getQuestionContentKey(question);
  if (target.questions.some((existing) => getQuestionContentKey(existing) === contentKey)) {
    return 'duplicate';
  }

  const copy: Question = {
    ...question,
    id: createItemId(),
    maxScore:
      isMatchingQuestion(question) && target.scoring_preset === 'nmt' ? NMT_MATCHING_MAX_SCORE : question.maxScore,
  };
  const { error } = await supabase! // 🔥 Додано !
    .from('tests')
    .update({ questions: [...target.questions, copy] })
    .eq('id', testId);
  if (error) throw error;
  return 'added';
}

export async function saveTestAttempt(attempt: {
  testId: string;
  sessionId: string | null;
  studentName: string;
  answers: Answers;
  notebooks: NotebookWork;
  score: number;
  maxScore: number;
}): Promise<void> {
  const { error } = await supabase!.from('test_attempts').insert({ // 🔥 Додано !
    test_id: attempt.testId,
    session_id: attempt.sessionId,
    student_name: attempt.studentName,
    answers: attempt.answers,
    notebooks: attempt.notebooks,
    score: attempt.score,
    max_score: attempt.maxScore,
  });
  if (error) throw error;
}

export async function saveNotebookReviews(
  attempt: TestAttempt,
  test: Test,
  reviews: NotebookReviews,
): Promise<TestAttempt> {
  const score = test.questions.reduce(
    (total, question) => total + scoreQuestion(question, attempt.answers, reviews).score,
    0,
  );
  const { data, error } = await supabase! // 🔥 Додано !
    .from('test_attempts')
    .update({ notebook_reviews: reviews, score })
    .eq('id', attempt.id)
    .select(ATTEMPT_COLUMNS)
    .single();
  if (error) throw error;
  return data as TestAttempt;
}