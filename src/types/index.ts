export type QuestionType = 'single' | 'multiple';
export type QuestionSource = 'course' | 'test';

export interface Question {
  id: string;
  source: QuestionSource;
  week: number | 'all' | null; // 1-12 for course weeks, 'all' for the dedicated All Questions section, null for test questions
  question: string;
  type: QuestionType;
  options: [string, string, string, string] | string[];
  correctAnswers: string[]; // Array of strings (e.g. ['B'] or ['A', 'C', 'D'])
  explanation?: string;
  createdAt: number;
}

export interface Attempt {
  id: string;
  questionId: string;
  selectedAnswers: string[]; // Array of selected answers
  isCorrect: boolean;
  attemptedAt: number;
  week: number | 'all' | null;
  source?: QuestionSource;
}

export interface QuizSession {
  id: string;
  week: number | 'all' | 'combined' | 'weak' | 'incorrect' | 'unattempted' | 'test';
  mode: 'practice' | 'exam';
  score: number;
  totalQuestions: number;
  startedAt: number;
  completedAt?: number;
  durationSeconds?: number;
  answers: Record<string, {
    selectedAnswers: string[];
    isCorrect: boolean;
  }>;
}

export interface QuestionStats {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number;
  lastAttemptedAt?: number;
  lastSelectedAnswers?: string[];
  hasEverAttempted: boolean;
  isWeak: boolean;
  isLastCorrect?: boolean;
}

export interface WeekStats {
  week: number | 'all';
  title?: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
}

export interface OverallStats {
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  unattempted: number;
  overallAccuracy: number;
  weakQuestionsCount: number;
}

export interface ParsedQuestionCandidate {
  question: string;
  type: QuestionType;
  options: [string, string, string, string];
  correctAnswers: string[];
  explanation?: string;
  week: number | 'all';
}

export interface ParseError {
  index: number;
  title: string;
  reason: string;
  rawSnippet: string;
}

export interface ParseResult {
  validQuestions: ParsedQuestionCandidate[];
  errors: ParseError[];
}

export interface QuizConfig {
  week: number | 'all' | 'combined' | 'test';
  mode: 'practice' | 'exam';
  questionCount: number | 'all';
  order: 'sequential' | 'random';
  shuffleOptions: boolean;
  timerMinutes: number; // 0 for no timer
  typeFilter?: 'all' | 'single' | 'multiple';
}
