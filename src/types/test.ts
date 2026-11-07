export interface MatchingItem {
  id: string;
  text: string;
}

export type ScoringMode = 'partial' | 'all_or_nothing';

export type ScoringPreset = 'nmt' | 'custom';

export interface MatchingQuestion {
  id: string;
  type: 'matching';
  prompt: string;
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  correctPairs: Record<string, string>;
  maxScore: number;
  scoringMode: ScoringMode;
}

export interface NotebookQuestion {
  id: string;
  type: 'notebook';
  prompt: string;
  maxScore: number;
}

export type Question = MatchingQuestion | NotebookQuestion;

export type NotebookTool = 'pen' | 'eraser' | 'line' | 'circle' | 'triangle' | 'text';

export interface NotebookPoint {
  x: number;
  y: number;
}

interface NotebookStrokeBase {
  color: string;
  width: number;
}

export type NotebookStroke =
  | (NotebookStrokeBase & { kind: 'pen'; eraser: boolean; points: NotebookPoint[] })
  | (NotebookStrokeBase & { kind: 'line' | 'circle' | 'triangle'; from: NotebookPoint; to: NotebookPoint })
  | (NotebookStrokeBase & { kind: 'text'; at: NotebookPoint; text: string });

export interface NotebookPage {
  strokes: NotebookStroke[];
}

export type NotebookWork = Record<string, NotebookPage>;

export interface NotebookReview {
  score: number | null;
  annotations: NotebookStroke[];
}

export type NotebookReviews = Record<string, NotebookReview>;

export interface Test {
  id: string;
  title: string;
  questions: Question[];
  scoring_preset: ScoringPreset;
  time_limit_minutes: number | null;
  topic: string | null;
  owner_id: string | null;
  created_at: string;
}

export type MatchingAnswer = Record<string, string>;

export type Answers = Record<string, MatchingAnswer>;

export interface TestAttempt {
  id: string;
  test_id: string;
  session_id: string | null;
  student_name: string;
  answers: Answers;
  notebooks: NotebookWork;
  notebook_reviews: NotebookReviews;
  score: number;
  max_score: number;
  created_at: string;
}

export interface Session {
  id: string;
  test_id: string;
  code: string;
  is_active: boolean;
  expires_at: string | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  created_at: string;
}

export interface SessionShuffleOptions {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface BasketItem {
  id: string;
  question_id: string;
  question: Question;
  source_test_title: string;
  created_at: string;
}
