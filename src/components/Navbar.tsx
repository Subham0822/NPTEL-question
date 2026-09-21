import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  Layers,
  FlaskConical,
  MoreVertical,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'importer' | 'bank' | 'test_data') => void;
  totalCourseQuestions: number;
  onExportBackup: () => void;
  onImportBackup: (json: string) => void;
  onFactoryReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onExportBackup,
  onImportBackup,
  onFactoryReset,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                NPTEL Cybersecurity
              </span>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('importer')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'importer'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('bank')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'bank'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Question Bank</span>
            </button>
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-2.5">
            {/* Mobile Navigation Trigger */}
            <div className="flex md:hidden items-center space-x-1">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`p-2 rounded-lg text-xs font-semibold ${
                  currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                }`}
                title="Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('importer')}
                className={`p-2 rounded-lg text-xs font-semibold ${
                  currentView === 'importer' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                }`}
                title="Import"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('bank')}
                className={`p-2 rounded-lg text-xs font-semibold ${
                  currentView === 'bank' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                }`}
                title="Question Bank"
              >
                <Layers className="w-5 h-5" />
              </button>
            </div>

            {/* Settings dropdown menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Settings & Data"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowSettingsMenu(false)}
                  />
                  <div className="absolute right-0 top-12 z-40 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Data Management
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onExportBackup();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer text-slate-700"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>Export Backup (JSON)</span>
                    </button>

                    <label className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer text-slate-700">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Import Backup (JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          setShowSettingsMenu(false);
                          handleFileInput(e);
                        }}
                        className="hidden"
                      />
                    </label>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onNavigate('test_data');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer text-slate-700"
                    >
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <span>Test Data Sandbox</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onFactoryReset();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center space-x-2.5 cursor-pointer text-rose-700 font-semibold"
                    >
                      <RefreshCw className="w-4 h-4 text-rose-600" />
                      <span>Factory Reset App</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
