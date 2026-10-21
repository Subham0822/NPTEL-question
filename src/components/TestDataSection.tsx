import React from 'react';
import { Question } from '../types';
import {
  FlaskConical,
  Play,
  CheckSquare,
  Circle,
  FileCode,
} from 'lucide-react';

interface TestDataSectionProps {
  testQuestions: Question[];
  onPracticeTest: (mode: 'practice' | 'exam') => void;
}

export const TestDataSection: React.FC<TestDataSectionProps> = ({
  testQuestions,
  onPracticeTest,
}) => {
  const singleCount = testQuestions.filter((q) => q.type === 'single').length;
  const multipleCount = testQuestions.filter((q) => q.type === 'multiple').length;

  return (
    <div id="test-data-section-container" className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Notice Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-200">
                  Test Data Sandbox
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 uppercase tracking-wider">
                  Isolated Sandbox
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1">
                Static test questions stored in <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200 font-mono">data/questions/test-data.json</code>.
                Completely isolated from Course Weeks 1–12 and All Questions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => onPracticeTest('practice')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Test Data</span>
            </button>
          </div>
        </div>

        {/* Test Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40 text-center">
            <div className="text-xl font-bold text-amber-950 dark:text-amber-200">{testQuestions.length}</div>
            <div className="text-[11px] font-medium text-amber-800 dark:text-amber-400 mt-0.5">Test Questions</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40 text-center">
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{singleCount}</div>
            <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">Single-Answer</div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40 text-center">
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{multipleCount}</div>
            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5">Multiple-Answer</div>
          </div>
        </div>
      </div>

      {/* Test Questions Inspection List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <span>Test Data Questions in Repository</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {testQuestions.length} questions
          </span>
        </div>

        <div className="space-y-3">
          {testQuestions.map((q, idx) => {
            const isMultiple = q.type === 'multiple';
            return (
              <div
                key={q.id || idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      #{idx + 1} ({q.id})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                        isMultiple
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                      }`}
                    >
                      {isMultiple ? (
                        <>
                          <CheckSquare className="w-3 h-3" />
                          <span>Multiple Answer</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3 h-3" />
                          <span>Single Answer</span>
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                    Correct: {q.correctAnswers.join(', ')}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-3">
                  {q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                    const isCorrect = q.correctAnswers.some(
                      (ca) => ca.toUpperCase() === letter || ca.toLowerCase() === opt.toLowerCase()
                    );
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2 ${
                          isCorrect
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 font-medium'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {letter})
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
