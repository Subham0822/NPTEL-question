import React from 'react';
import { WeekCard } from './WeekCard';
import { Play, UploadCloud } from 'lucide-react';

interface DashboardProps {
  totalCourseQuestions: number;
  weekCounts: Record<number, number>;
  onQuickPractice: (week: number | 'all') => void;
  onOpenSetup: (week: number | 'all') => void;
  onImportForWeek: (week: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  totalCourseQuestions,
  weekCounts,
  onQuickPractice,
  onOpenSetup,
  onImportForWeek,
}) => {
  const weeksList = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div id="dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Practice Modules</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {totalCourseQuestions} questions across 12 weekly NPTEL modules. All Questions dynamically combines all active weeks.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => onQuickPractice('all')}
            disabled={totalCourseQuestions === 0}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Practice all course questions combined across all weeks"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Practice All Questions ({totalCourseQuestions})</span>
          </button>

          <button
            type="button"
            onClick={() => onImportForWeek(1)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Sections Grid: All Questions Section + 12 Weeks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Dynamic All Questions Section Card */}
        <WeekCard
          week="all"
          totalQuestions={totalCourseQuestions}
          onQuickPractice={onQuickPractice}
          onOpenSetup={onOpenSetup}
          onImportForWeek={() => onImportForWeek(1)}
        />

        {/* 12 Individual Course Weeks */}
        {weeksList.map((w) => (
          <WeekCard
            key={w}
            week={w}
            totalQuestions={weekCounts[w] || 0}
            onQuickPractice={onQuickPractice}
            onOpenSetup={onOpenSetup}
            onImportForWeek={(targetWeek) => onImportForWeek(typeof targetWeek === 'number' ? targetWeek : w)}
          />
        ))}
      </div>
    </div>
  );
};
