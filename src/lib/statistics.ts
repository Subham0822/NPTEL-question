import { Attempt, OverallStats, Question, QuestionStats, WeekStats } from '../types';

export function getQuestionStats(
  question: Question,
  attempts: Attempt[],
  accuracyThreshold = 70
): QuestionStats {
  const qAttempts = attempts.filter((a) => a.questionId === question.id);
  const totalAttempts = qAttempts.length;

  if (totalAttempts === 0) {
    return {
      questionId: question.id,
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: 0,
      hasEverAttempted: false,
      isWeak: false,
    };
  }

  const correctAttempts = qAttempts.filter((a) => a.isCorrect).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracy = Math.round((correctAttempts / totalAttempts) * 100);

  // Sort by attemptedAt desc to get last attempt
  const sorted = [...qAttempts].sort((a, b) => b.attemptedAt - a.attemptedAt);
  const lastAttempt = sorted[0];

  // A question is considered weak if:
  // 1. Answered incorrectly at least once, OR
  // 2. Its overall accuracy is below threshold, OR
  // 3. Most recent attempt was incorrect
  const isWeak = incorrectAttempts > 0 || accuracy < accuracyThreshold || !lastAttempt.isCorrect;

  return {
    questionId: question.id,
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    accuracy,
    lastAttemptedAt: lastAttempt?.attemptedAt,
    lastSelectedAnswers: lastAttempt?.selectedAnswers || [],
    hasEverAttempted: true,
    isWeak,
    isLastCorrect: lastAttempt?.isCorrect,
  };
}

export function getWeekStats(
  weekNumber: number | 'all',
  courseQuestions: Question[],
  attempts: Attempt[]
): WeekStats {
  // Questions for this specific week or the dedicated 'all' section
  const weekQuestions = courseQuestions.filter((q) => {
    if (q.source !== 'course') return false;
    if (weekNumber === 'all') {
      return q.week === 'all' || q.week === 0;
    }
    return q.week === weekNumber;
  });
  const totalQuestions = weekQuestions.length;

  if (totalQuestions === 0) {
    return {
      week: weekNumber,
      title: weekNumber === 'all' ? 'All Questions' : `Week ${weekNumber}`,
      totalQuestions: 0,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      unattempted: 0,
      accuracy: 0,
    };
  }

  const questionIds = new Set(weekQuestions.map((q) => q.id));
  const weekAttempts = attempts.filter((a) => questionIds.has(a.questionId));

  // Determine unique attempted questions
  const attemptedQuestionIds = new Set(weekAttempts.map((a) => a.questionId));
  const attemptedCount = attemptedQuestionIds.size;
  const unattemptedCount = Math.max(0, totalQuestions - attemptedCount);

  // Count correct and incorrect based on latest attempt per question
  let correctCount = 0;
  let incorrectCount = 0;

  attemptedQuestionIds.forEach((qId) => {
    const qAtts = weekAttempts
      .filter((a) => a.questionId === qId)
      .sort((a, b) => b.attemptedAt - a.attemptedAt);
    if (qAtts[0]?.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  return {
    week: weekNumber,
    title: weekNumber === 'all' ? 'All Questions' : `Week ${weekNumber}`,
    totalQuestions,
    attempted: attemptedCount,
    correct: correctCount,
    incorrect: incorrectCount,
    unattempted: unattemptedCount,
    accuracy,
  };
}

/**
 * Returns stats specifically for the dedicated "All Questions" section.
 */
export function getAllQuestionsSectionStats(
  courseQuestions: Question[],
  attempts: Attempt[]
): WeekStats {
  return getWeekStats('all', courseQuestions, attempts);
}

/**
 * Returns stats for exactly Weeks 1 through 12.
 * Test data is strictly excluded!
 */
export function getAllWeeksStats(
  courseQuestions: Question[],
  attempts: Attempt[]
): WeekStats[] {
  const pureCourseQuestions = courseQuestions.filter((q) => q.source === 'course');
  const result: WeekStats[] = [];

  for (let w = 1; w <= 12; w++) {
    result.push(getWeekStats(w, pureCourseQuestions, attempts));
  }

  return result;
}

/**
 * Calculates combined statistics across all course questions (Weeks 1-12 and All Questions section).
 * Excludes test data!
 */
export function getOverallStats(courseQuestions: Question[], attempts: Attempt[]): OverallStats {
  const pureCourseQuestions = courseQuestions.filter((q) => q.source === 'course');
  const totalQuestions = pureCourseQuestions.length;

  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      totalAttempted: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      unattempted: 0,
      overallAccuracy: 0,
      weakQuestionsCount: 0,
    };
  }

  const questionIds = new Set(pureCourseQuestions.map((q) => q.id));
  const relevantAttempts = attempts.filter((a) => questionIds.has(a.questionId));

  const attemptedQuestionIds = new Set(relevantAttempts.map((a) => a.questionId));
  const totalAttempted = attemptedQuestionIds.size;
  const unattempted = Math.max(0, totalQuestions - totalAttempted);

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let weakCount = 0;

  pureCourseQuestions.forEach((q) => {
    const stats = getQuestionStats(q, relevantAttempts);
    if (stats.hasEverAttempted) {
      const qAtts = relevantAttempts
        .filter((a) => a.questionId === q.id)
        .sort((a, b) => b.attemptedAt - a.attemptedAt);
      if (qAtts[0]?.isCorrect) {
        totalCorrect++;
      } else {
        totalIncorrect++;
      }
    }
    if (stats.isWeak) {
      weakCount++;
    }
  });

  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return {
    totalQuestions,
    totalAttempted,
    totalCorrect,
    totalIncorrect,
    unattempted,
    overallAccuracy,
    weakQuestionsCount: weakCount,
  };
}

export function getWeakQuestions(
  courseQuestions: Question[],
  attempts: Attempt[],
  week?: number | 'all',
  accuracyThreshold = 70
): Question[] {
  let pool = courseQuestions.filter((q) => q.source === 'course');
  if (typeof week === 'number') {
    pool = pool.filter((q) => q.week === week);
  } else if (week === 'all') {
    pool = pool.filter((q) => q.week === 'all' || q.week === 0);
  }
  return pool.filter((q) => {
    const stats = getQuestionStats(q, attempts, accuracyThreshold);
    return stats.isWeak;
  });
}

export function getIncorrectQuestions(
  courseQuestions: Question[],
  attempts: Attempt[],
  week?: number | 'all'
): Question[] {
  let pool = courseQuestions.filter((q) => q.source === 'course');
  if (typeof week === 'number') {
    pool = pool.filter((q) => q.week === week);
  } else if (week === 'all') {
    pool = pool.filter((q) => q.week === 'all' || q.week === 0);
  }
  return pool.filter((q) => {
    const stats = getQuestionStats(q, attempts);
    return stats.hasEverAttempted && stats.incorrectAttempts > 0;
  });
}

export function getUnattemptedQuestions(
  courseQuestions: Question[],
  attempts: Attempt[],
  week?: number | 'all'
): Question[] {
  let pool = courseQuestions.filter((q) => q.source === 'course');
  if (typeof week === 'number') {
    pool = pool.filter((q) => q.week === week);
  } else if (week === 'all') {
    pool = pool.filter((q) => q.week === 'all' || q.week === 0);
  }
  const attemptedIds = new Set(attempts.map((a) => a.questionId));
  return pool.filter((q) => !attemptedIds.has(q.id));
}
