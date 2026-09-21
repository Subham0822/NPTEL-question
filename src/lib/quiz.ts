import { Question, QuizConfig } from '../types';

/**
 * Shuffles an array immutably using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Prepares questions for a quiz session based on user configuration.
 * - Filters by question type if requested
 * - Shuffles question order if configured
 * - Shuffles option order per question if configured
 * - Slices to requested count
 */
export function prepareQuizQuestions(
  pool: Question[],
  config: QuizConfig
): Question[] {
  let list = [...pool];

  // Filter by question type if specified
  if (config.typeFilter && config.typeFilter !== 'all') {
    list = list.filter((q) => q.type === config.typeFilter);
  }

  // Randomize question order if requested
  if (config.order === 'random') {
    list = shuffleArray(list);
  }

  // Cap question count if specified
  if (config.questionCount !== 'all' && typeof config.questionCount === 'number') {
    list = list.slice(0, config.questionCount);
  }

  // Shuffle options if requested (preserving correctAnswers strings)
  if (config.shuffleOptions) {
    list = list.map((q) => {
      const shuffledOptions = shuffleArray([...q.options]) as [string, string, string, string];
      return {
        ...q,
        options: shuffledOptions,
      };
    });
  }

  return list;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
