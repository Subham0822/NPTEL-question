import React, { useState } from 'react';
import {
  Play,
  Settings,
  UploadCloud,
  BookOpen,
  MoreVertical,
} from 'lucide-react';

interface WeekCardProps {
  week: number | 'all';
  totalQuestions: number;
  onQuickPractice: (week: number | 'all') => void;
  onOpenSetup: (week: number | 'all') => void;
  onImportForWeek: (week: number | 'all') => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  totalQuestions,
  onQuickPractice,
  onOpenSetup,
  onImportForWeek,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isAllSection = week === 'all';
  const hasQuestions = totalQuestions > 0;

  return (
    <div
      id={isAllSection ? 'all-questions-card' : `week-card-${week}`}
      className={`rounded-3xl border transition-all duration-200 p-6 shadow-xs hover:shadow-md flex flex-col justify-between relative group ${
        isAllSection
          ? hasQuestions
            ? 'bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/40 dark:to-slate-900 border-indigo-200 dark:border-indigo-800/60'
            : 'border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20'
          : hasQuestions
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40'
      }`}
    >
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                isAllSection
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {isAllSection ? <BookOpen className="w-4 h-4" /> : `W${week}`}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAllSection ? 'All Questions' : `Week ${week}`}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {hasQuestions
                  ? `${totalQuestions} Question${totalQuestions > 1 ? 's' : ''}`
                  : 'No questions added'}
              </p>
            </div>
          </div>

          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onImportForWeek(week);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center space-x-2 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Import Questions</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Question Pool Info */}
        {hasQuestions ? (
          <div className="mt-4 mb-5">
            <div className="flex items-center justify-between text-xs py-2.5 px-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Available MCQs</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800/60">
                {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
              </span>
            </div>
          </div>
        ) : (
          <div className="my-6 py-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              {isAllSection ? 'No MCQs in All Questions section.' : 'No MCQs available for this week.'}
            </p>
            <button
              type="button"
              onClick={() => onImportForWeek(week)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center space-x-1 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import MCQs</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
        {hasQuestions ? (
          <>
            <button
              type="button"
              onClick={() => onQuickPractice(week)}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSetup(week)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Quiz Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onImportForWeek(week)}
            className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Questions</span>
          </button>
        )}
      </div>
    </div>
  );
};
