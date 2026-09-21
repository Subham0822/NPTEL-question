export type QuestionType = 'single' | 'multiple';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: [string, string, string, string] | string[];
  correctAnswers: string[]; // e.g. ["A"] or ["A", "C"]
  explanation?: string;
  week?: number | 'all'; // Week number (1-12) or 'all' for All Questions section
}

export interface ParsedQuestionCandidate {
  id?: string;
  question: string;
  type: QuestionType;
  options: [string, string, string, string];
  correctAnswers: string[];
  explanation?: string;
  week?: number | 'all';
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
  week: number | 'all' | 'test'; // 1-12 for specific week, 'all' for All Questions, 'test' for Test Data
  mode: 'practice' | 'exam';
  questionCount: number | 'all';
  order: 'sequential' | 'random';
  shuffleOptions: boolean;
  timerMinutes: number; // 0 for no timer
  typeFilter?: 'all' | 'single' | 'multiple';
}
