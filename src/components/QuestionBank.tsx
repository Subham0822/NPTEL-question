import React, { useState, useMemo } from 'react';
import { Question } from '../types';
import {
  Search,
  Filter,
  Play,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckSquare,
  Circle,
  Download,
} from 'lucide-react';

interface QuestionBankProps {
  courseQuestions: Question[];
  testQuestions: Question[];
  onPracticeSingle: (question: Question) => void;
  onPracticeFiltered: (questions: Question[]) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  courseQuestions,
  testQuestions,
  onPracticeSingle,
  onPracticeFiltered,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all'); // 'all', '1'..'12', or 'test'
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multiple'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter logic
  const filteredQuestions = useMemo(() => {
    let pool: Question[] = [];

    if (selectedSection === 'test') {
      pool = testQuestions;
    } else if (selectedSection === 'all') {
      pool = courseQuestions;
    } else {
      const weekNum = Number(selectedSection);
      pool = courseQuestions.filter((q) => q.week === weekNum);
    }

    return pool.filter((q) => {
      // Type filter
      if (typeFilter !== 'all' && q.type !== typeFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesText = q.question.toLowerCase().includes(term);
        const matchesOption = q.options.some((opt) => opt.toLowerCase().includes(term));
        const matchesExplanation = q.explanation?.toLowerCase().includes(term);
        return matchesText || matchesOption || matchesExplanation;
      }

      return true;
    });
  }, [courseQuestions, testQuestions, selectedSection, typeFilter, searchTerm]);

  // Export current filtered list as JSON
  const handleExportJson = () => {
    const jsonString = JSON.stringify(filteredQuestions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedSection === 'test' ? 'test-data.json' : `week-${selectedSection}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="question-bank-container" className="max-w-6xl mx-auto w-full px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Layers className="w-7 h-7 text-indigo-600" />
            <span>Question Bank</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, search, and practice questions from the repository JSON files.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {filteredQuestions.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onPracticeFiltered(filteredQuestions)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Practice Filtered ({filteredQuestions.length})</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                title="Download current filtered questions as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search question statement, options, or explanation..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-slate-50/50"
            />
          </div>

          {/* Section Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
            >
              <option value="all">All Course Questions (Weeks 1–12)</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
              <option value="test">Test Data Sandbox</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'single' | 'multiple')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
            >
              <option value="all">All Question Types</option>
              <option value="single">Single Answer Only</option>
              <option value="multiple">Multiple Answer Only</option>
            </select>
          </div>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredQuestions.length}</span> question{filteredQuestions.length !== 1 ? 's' : ''}
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Questions Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or selecting a different week module.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isMultiple = q.type === 'multiple';
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id || idx}
                id={`question-item-${q.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>

                    {q.week ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Week {q.week}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Test Data
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                        isMultiple
                          ? 'bg-amber-50/70 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isMultiple ? (
                        <>
                          <CheckSquare className="w-3 h-3 text-amber-600" />
                          <span>Multiple Answer</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3 h-3 text-slate-500" />
                          <span>Single Answer</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onPracticeSingle(q)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Practice this question"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Practice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <h3 className="text-sm font-medium text-slate-900 leading-relaxed mb-3">
                  {q.question}
                </h3>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                    const isCorrect = q.correctAnswers.some(
                      (ca) => ca.toUpperCase() === letter || ca.toLowerCase() === opt.toLowerCase()
                    );

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-slate-400 shrink-0">
                          {letter}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded shrink-0">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (isExpanded || true) && (
                  <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start space-x-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-slate-800 mr-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
