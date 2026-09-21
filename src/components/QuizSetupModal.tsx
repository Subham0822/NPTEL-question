import React, { useState } from 'react';
import { QuizConfig } from '../types';
import { X, Play, Clock, Shuffle, BookOpen } from 'lucide-react';

interface QuizSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: QuizConfig) => void;
  targetWeek: number | 'all' | 'test';
  availableCount: number;
  initialMode?: 'practice' | 'exam';
}

export const QuizSetupModal: React.FC<QuizSetupModalProps> = ({
  isOpen,
  onClose,
  onStartQuiz,
  targetWeek,
  availableCount,
  initialMode = 'practice',
}) => {
  const [mode, setMode] = useState<'practice' | 'exam'>(initialMode);
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multiple'>('all');
  const [questionCountType, setQuestionCountType] = useState<'all' | '5' | '10' | '20' | 'custom'>('all');
  const [customCount, setCustomCount] = useState<number>(Math.min(10, availableCount || 10));
  const [order, setOrder] = useState<'sequential' | 'random'>('sequential');
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);

  if (!isOpen) return null;

  const handleStart = () => {
    let finalCount: number | 'all' = 'all';
    if (questionCountType === 'all') {
      finalCount = 'all';
    } else if (['5', '10', '20'].includes(questionCountType)) {
      finalCount = parseInt(questionCountType, 10);
    } else {
      finalCount = Math.max(1, Math.min(availableCount, customCount));
    }

    onStartQuiz({
      week: targetWeek,
      mode,
      typeFilter,
      questionCount: finalCount,
      order,
      shuffleOptions,
      timerMinutes: mode === 'exam' ? timerMinutes : 0,
    });
  };

  const getTargetTitle = () => {
    if (targetWeek === 'all') return 'All Questions (Combined Weeks 1–12)';
    if (targetWeek === 'test') return 'Test Data Sandbox Quiz';
    return `Week ${targetWeek} Practice Setup`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Configure Practice
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{getTargetTitle()}</h2>
            <p className="text-xs text-slate-500">
              {availableCount} question{availableCount > 1 ? 's' : ''} available in this pool
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Practice Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'practice'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">Practice Mode</span>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Immediate feedback after each question with explanations.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('exam')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'exam'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">Exam Mode</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Simulate test conditions. Full review at the end.
                </p>
              </button>
            </div>
          </div>

          {/* Question Type Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Question Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('single')}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'single'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                Single Only
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('multiple')}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'multiple'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                Multiple Only
              </button>
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Number of Questions
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['all', '5', '10', '20', 'custom'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setQuestionCountType(opt)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors cursor-pointer capitalize ${
                    questionCountType === opt
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {opt === 'all' ? `All (${availableCount})` : opt}
                </button>
              ))}
            </div>

            {questionCountType === 'custom' && (
              <div className="mt-2.5 flex items-center space-x-2">
                <span className="text-xs text-slate-600">Enter count:</span>
                <input
                  type="number"
                  min={1}
                  max={availableCount}
                  value={customCount}
                  onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400">max {availableCount}</span>
              </div>
            )}
          </div>

          {/* Question Order & Randomization */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Question Order
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrder('sequential')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                  order === 'sequential'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>Sequential</span>
              </button>

              <button
                type="button"
                onClick={() => setOrder('random')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                  order === 'random'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Order</span>
              </button>
            </div>

            {/* Shuffle Options Checkbox */}
            <label className="flex items-center space-x-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium">
                Randomize answer choices inside each question
              </span>
            </label>
          </div>

          {/* Timer (Exam Mode only) */}
          {mode === 'exam' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Time Limit (Exam Mode)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'None', val: 0 },
                  { label: '15 min', val: 15 },
                  { label: '30 min', val: 30 },
                  { label: '60 min', val: 60 },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTimerMinutes(t.val)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      timerMinutes === t.val
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="start-quiz-btn"
            onClick={handleStart}
            disabled={availableCount === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Practice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
