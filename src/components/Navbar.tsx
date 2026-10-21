import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  Layers,
  FlaskConical,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'importer' | 'bank' | 'test_data' | 'pdfs') => void;
  totalCourseQuestions: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  totalCourseQuestions,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg block">
                NPTEL Cybersecurity
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Course Practice Platform • {totalCourseQuestions} Questions
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Navigation Links */}
            <nav className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Sections</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('bank')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  currentView === 'bank'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Question Bank</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('pdfs')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  currentView === 'pdfs'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDFs</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('importer')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  currentView === 'importer'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('test_data')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  currentView === 'test_data'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold shadow-xs border border-amber-200 dark:border-amber-800/60'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-50/50 dark:hover:bg-amber-900/30'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Test Data</span>
              </button>
            </nav>

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
