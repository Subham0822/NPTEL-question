import React, { useEffect, useCallback } from 'react';
import { Question } from '../types';
import { AnswerOption } from './AnswerOption';
import { ProgressBar } from './ProgressBar';
import { formatTime } from '../lib/quiz';
import { validateAnswers } from '../lib/parser';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  XCircle,
  LogOut,
  Layers,
  CheckSquare,
} from 'lucide-react';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  mode: 'practice' | 'exam';
  weekLabel: string;
  selectedAnswers: string[];
  isSubmitted: boolean; // only used in practice mode per-question
  timerSecondsRemaining: number | null;
  onToggleOption: (optionText: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onPreviousQuestion?: () => void;
  onFinishExam?: () => void;
  onExitQuiz: () => void;
  isLastQuestion: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  currentIndex,
  totalQuestions,
  mode,
  weekLabel,
  selectedAnswers,
  isSubmitted,
  timerSecondsRemaining,
  onToggleOption,
  onSubmitAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onFinishExam,
  onExitQuiz,
  isLastQuestion,
}) => {
  const isPracticeMode = mode === 'practice';
  const isMultiple = question.type === 'multiple';
  const isCorrect = validateAnswers(selectedAnswers, question.correctAnswers);

  // Keyboard shortcut listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Keys 1 to 4: toggle/select option
      if (['1', '2', '3', '4'].includes(e.key)) {
        if (!isSubmitted || !isPracticeMode) {
          const index = parseInt(e.key, 10) - 1;
          if (question.options[index]) {
            e.preventDefault();
            onToggleOption(question.options[index]);
          }
        }
      }

      // Enter key
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isPracticeMode) {
          if (!isSubmitted && selectedAnswers.length > 0) {
            onSubmitAnswer();
          } else if (isSubmitted) {
            onNextQuestion();
          }
        } else {
          // In exam mode
          if (isLastQuestion) {
            if (onFinishExam) onFinishExam();
          } else {
            onNextQuestion();
          }
        }
      }

      // 'N' key for next question
      if (e.key.toLowerCase() === 'n') {
        if (isPracticeMode && isSubmitted) {
          e.preventDefault();
          onNextQuestion();
        }
      }
    },
    [
      isSubmitted,
      isPracticeMode,
      selectedAnswers,
      question.options,
      onToggleOption,
      onSubmitAnswer,
      onNextQuestion,
      isLastQuestion,
      onFinishExam,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const letters = ['A', 'B', 'C', 'D'];

  // Source week label
  const questionSourceLabel =
    question.source === 'course' && question.week !== null
      ? `Week ${question.week}`
      : question.source === 'test'
      ? 'Test Data'
      : weekLabel;

  return (
    <div id="quiz-question-container" className="max-w-3xl mx-auto w-full px-4 py-6 md:py-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Week & Mode info */}
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              {questionSourceLabel}
            </span>
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border uppercase tracking-wider ${
                mode === 'practice'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {mode} mode
            </span>
          </div>

          {/* Timer (if present in Exam Mode) */}
          {timerSecondsRemaining !== null && (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold border ${
                timerSecondsRemaining < 300
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timerSecondsRemaining)}</span>
            </div>
          )}

          {/* Exit Quiz Button */}
          <button
            type="button"
            onClick={onExitQuiz}
            className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Exit Quiz"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <ProgressBar current={currentIndex + 1} total={totalQuestions} height="sm" color="indigo" />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
        {/* Question Type & Instruction Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question {currentIndex + 1}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
              {isMultiple ? 'Multiple Answer' : 'Single Answer'}
            </span>
          </div>

          {isMultiple && (
            <div className="flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 animate-in fade-in">
              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Select all that apply.</span>
            </div>
          )}
        </div>

        {/* Question Text */}
        <h2 className="text-base sm:text-lg md:text-xl font-medium text-slate-900 leading-relaxed mb-6">
          {question.question}
        </h2>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswers.includes(option);
            const isCorrectOption = question.correctAnswers.includes(option);
            const showFeedback = isPracticeMode && isSubmitted;

            return (
              <AnswerOption
                key={idx}
                index={idx}
                letter={letters[idx]}
                optionText={option}
                questionType={question.type}
                isSelected={isSelected}
                isSubmitted={isSubmitted}
                isCorrectOption={isCorrectOption}
                showFeedback={showFeedback}
                disabled={isPracticeMode && isSubmitted}
                onSelect={() => onToggleOption(option)}
              />
            );
          })}
        </div>

        {/* Practice Mode Feedback Banner (after submission) */}
        {isPracticeMode && isSubmitted && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Correct/Incorrect Alert */}
            <div
              className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs sm:text-sm">
                <span className="font-bold block text-sm">
                  {isCorrect
                    ? isMultiple
                      ? '✓ Correct! You correctly identified all the right answers.'
                      : '✓ Correct Answer!'
                    : isMultiple
                    ? '✗ Incorrect. Exact set match required.'
                    : '✗ Incorrect Answer.'}
                </span>

                {!isCorrect && (
                  <div className="mt-2 text-xs font-semibold text-rose-900">
                    Correct answer{question.correctAnswers.length > 1 ? 's' : ''}:
                    <ul className="list-disc list-inside mt-1 space-y-0.5 font-normal">
                      {question.correctAnswers.map((ca, idx) => (
                        <li key={idx} className="font-semibold text-emerald-800">
                          {ca}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation box */}
            {question.explanation && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950">
                <div className="flex items-center space-x-1.5 font-bold text-amber-900 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Explanation:</span>
                </div>
                <p className="leading-relaxed text-amber-900">{question.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls / Action Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Previous Button (Available in Exam Mode) */}
        {mode === 'exam' && onPreviousQuestion && (
          <button
            type="button"
            onClick={onPreviousQuestion}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        )}

        <div className="flex-1" />

        {/* Action Button: Check Answer (Practice) or Next/Finish (Exam) */}
        {isPracticeMode ? (
          !isSubmitted ? (
            <button
              type="button"
              id="submit-answer-btn"
              onClick={onSubmitAnswer}
              disabled={selectedAnswers.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Submit Answer</span>
            </button>
          ) : (
            <button
              type="button"
              id="next-question-btn"
              onClick={onNextQuestion}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{isLastQuestion ? 'View Results' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        ) : (
          /* Exam Mode */
          <div className="flex items-center space-x-2">
            {!isLastQuestion ? (
              <button
                type="button"
                onClick={onNextQuestion}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="finish-exam-btn"
                onClick={onFinishExam}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Finish Exam</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
