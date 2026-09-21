import { Question } from '../types';

import week1 from '../../data/questions/week-1.json';
import week2 from '../../data/questions/week-2.json';
import week3 from '../../data/questions/week-3.json';
import week4 from '../../data/questions/week-4.json';
import week5 from '../../data/questions/week-5.json';
import week6 from '../../data/questions/week-6.json';
import week7 from '../../data/questions/week-7.json';
import week8 from '../../data/questions/week-8.json';
import week9 from '../../data/questions/week-9.json';
import week10 from '../../data/questions/week-10.json';
import week11 from '../../data/questions/week-11.json';
import week12 from '../../data/questions/week-12.json';
import allQuestionsData from '../../data/questions/all-questions.json';
import testData from '../../data/questions/test-data.json';

// Static mapping of repository week JSON files
const WEEKS_DATA: Record<number, Question[]> = {
  1: week1 as Question[],
  2: week2 as Question[],
  3: week3 as Question[],
  4: week4 as Question[],
  5: week5 as Question[],
  6: week6 as Question[],
  7: week7 as Question[],
  8: week8 as Question[],
  9: week9 as Question[],
  10: week10 as Question[],
  11: week11 as Question[],
  12: week12 as Question[],
};

/**
 * Returns questions for a specific course week (1–12).
 * Attaches the week number to each question.
 */
export function getWeekQuestions(weekNumber: number): Question[] {
  const list = WEEKS_DATA[weekNumber] || [];
  return list.map((q) => ({
    ...q,
    week: weekNumber,
  }));
}

/**
 * Returns questions from the separate "All Questions" section (data/questions/all-questions.json).
 * This is an independent section with its own distinct question repository file.
 */
export function getAllQuestionsSection(): Question[] {
  return (allQuestionsData as Question[]).map((q) => ({
    ...q,
    week: 'all', // Separate section
  }));
}

/**
 * Returns count of questions in the separate "All Questions" section.
 */
export function getAllQuestionsCount(): number {
  return (allQuestionsData as Question[]).length;
}

/**
 * Returns all weekly questions (Weeks 1-12) if needed for global search.
 */
export function getAllWeeklyQuestions(): Question[] {
  const list: Question[] = [];
  for (let w = 1; w <= 12; w++) {
    const weekQs = getWeekQuestions(w);
    list.push(...weekQs);
  }
  return list;
}

/**
 * Test data kept completely separate in test-data.json.
 * Test data does NOT appear in Week 1..12 or All Questions.
 */
export function getTestData(): Question[] {
  return (testData as Question[]).map((q) => ({ ...q }));
}

/**
 * Returns question counts per week module.
 */
export function getCourseWeekCounts(): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let w = 1; w <= 12; w++) {
    counts[w] = (WEEKS_DATA[w] || []).length;
  }
  return counts;
}

/**
 * Returns total course question count across all 12 weeks.
 */
export function getTotalCourseQuestionCount(): number {
  let total = 0;
  for (let w = 1; w <= 12; w++) {
    total += (WEEKS_DATA[w] || []).length;
  }
  return total;
}

// Aliases for convenience & backward compatibility
export const getQuestionsForWeek = getWeekQuestions;
export const getAllCourseQuestions = getAllQuestionsSection; // Points to the separate All Questions section
export const getTestDataQuestions = getTestData;
export const getTotalCourseQuestionsCount = getTotalCourseQuestionCount;
