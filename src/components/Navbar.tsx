import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  Layers,
  FlaskConical,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'importer' | 'bank' | 'test_data') => void;
  totalCourseQuestions: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  totalCourseQuestions,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block">
                NPTEL Cybersecurity
              </span>
              <span className="text-xs text-slate-500 hidden sm:block">
                Course Practice Platform • {totalCourseQuestions} Questions
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Question Bank</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('importer')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'importer'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border border-amber-200'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-50/50'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Test Data</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
