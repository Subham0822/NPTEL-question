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
  Trash2,
  Square,
  MinusSquare,
  X,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface QuestionBankProps {
  allQuestions: Question[];
  weeklyQuestions: Question[];
  testQuestions: Question[];
  onPracticeSingle: (question: Question) => void;
  onPracticeFiltered: (questions: Question[]) => void;
  onDeleteQuestions?: (ids: string[]) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  allQuestions,
  weeklyQuestions,
  testQuestions,
  onPracticeSingle,
  onPracticeFiltered,
  onDeleteQuestions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all'); // 'all', 'combined_weeks', '1'..'12', 'test', 'everything'
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multiple'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ids: string[];
    title: string;
    message: string;
  }>({
    isOpen: false,
    ids: [],
    title: '',
    message: '',
  });

  // Action notification toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // All combined pool for cross-referencing
  const allPoolQuestions = useMemo(() => {
    return [...allQuestions, ...weeklyQuestions, ...testQuestions];
  }, [allQuestions, weeklyQuestions, testQuestions]);

  // Filter logic
  const filteredQuestions = useMemo(() => {
    let pool: Question[] = [];

    if (selectedSection === 'test') {
      pool = testQuestions;
    } else if (selectedSection === 'all') {
      pool = allQuestions;
    } else if (selectedSection === 'combined_weeks') {
      pool = weeklyQuestions;
    } else if (selectedSection === 'everything') {
      pool = allPoolQuestions;
    } else {
      const weekNum = Number(selectedSection);
      pool = weeklyQuestions.filter((q) => q.week === weekNum);
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
  }, [allQuestions, weeklyQuestions, testQuestions, allPoolQuestions, selectedSection, typeFilter, searchTerm]);

  // Selection helpers
  const filteredIds = useMemo(() => filteredQuestions.map((q) => q.id), [filteredQuestions]);
  const visibleSelectedCount = useMemo(
    () => filteredIds.filter((id) => selectedIds.has(id)).length,
    [filteredIds, selectedIds]
  );
  const isAllFilteredSelected = filteredIds.length > 0 && visibleSelectedCount === filteredIds.length;
  const isSomeFilteredSelected = visibleSelectedCount > 0 && !isAllFilteredSelected;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Practice selected questions
  const handlePracticeSelected = () => {
    const selectedQuestions = allPoolQuestions.filter((q) => selectedIds.has(q.id));
    if (selectedQuestions.length > 0) {
      onPracticeFiltered(selectedQuestions);
    }
  };

  // Request deletion of a single question
  const handleRequestDeleteSingle = (question: Question) => {
    setDeleteDialog({
      isOpen: true,
      ids: [question.id],
      title: 'Delete Question',
      message: `Are you sure you want to permanently delete this question? "${question.question.slice(0, 90)}${question.question.length > 90 ? '...' : ''}"`,
    });
  };

  // Request deletion of multiple selected questions
  const handleRequestDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleteDialog({
      isOpen: true,
      ids,
      title: `Delete ${ids.length} Question${ids.length > 1 ? 's' : ''}`,
      message: `Are you sure you want to permanently delete the ${ids.length} selected question${ids.length > 1 ? 's' : ''}? This will remove them from the Question Bank and quiz modules.`,
    });
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    const idsToDelete = deleteDialog.ids;
    if (onDeleteQuestions && idsToDelete.length > 0) {
      onDeleteQuestions(idsToDelete);
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteDialog({ isOpen: false, ids: [], title: '', message: '' });
    setActionNotice(`Successfully deleted ${idsToDelete.length} question${idsToDelete.length > 1 ? 's' : ''}.`);
    setTimeout(() => {
      setActionNotice((prev) => (prev?.includes(`deleted ${idsToDelete.length}`) ? null : prev));
    }, 4000);
  };

  // Export current filtered list as JSON
  const handleExportJson = () => {
    const jsonString = JSON.stringify(filteredQuestions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let filename = 'questions.json';
    if (selectedSection === 'all') filename = 'all-questions.json';
    else if (selectedSection === 'test') filename = 'test-data.json';
    else if (selectedSection === 'combined_weeks') filename = 'combined-weeks.json';
    else if (selectedSection === 'everything') filename = 'all-questions-repository.json';
    else filename = `week-${selectedSection}.json`;
    link.download = filename;
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
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs mb-4 space-y-3">
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
              <option value="all">All Questions Section (all-questions.json)</option>
              <option value="combined_weeks">Combined Course Weeks (Weeks 1–12)</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w} (week-{w}.json)
                </option>
              ))}
              <option value="test">Test Data Sandbox (test-data.json)</option>
              <option value="everything">Entire Repository (All Files)</option>
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

        {/* Selection & Count Summary Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleToggleSelectAllFiltered}
              disabled={filteredQuestions.length === 0}
              className="flex items-center space-x-2 text-slate-700 hover:text-indigo-600 font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none transition-colors"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : isSomeFilteredSelected ? (
                <MinusSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllFilteredSelected
                  ? 'Deselect All Visible'
                  : `Select All Visible (${filteredQuestions.length})`}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Clear selection ({selectedIds.size})
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{filteredQuestions.length}</span> question{filteredQuestions.length !== 1 ? 's' : ''}
              {selectedIds.size > 0 && (
                <span className="ml-2 font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {selectedIds.size} selected
                </span>
              )}
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
      </div>

      {/* Floating / Sticky Selected Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 bg-slate-900 text-white rounded-2xl p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center space-x-2">
                <span>{selectedIds.size} Question{selectedIds.size !== 1 ? 's' : ''} Selected</span>
                <span className="text-xs font-normal text-slate-400">
                  (across Question Bank)
                </span>
              </div>
              <div className="text-xs text-slate-300">
                You can practice or delete the chosen items in bulk.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePracticeSelected}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Selected ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleRequestDeleteSelected}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/60 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
            const isSelected = selectedIds.has(q.id);

            return (
              <div
                key={q.id || idx}
                id={`question-item-${q.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/15 ring-1 ring-indigo-400/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Checkbox for selection */}
                    <div className="flex items-center space-x-2 mr-1">
                      <input
                        type="checkbox"
                        id={`checkbox-q-${q.id}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                        aria-label={`Select question ${idx + 1}`}
                      />
                      <label
                        htmlFor={`checkbox-q-${q.id}`}
                        className="text-xs font-bold text-slate-400 cursor-pointer select-none"
                      >
                        #{idx + 1}
                      </label>
                    </div>

                    {typeof q.week === 'number' ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Week {q.week}
                      </span>
                    ) : q.id?.startsWith('all-') || q.week === 'all' ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        All Questions Section
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

                    {/* Individual Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteSingle(q)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete this question"
                      aria-label="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand'}
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

      {/* Confirmation Dialog for Deletions */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        confirmLabel={`Delete ${deleteDialog.ids.length > 1 ? `${deleteDialog.ids.length} Questions` : 'Question'}`}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, ids: [], title: '', message: '' })}
        id="question-bank-delete-dialog"
      />
    </div>
  );
};
