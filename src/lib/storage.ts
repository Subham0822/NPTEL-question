import { Attempt, Question, QuizSession, ParsedQuestionCandidate, QuestionSource } from '../types';
import { TEST_QUESTIONS } from '../data/seedQuestions';

const STORAGE_KEYS = {
  QUESTIONS: 'nptel_cybersec_questions_v2',
  ATTEMPTS: 'nptel_cybersec_attempts_v2',
  SESSIONS: 'nptel_cybersec_sessions_v2',
  INITIALIZED: 'nptel_cybersec_initialized_v2',
  LEGACY_QUESTIONS: 'nptel_cybersec_questions_v1',
  LEGACY_ATTEMPTS: 'nptel_cybersec_attempts_v1',
};

function generateId(prefix: string = 'q'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Normalizes any legacy or unmigrated question to the new Question schema.
 */
function normalizeQuestion(raw: any): Question {
  const isTest = raw.source === 'test' || raw.isSample === true || (raw.id && String(raw.id).startsWith('seed_'));
  const source: QuestionSource = isTest ? 'test' : (raw.source || 'course');
  let week: number | 'all' | null = null;
  if (source === 'course') {
    if (raw.week === 'all' || raw.week === 0) {
      week = 'all';
    } else if (typeof raw.week === 'number' && raw.week >= 1 && raw.week <= 12) {
      week = raw.week;
    } else {
      week = 1;
    }
  }

  // Normalize correctAnswers array
  let correctAnswers: string[] = [];
  if (Array.isArray(raw.correctAnswers) && raw.correctAnswers.length > 0) {
    correctAnswers = raw.correctAnswers;
  } else if (raw.correctAnswer) {
    correctAnswers = [raw.correctAnswer];
  } else if (raw.options && raw.options.length > 0) {
    correctAnswers = [raw.options[0]];
  }

  const type = raw.type === 'multiple' || correctAnswers.length >= 2 ? 'multiple' : 'single';

  return {
    id: raw.id || generateId(source === 'test' ? 'test_q' : 'q'),
    source,
    week,
    question: raw.question || '',
    type,
    options: raw.options || ['', '', '', ''],
    correctAnswers,
    explanation: raw.explanation || undefined,
    createdAt: raw.createdAt || Date.now(),
  };
}

export function initializeStorageIfNeeded(): void {
  if (typeof window === 'undefined') return;

  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized) return;

  // Check if legacy data exists from v1
  const legacyData = localStorage.getItem(STORAGE_KEYS.LEGACY_QUESTIONS);
  let questionsToSave: Question[] = [];

  if (legacyData) {
    try {
      const parsedLegacy = JSON.parse(legacyData);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        questionsToSave = parsedLegacy.map((item) => normalizeQuestion(item));
      }
    } catch (e) {
      console.error('Failed to migrate legacy questions:', e);
    }
  }

  // Ensure initial TEST_QUESTIONS exist in test data
  const hasTestQuestions = questionsToSave.some((q) => q.source === 'test');
  if (!hasTestQuestions) {
    questionsToSave = [...TEST_QUESTIONS, ...questionsToSave];
  }

  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questionsToSave));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

export function getQuestions(): Question[] {
  if (typeof window === 'undefined') return [];
  initializeStorageIfNeeded();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.map(normalizeQuestion) : [];
  } catch (e) {
    console.error('Failed to parse questions from storage:', e);
    return [];
  }
}

/**
 * Returns ONLY genuine Course questions (Weeks 1–12 and the dedicated All Questions section).
 * Test Data questions (source === 'test') are strictly excluded!
 */
export function getCourseQuestions(): Question[] {
  return getQuestions().filter((q) => q.source === 'course');
}

/**
 * Returns questions belonging to the dedicated "All Questions" section.
 */
export function getAllQuestionsSectionQuestions(): Question[] {
  return getQuestions().filter(
    (q) => q.source === 'course' && (q.week === 'all' || q.week === 0)
  );
}

/**
 * Returns ONLY Test Data questions (source === 'test').
 */
export function getTestQuestions(): Question[] {
  return getQuestions().filter((q) => q.source === 'test');
}

/**
 * Synchronizes state with backend directory files (/data/questions.json, /data/attempts.json).
 */
export async function syncToServer(data: {
  questions?: Question[];
  attempts?: Attempt[];
  sessions?: QuizSession[];
}): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    // Offline / fallback
  }
}

export async function fetchDirectoryData(): Promise<{ questions: Question[]; attempts: Attempt[] } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.questions)) {
      if (data.questions.length > 0) {
        saveQuestions(data.questions, false);
      } else {
        const local = getQuestions();
        if (local.length > 0) {
          syncToServer({ questions: local, attempts: getAttempts() });
        }
      }
      if (Array.isArray(data.attempts) && data.attempts.length > 0) {
        saveAttempts(data.attempts, false);
      }
      return {
        questions: getQuestions(),
        attempts: getAttempts(),
      };
    }
  } catch (e) {
    // Server not reached, fallback to local storage
  }
  return null;
}

export function saveQuestions(questions: Question[], sync = true): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  if (sync) {
    syncToServer({ questions });
  }
}

/**
 * Adds questions to storage.
 * If source === 'course', week must be 1–12.
 * If source === 'test', week is set to null.
 */
export function addQuestions(
  candidates: (ParsedQuestionCandidate | Omit<Question, 'id' | 'createdAt'>)[],
  source: QuestionSource = 'course'
): Question[] {
  const current = getQuestions();
  const created: Question[] = candidates.map((cand) => {
    const correctAnswers =
      Array.isArray((cand as any).correctAnswers) && (cand as any).correctAnswers.length > 0
        ? (cand as any).correctAnswers
        : (cand as any).correctAnswer
        ? [(cand as any).correctAnswer]
        : [];

    const type = (cand as any).type || (correctAnswers.length >= 2 ? 'multiple' : 'single');
    let week: number | 'all' | null = null;
    if (source === 'course') {
      if (cand.week === 'all' || cand.week === 0) {
        week = 'all';
      } else if (typeof cand.week === 'number' && cand.week >= 1 && cand.week <= 12) {
        week = cand.week;
      } else {
        week = 1;
      }
    }

    return {
      id: generateId(source === 'test' ? 'test_q' : 'q'),
      source,
      week,
      question: cand.question,
      type,
      options: cand.options,
      correctAnswers,
      explanation: cand.explanation,
      createdAt: Date.now(),
    };
  });

  const updated = [...current, ...created];
  saveQuestions(updated);
  return created;
}

export function updateQuestion(id: string, updates: Partial<Question>): Question | null {
  const current = getQuestions();
  const index = current.findIndex((q) => q.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updatedQuestion: Question = normalizeQuestion({
    ...existing,
    ...updates,
    // Maintain source integrity
    source: updates.source || existing.source,
    week: (updates.source || existing.source) === 'test' ? null : (updates.week !== undefined ? updates.week : existing.week),
  });

  current[index] = updatedQuestion;
  saveQuestions(current);
  return updatedQuestion;
}

export function deleteQuestion(id: string): boolean {
  return deleteQuestions([id]);
}

export function deleteQuestions(ids: string[]): boolean {
  if (!ids || ids.length === 0) return false;
  const idSet = new Set(ids);
  const current = getQuestions();
  const filtered = current.filter((q) => !idSet.has(q.id));
  if (filtered.length === current.length) return false;

  saveQuestions(filtered);

  // Clean up attempts for these questions
  const attempts = getAttempts().filter((a) => !idSet.has(a.questionId));
  saveAttempts(attempts);
  return true;
}

export function getAttempts(): Attempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed)
      ? parsed.map((att) => ({
          ...att,
          selectedAnswers: Array.isArray(att.selectedAnswers)
            ? att.selectedAnswers
            : att.selectedAnswer
            ? [att.selectedAnswer]
            : [],
        }))
      : [];
  } catch (e) {
    console.error('Failed to parse attempts from storage:', e);
    return [];
  }
}

/**
 * Returns attempts only for Course questions (excludes test questions).
 */
export function getCourseAttempts(): Attempt[] {
  const courseQuestions = getCourseQuestions();
  const courseQIds = new Set(courseQuestions.map((q) => q.id));
  return getAttempts().filter((att) => courseQIds.has(att.questionId));
}

/**
 * Returns attempts only for Test Data questions.
 */
export function getTestAttempts(): Attempt[] {
  const testQuestions = getTestQuestions();
  const testQIds = new Set(testQuestions.map((q) => q.id));
  return getAttempts().filter((att) => testQIds.has(att.questionId));
}

export function saveAttempts(attempts: Attempt[], sync = true): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  if (sync) {
    syncToServer({ attempts });
  }
}

export function recordAttempt(
  questionId: string,
  week: number | 'all' | null,
  selectedAnswers: string[] | string,
  isCorrect: boolean,
  source: QuestionSource = 'course'
): Attempt {
  const normalizedAnswers = Array.isArray(selectedAnswers) ? selectedAnswers : [selectedAnswers];

  const attempt: Attempt = {
    id: 'att_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    questionId,
    selectedAnswers: normalizedAnswers,
    isCorrect,
    attemptedAt: Date.now(),
    week,
    source,
  };

  const attempts = getAttempts();
  attempts.push(attempt);
  saveAttempts(attempts);
  return attempt;
}

export function getSessions(): QuizSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse sessions from storage:', e);
    return [];
  }
}

export function saveSession(session: QuizSession): void {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

/**
 * Resets user attempts and scores for a specific week or 'all' section, keeping questions intact.
 */
export function resetWeekProgress(weekNumber: number | 'all'): void {
  const attempts = getAttempts().filter((a) => {
    if (weekNumber === 'all') {
      return a.week !== 'all' && a.week !== 0;
    }
    return a.week !== weekNumber;
  });
  saveAttempts(attempts);

  const sessions = getSessions().filter((s) => s.week !== weekNumber);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

/**
 * Resets all progress (attempts and quiz sessions) across all course weeks without deleting questions.
 */
export function resetAllCourseProgress(): void {
  if (typeof window === 'undefined') return;
  // Keep only test attempts
  const testAttempts = getTestAttempts();
  saveAttempts(testAttempts);

  // Keep only test sessions
  const sessions = getSessions().filter((s) => s.week === 'test');
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export const resetAllProgress = resetAllCourseProgress;

/**
 * Restores test/seed questions
 */
export function restoreSeedQuestions(): void {
  const current = getCourseQuestions();
  saveQuestions([...current, ...TEST_QUESTIONS]);
}

/**
 * Resets Test Data back to default sample questions and clears test attempts.
 */
export function resetTestData(): void {
  const courseQuestions = getCourseQuestions();
  saveQuestions([...courseQuestions, ...TEST_QUESTIONS]);

  // Remove test attempts
  const courseAttempts = getCourseAttempts();
  saveAttempts(courseAttempts);

  const courseSessions = getSessions().filter((s) => s.week !== 'test');
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(courseSessions));
}

/**
 * Imports test questions into an actual course week (e.g. Week 1) for quick verification.
 */
export function importTestDataToWeek(targetWeek: number): Question[] {
  const testQuestions = getTestQuestions();
  const candidates: ParsedQuestionCandidate[] = testQuestions.map((tq) => ({
    week: targetWeek,
    type: tq.type,
    question: tq.question,
    options: tq.options as [string, string, string, string],
    correctAnswers: tq.correctAnswers,
    explanation: tq.explanation,
  }));
  return addQuestions(candidates, 'course');
}

/**
 * Factory reset: clears all questions and progress, restoring initial state.
 */
export function factoryReset(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  initializeStorageIfNeeded();
}

/**
 * Exports data as formatted JSON.
 */
export function exportDataAsJSON(): string {
  const questions = getQuestions();
  const attempts = getAttempts();
  const sessions = getSessions();

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 2,
      courseQuestions: questions.filter((q) => q.source === 'course'),
      testQuestions: questions.filter((q) => q.source === 'test'),
      attempts,
      sessions,
    },
    null,
    2
  );
}

/**
 * Imports data from JSON backup.
 */
export function importDataFromJSON(jsonString: string): {
  importedQuestions: number;
  importedAttempts: number;
} {
  const parsed = JSON.parse(jsonString);

  let newQuestions: Question[] = [];
  if (Array.isArray(parsed.courseQuestions) || Array.isArray(parsed.testQuestions)) {
    const courses = Array.isArray(parsed.courseQuestions) ? parsed.courseQuestions.map(normalizeQuestion) : [];
    const tests = Array.isArray(parsed.testQuestions) ? parsed.testQuestions.map(normalizeQuestion) : [];
    newQuestions = [...courses, ...tests];
  } else if (Array.isArray(parsed.questions)) {
    newQuestions = parsed.questions.map(normalizeQuestion);
  }

  saveQuestions(newQuestions);

  let newAttempts: Attempt[] = [];
  if (Array.isArray(parsed.attempts)) {
    newAttempts = parsed.attempts.map((a: any) => ({
      ...a,
      selectedAnswers: Array.isArray(a.selectedAnswers) ? a.selectedAnswers : a.selectedAnswer ? [a.selectedAnswer] : [],
    }));
    saveAttempts(newAttempts);
  }

  if (Array.isArray(parsed.sessions)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(parsed.sessions));
  }

  return {
    importedQuestions: newQuestions.length,
    importedAttempts: newAttempts.length,
  };
}
