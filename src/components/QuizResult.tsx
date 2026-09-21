import React, { useState } from 'react';
import { Question } from '../types';
import {
  CheckCircle2,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Clock,
  BookOpen,
} from 'lucide-react';

interface QuizResultProps {
  questions: Question[];
  userAnswers: Record<string, string[] | string>; // questionId -> selected options
  totalTimeSeconds?: number;
  onRetry: () => void;
  onPracticeIncorrect?: (incorrectQuestions: Question[]) => void;
  onBackToDashboard: () => void;
  weekLabel: string;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  questions,
  userAnswers,
  totalTimeSeconds,
  onRetry,
  onBackToDashboard,
  weekLabel,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSelectedArray = (qId: string): string[] => {
    const ans = userAnswers[qId];
    if (!ans) return [];
    return Array.isArray(ans) ? ans : [ans];
  };

  const formatSecs = (secs?: number) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const letters = ['A', 'B', 'C', 'D'];
  const formattedTime = formatSecs(totalTimeSeconds);

  return (
    <div id="quiz-results-container" className="max-w-3xl mx-auto w-full px-4 py-8">
      {/* Header Result Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 text-center relative overflow-hidden">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 mb-4">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="mb-2">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {weekLabel}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Practice Completed!</h1>
        <p className="text-sm text-slate-500 mb-6">
          You reviewed all {questions.length} questions in this session.
        </p>

        {formattedTime && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium mb-6">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Time: {formattedTime}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Session</span>
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Question & Answer Review</h2>
          <span className="text-xs text-slate-500 font-medium">
            {questions.length} question{questions.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const selected = getSelectedArray(q.id);
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 transition-all p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-700">
                      {idx + 1}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {q.source === 'course' && q.week
                        ? q.week === 'all'
                          ? 'All Questions'
                          : `Week ${q.week}`
                        : 'Test Data'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        q.type === 'multiple'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}
                    >
                      {q.type === 'multiple' ? 'Multiple' : 'Single'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <h3 className="text-sm font-medium text-slate-900 mb-3">{q.question}</h3>

                {/* Options display */}
                <div className="space-y-1.5 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selected.includes(opt);
                    const isCorrectOption = q.correctAnswers.includes(opt);

                    let rowStyle = 'border-slate-200 bg-white text-slate-600';
                    if (isCorrectOption) {
                      rowStyle =
                        'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-semibold';
                    } else if (isSelected && !isCorrectOption) {
                      rowStyle =
                        'border-slate-300 bg-slate-50 text-slate-800 font-medium';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${rowStyle}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-400 w-4">{letters[oIdx]}.</span>
                          <span>{opt}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {isSelected && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              Your Choice
                            </span>
                          )}
                          {isCorrectOption && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 mr-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
