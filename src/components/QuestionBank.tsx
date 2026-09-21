import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Question, QuestionType } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Layers,
  BookOpen,
  CheckSquare,
  Circle,
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onBulkDeleteQuestions?: (ids: string[]) => void;
  onAddSingleQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => void;
  onPracticeSingle: (question: Question) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  onUpdateQuestion,
  onDeleteQuestion,
  onBulkDeleteQuestions,
  onAddSingleQuestion,
  onPracticeSingle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all' | 'combined' | 'test'>('combined');
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multiple'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Multi-select and Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Clean up selectedIds when questions change
  useEffect(() => {
    const existingIds = new Set(questions.map((q) => q.id));
    setSelectedIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [questions]);

  // Edit Modal state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editType, setEditType] = useState<QuestionType>('single');
  const [editWeek, setEditWeek] = useState<number | 'all'>(1);
  const [editText, setEditText] = useState('');
  const [editOptions, setEditOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [editCorrectAnswers, setEditCorrectAnswers] = useState<string[]>([]);
  const [editExplanation, setEditExplanation] = useState('');
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Add Question Modal state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('single');
  const [newQuestionWeek, setNewQuestionWeek] = useState<number | 'all'>(1);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [newCorrectAnswers, setNewCorrectAnswers] = useState<string[]>([]);
  const [newExplanation, setNewExplanation] = useState('');

  // Filter and search logic
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Week / Section filter
      if (selectedWeek !== 'combined') {
        if (selectedWeek === 'test') {
          if (q.source !== 'test') return false;
        } else if (selectedWeek === 'all') {
          if (q.source !== 'course' || (q.week !== 'all' && q.week !== 0)) return false;
        } else {
          if (q.source !== 'course' || q.week !== selectedWeek) return false;
        }
      }

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
        if (!matchesText && !matchesOption && !matchesExplanation) {
          return false;
        }
      }

      return true;
    });
  }, [questions, selectedWeek, typeFilter, searchTerm]);

  // Selection calculations
  const isAllFilteredSelected = useMemo(() => {
    if (filteredQuestions.length === 0) return false;
    return filteredQuestions.every((q) => selectedIds.includes(q.id));
  }, [filteredQuestions, selectedIds]);

  const isSomeFilteredSelected = useMemo(() => {
    if (filteredQuestions.length === 0) return false;
    const count = filteredQuestions.filter((q) => selectedIds.includes(q.id)).length;
    return count > 0 && count < filteredQuestions.length;
  }, [filteredQuestions, selectedIds]);

  // Keep native checkbox indeterminate state synced
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered questions
      const filteredIdSet = new Set(filteredQuestions.map((q) => q.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      // Select all filtered questions
      const newSelected = new Set([...selectedIds, ...filteredQuestions.map((q) => q.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectOne = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onBulkDeleteQuestions) {
      onBulkDeleteQuestions(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeleteQuestion(id));
    }
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  // Handle Open Edit Modal
  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setEditType(q.type);
    setEditWeek(q.week === 'all' || q.week === 0 ? 'all' : (q.week || 1));
    setEditText(q.question);
    setEditOptions([q.options[0], q.options[1], q.options[2], q.options[3]]);
    setEditCorrectAnswers(q.correctAnswers);
    setEditExplanation(q.explanation || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!editText.trim() || editOptions.some((o) => !o.trim())) {
      alert('Please fill out the question text and all 4 options.');
      return;
    }
    if (editCorrectAnswers.length === 0) {
      alert('Please select at least one correct answer.');
      return;
    }
    if (editType === 'multiple' && editCorrectAnswers.length < 2) {
      alert('Multiple-answer questions must have at least two correct answers.');
      return;
    }

    onUpdateQuestion(editingQuestion.id, {
      question: editText.trim(),
      type: editType,
      week: editingQuestion.source === 'test' ? null : editWeek,
      options: [
        editOptions[0].trim(),
        editOptions[1].trim(),
        editOptions[2].trim(),
        editOptions[3].trim(),
      ],
      correctAnswers: editCorrectAnswers,
      explanation: editExplanation.trim() ? editExplanation.trim() : undefined,
    });

    setEditingQuestion(null);
  };

  // Handle Save New Question
  const handleSaveNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || newOptions.some((opt) => !opt.trim())) {
      alert('Please fill out the question text and all 4 options.');
      return;
    }
    if (newCorrectAnswers.length === 0) {
      alert('Please select at least one correct answer.');
      return;
    }
    if (newQuestionType === 'multiple' && newCorrectAnswers.length < 2) {
      alert('Multiple-answer questions must have at least two correct answers.');
      return;
    }

    onAddSingleQuestion({
      source: 'course',
      week: newQuestionWeek,
      question: newQuestionText.trim(),
      type: newQuestionType,
      options: [
        newOptions[0].trim(),
        newOptions[1].trim(),
        newOptions[2].trim(),
        newOptions[3].trim(),
      ],
      correctAnswers: newCorrectAnswers,
      explanation: newExplanation.trim() ? newExplanation.trim() : undefined,
    });

    // Reset
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setNewCorrectAnswers([]);
    setNewExplanation('');
    setIsAddingNew(false);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div id="question-bank-container" className="max-w-6xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Layers className="w-7 h-7 text-indigo-600" />
            <span>Question Bank</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, edit, and organize all course questions. Showing {filteredQuestions.length} of{' '}
            {questions.length} total.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewOptions(['', '', '', '']);
            setNewCorrectAnswers([]);
            setIsAddingNew(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions or keywords..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Week Filter */}
          <div>
            <select
              value={selectedWeek}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedWeek(
                  val === 'combined'
                    ? 'combined'
                    : val === 'all'
                    ? 'all'
                    : val === 'test'
                    ? 'test'
                    : parseInt(val, 10)
                );
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="combined">All Sections (Combined)</option>
              <option value="all">All Questions Section</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
              <option value="test">Test Data Only</option>
            </select>
          </div>

          {/* Type Filter (Requirement 14) */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Question Types</option>
              <option value="single">Single Answer</option>
              <option value="multiple">Multiple Answer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar when questions are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-indigo-600 text-white font-bold text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {selectedIds.length} question{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-indigo-700">
              <span>•</span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="hover:underline font-semibold cursor-pointer"
              >
                {isAllFilteredSelected
                  ? 'Deselect visible'
                  : `Select all ${filteredQuestions.length} visible`}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="hover:underline font-medium cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClearSelection}
              className="sm:hidden px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions Table / List View */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No questions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, week selection, or import new questions from the Import
            page.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      ref={masterCheckboxRef}
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      title={isAllFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                      aria-label="Select all questions"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer align-middle"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-3 w-24">Week</th>
                  <th className="py-3 px-3 w-32">Type</th>
                  <th className="py-3 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuestions.map((q, idx) => {
                  const isExpanded = expandedId === q.id;
                  const isSelected = selectedIds.includes(q.id);

                  return (
                    <React.Fragment key={q.id}>
                      <tr
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/50 hover:bg-indigo-50/70'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelectOne(q.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select question ${idx + 1}`}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer align-middle"
                          />
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : q.id)}
                            className="text-left font-medium text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center space-x-2 group"
                          >
                            <span className="line-clamp-2 leading-relaxed">{q.question}</span>
                            <span className="text-slate-400 group-hover:text-indigo-600 shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {q.source === 'test' ? (
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                              Test Data
                            </span>
                          ) : q.week === 'all' || q.week === 0 ? (
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              All Questions
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                              Week {q.week}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                              q.type === 'multiple'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}
                          >
                            {q.type === 'multiple' ? 'Multiple' : 'Single'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => onPracticeSingle(q)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Practice this question"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(q)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit question"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestionToDelete(q)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                              <div className="text-xs font-bold text-slate-700">Options:</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = q.correctAnswers.includes(opt);
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`p-2 rounded-lg border text-xs flex items-center space-x-2 ${
                                        isCorrect
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                                          : 'border-slate-200 bg-white text-slate-700'
                                      }`}
                                    >
                                      <span className="font-bold text-slate-400 w-4">
                                        {letters[oIdx]}.
                                      </span>
                                      <span className="flex-1">{opt}</span>
                                      {isCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 flex items-start space-x-2">
                                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold text-amber-900 mr-1">
                                      Explanation:
                                    </span>
                                    {q.explanation}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Question Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Add Question to Course</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Course Section
                  </label>
                  <select
                    value={newQuestionWeek}
                    onChange={(e) =>
                      setNewQuestionWeek(
                        e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Questions Section</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Question Type
                  </label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => {
                      const t = e.target.value as QuestionType;
                      setNewQuestionType(t);
                      if (t === 'single' && newCorrectAnswers.length > 1) {
                        setNewCorrectAnswers([newCorrectAnswers[0]]);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="single">Single Answer</option>
                    <option value="multiple">Multiple Answer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Question Text
                </label>
                <textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  rows={3}
                  required
                  placeholder="Enter the question text..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Options ({newQuestionType === 'single' ? 'Pick 1 correct answer' : 'Check all correct answers'})
                </label>
                <div className="space-y-2">
                  {newOptions.map((opt, idx) => {
                    const isChecked = newCorrectAnswers.includes(opt) && opt.trim().length > 0;
                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type={newQuestionType === 'single' ? 'radio' : 'checkbox'}
                          name="new-correct-ans"
                          checked={isChecked}
                          onChange={() => {
                            if (newQuestionType === 'single') {
                              setNewCorrectAnswers([opt]);
                            } else {
                              if (isChecked) {
                                setNewCorrectAnswers(newCorrectAnswers.filter((a) => a !== opt));
                              } else {
                                setNewCorrectAnswers([...newCorrectAnswers, opt]);
                              }
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-400 w-4">{letters[idx]}.</span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions] as [string, string, string, string];
                            const oldVal = updated[idx];
                            updated[idx] = e.target.value;
                            setNewOptions(updated);
                            if (newCorrectAnswers.includes(oldVal)) {
                              setNewCorrectAnswers(
                                newCorrectAnswers.map((a) => (a === oldVal ? e.target.value : a))
                              );
                            }
                          }}
                          placeholder={`Option ${letters[idx]}`}
                          className="flex-1 text-xs p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  rows={2}
                  placeholder="Explain why the answers are correct..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <span>Edit Question</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Course Section
                  </label>
                  {editingQuestion.source === 'test' ? (
                    <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                      Test Data (Not assigned to course section)
                    </div>
                  ) : (
                    <select
                      value={editWeek}
                      onChange={(e) =>
                        setEditWeek(
                          e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Questions Section</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w}>
                          Week {w}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Question Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => {
                      const t = e.target.value as QuestionType;
                      setEditType(t);
                      if (t === 'single' && editCorrectAnswers.length > 1) {
                        setEditCorrectAnswers([editCorrectAnswers[0]]);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="single">Single Answer</option>
                    <option value="multiple">Multiple Answer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Question Text
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Options ({editType === 'single' ? 'Pick 1 correct answer' : 'Check all correct answers'})
                </label>
                <div className="space-y-2">
                  {editOptions.map((opt, idx) => {
                    const isChecked = editCorrectAnswers.includes(opt);
                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type={editType === 'single' ? 'radio' : 'checkbox'}
                          name="edit-correct-ans"
                          checked={isChecked}
                          onChange={() => {
                            if (editType === 'single') {
                              setEditCorrectAnswers([opt]);
                            } else {
                              if (isChecked) {
                                setEditCorrectAnswers(editCorrectAnswers.filter((a) => a !== opt));
                              } else {
                                setEditCorrectAnswers([...editCorrectAnswers, opt]);
                              }
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-400 w-4">{letters[idx]}.</span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...editOptions] as [string, string, string, string];
                            const oldVal = updated[idx];
                            updated[idx] = e.target.value;
                            setEditOptions(updated);
                            if (editCorrectAnswers.includes(oldVal)) {
                              setEditCorrectAnswers(
                                editCorrectAnswers.map((a) => (a === oldVal ? e.target.value : a))
                              );
                            }
                          }}
                          className="flex-1 text-xs p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Explanation
                </label>
                <textarea
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const q = editingQuestion;
                    setEditingQuestion(null);
                    setQuestionToDelete(q);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Question</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={questionToDelete !== null}
        title="Delete Question"
        message={
          questionToDelete
            ? `Are you sure you want to permanently delete this question? "${questionToDelete.question.slice(0, 90)}${
                questionToDelete.question.length > 90 ? '...' : ''
              }"`
            : ''
        }
        confirmLabel="Yes, Delete Question"
        variant="danger"
        onConfirm={() => {
          if (questionToDelete) {
            onDeleteQuestion(questionToDelete.id);
            setSelectedIds((prev) => prev.filter((id) => id !== questionToDelete.id));
            setQuestionToDelete(null);
          }
        }}
        onCancel={() => setQuestionToDelete(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title={`Delete ${selectedIds.length} Question${selectedIds.length > 1 ? 's' : ''}?`}
        message={`Are you sure you want to permanently delete the ${selectedIds.length} selected question${
          selectedIds.length > 1 ? 's' : ''
        }? All corresponding user attempts, performance records, and statistics will also be deleted. This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Question${selectedIds.length > 1 ? 's' : ''}`}
        variant="danger"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
};
