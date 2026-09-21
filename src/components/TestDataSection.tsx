import React, { useState } from 'react';
import { Question, Attempt } from '../types';
import { getTestQuestions, resetTestData, importTestDataToWeek } from '../lib/storage';
import { ConfirmDialog } from './ConfirmDialog';
import {
  FlaskConical,
  RotateCcw,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckSquare,
  Circle,
} from 'lucide-react';

interface TestDataSectionProps {
  testQuestions: Question[];
  testAttempts: Attempt[];
  onPracticeTest: (mode: 'practice' | 'exam') => void;
  onRefreshData: () => void;
  onNavigateToWeek: (week: number) => void;
}

export const TestDataSection: React.FC<TestDataSectionProps> = ({
  testQuestions,
  testAttempts,
  onPracticeTest,
  onRefreshData,
  onNavigateToWeek,
}) => {
  const [copySuccessWeek, setCopySuccessWeek] = useState<number | null>(null);
  const [targetCopyWeek, setTargetCopyWeek] = useState<number>(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleCopyToWeek = () => {
    importTestDataToWeek(targetCopyWeek);
    onRefreshData();
    setCopySuccessWeek(targetCopyWeek);
    setTimeout(() => setCopySuccessWeek(null), 3000);
  };

  const singleCount = testQuestions.filter((q) => q.type === 'single').length;
  const multipleCount = testQuestions.filter((q) => q.type === 'multiple').length;

  return (
    <div id="test-data-section-container" className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Notice Banner */}
      <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-purple-950">
                  Test Data Sandbox
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-200 text-purple-900 border border-purple-300 uppercase tracking-wider">
                  Test Sandbox
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-800 mt-1">
                Isolated test questions for testing single-answer, multiple-answer, randomization,
                and quiz scoring without affecting your 12 course week statistics.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Test Data</span>
            </button>
          </div>
        </div>

        {/* Test Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-purple-200 text-center">
            <div className="text-xl font-bold text-purple-900">{testQuestions.length}</div>
            <div className="text-[11px] font-medium text-purple-700 mt-0.5">Test Questions</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-purple-200 text-center">
            <div className="text-xl font-bold text-indigo-700">{singleCount}</div>
            <div className="text-[11px] font-medium text-indigo-600 mt-0.5">Single-Answer</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-purple-200 text-center">
            <div className="text-xl font-bold text-amber-700">{multipleCount}</div>
            <div className="text-[11px] font-medium text-amber-600 mt-0.5">Multiple-Answer</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-purple-200 text-center">
            <div className="text-xl font-bold text-emerald-700">{testAttempts.length}</div>
            <div className="text-[11px] font-medium text-emerald-600 mt-0.5">Test Attempts</div>
          </div>
        </div>

        {/* Practice Test Questions Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onPracticeTest('practice')}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice Test Questions (Practice Mode)</span>
          </button>

          <button
            type="button"
            onClick={() => onPracticeTest('exam')}
            className="px-5 py-2.5 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-colors"
          >
            <span>Timed Exam Simulation</span>
          </button>
        </div>

        {/* Copy to Course Week Utility */}
        <div className="mt-6 pt-5 border-t border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-purple-900 font-medium">
            Want to test actual course week workflows? Copy test questions into a course week:
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={targetCopyWeek}
              onChange={(e) => setTargetCopyWeek(parseInt(e.target.value, 10))}
              className="text-xs p-1.5 rounded-lg border border-purple-300 bg-white text-purple-950 font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCopyToWeek}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>Copy to Week {targetCopyWeek}</span>
            </button>
          </div>
        </div>

        {copySuccessWeek !== null && (
          <div className="mt-3 p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <span>Copied {testQuestions.length} test questions into Week {copySuccessWeek}!</span>
            <button
              type="button"
              onClick={() => onNavigateToWeek(copySuccessWeek)}
              className="font-bold underline ml-2 cursor-pointer"
            >
              Go to Week {copySuccessWeek} &rarr;
            </button>
          </div>
        )}
      </div>

      {/* List of Test Questions */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <span>Test Questions Inventory ({testQuestions.length})</span>
        </h3>

        <div className="space-y-3">
          {testQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-purple-200 p-5 shadow-xs transition-all hover:border-purple-300"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-bold text-xs rounded-md">
                    Test #{idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                      q.type === 'multiple'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    {q.type === 'multiple' ? 'Multiple Answer' : 'Single Answer'}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-medium text-slate-900 leading-relaxed mb-3">
                {q.question}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = q.correctAnswers.includes(opt);
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="font-bold text-[11px] text-slate-400 w-3">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span className="flex-1 truncate">{opt}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 mr-1">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Test Data?"
        message="Reset test data questions back to the default verification sample set and clear test attempt history?"
        confirmLabel="Reset Test Data"
        variant="warning"
        onConfirm={() => {
          resetTestData();
          onRefreshData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
