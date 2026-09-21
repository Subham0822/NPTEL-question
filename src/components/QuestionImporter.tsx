import React, { useState } from 'react';
import { ParsedQuestionCandidate, ParseError, Question } from '../types';
import { parseQuestions, detectDuplicates, QUESTION_IMPORT_TEMPLATE } from '../lib/parser';
import { addQuestions } from '../lib/storage';
import { QuestionPreview } from './QuestionPreview';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface QuestionImporterProps {
  existingQuestions: Question[];
  onImportSuccess: (importedCount: number, week: number | 'all') => void;
  defaultWeek?: number | 'all';
  onPracticeWeek?: (week: number | 'all') => void;
  onGoToBank?: () => void;
}

const SAMPLE_CHATGPT_INPUT = `[QUESTION]
Which element of the CIA triad is violated if an attacker intercepts and alters a bank transaction message in transit?
[TYPE]
single
[OPTION]
Confidentiality
[OPTION]
Integrity
[OPTION]
Availability
[OPTION]
Accountability
[ANSWER]
B
[EXPLANATION]
Integrity ensures that data has not been altered or tampered with by unauthorized parties in transit.
[/QUESTION]

[QUESTION]
Which of the following are common wireless attack vectors against Wi-Fi networks?
[TYPE]
multiple
[OPTION]
Evil Twin rogue access point
[OPTION]
Deauthentication frame packet injection
[OPTION]
WPA 4-way handshake sniffing and dictionary cracking
[OPTION]
Thermal CPU throttling over copper cables
[ANSWER]
A
[ANSWER]
B
[ANSWER]
C
[EXPLANATION]
Evil Twin spoofing, deauth injection, and handshake sniffing are Wi-Fi attack vectors. Thermal throttling over copper is hardware-level and not a wireless attack.
[/QUESTION]

[QUESTION]
Which wireless security protocol introduced the Simultaneous Authentication of Equals (SAE) Dragonfly handshake?
[TYPE]
single
[OPTION]
WEP
[OPTION]
WPA
[OPTION]
WPA2
[OPTION]
WPA3
[ANSWER]
WPA3
[EXPLANATION]
WPA3 incorporates Dragonfly handshake (SAE) which protects against offline password guessing attacks even with simple passwords.
[/QUESTION]`;

export const QuestionImporter: React.FC<QuestionImporterProps> = ({
  existingQuestions,
  onImportSuccess,
  defaultWeek = 1,
  onPracticeWeek,
  onGoToBank,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>(
    defaultWeek === 'all' || (typeof defaultWeek === 'number' && defaultWeek >= 1 && defaultWeek <= 12)
      ? defaultWeek
      : 'all'
  );
  const [inputText, setInputText] = useState<string>('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionCandidate[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [hasPreviewed, setHasPreviewed] = useState<boolean>(false);
  const [showPromptHelper, setShowPromptHelper] = useState<boolean>(false);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<{ count: number; week: number | 'all' } | null>(null);
  const [duplicateResolution, setDuplicateResolution] = useState<{
    duplicates: { candidate: ParsedQuestionCandidate; existing: Question }[];
    uniqueCandidates: ParsedQuestionCandidate[];
  } | null>(null);

  const targetLabel = selectedWeek === 'all' ? 'All Questions' : `Week ${selectedWeek}`;

  // Trigger parse and preview
  const handlePreview = () => {
    const result = parseQuestions(inputText, selectedWeek);
    setParsedQuestions(result.validQuestions);
    setErrors(result.errors);
    setHasPreviewed(true);
    setDuplicateResolution(null);
  };

  // Copy template helper
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(QUESTION_IMPORT_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Load sample ChatGPT block helper
  const handleLoadSample = () => {
    setInputText(SAMPLE_CHATGPT_INPUT);
    setHasPreviewed(false);
    setErrors([]);
    setParsedQuestions([]);
  };

  // Clear all
  const handleClear = () => {
    setInputText('');
    setParsedQuestions([]);
    setErrors([]);
    setHasPreviewed(false);
    setDuplicateResolution(null);
  };

  // Update a single question in the preview list
  const handleUpdatePreview = (idx: number, updated: ParsedQuestionCandidate) => {
    const updatedList = [...parsedQuestions];
    updatedList[idx] = updated;
    setParsedQuestions(updatedList);
  };

  // Delete a single question from preview list
  const handleDeletePreview = (idx: number) => {
    const updatedList = parsedQuestions.filter((_, i) => i !== idx);
    setParsedQuestions(updatedList);
  };

  // Initiate Import
  const handleInitiateImport = () => {
    let candidatesToImport = parsedQuestions;
    if (!hasPreviewed || candidatesToImport.length === 0) {
      const result = parseQuestions(inputText, selectedWeek);
      if (result.errors.length > 0) {
        setErrors(result.errors);
        setParsedQuestions(result.validQuestions);
        setHasPreviewed(true);
        return;
      }
      candidatesToImport = result.validQuestions;
      setParsedQuestions(candidatesToImport);
      setHasPreviewed(true);
    }

    if (candidatesToImport.length === 0) {
      return;
    }

    // Ensure candidate week matches current selectedWeek
    const normalizedCandidates = candidatesToImport.map((c) => ({
      ...c,
      week: selectedWeek,
    }));

    // Check duplicates against existing course questions in this week
    const dupCheck = detectDuplicates(normalizedCandidates, existingQuestions);
    if (dupCheck.duplicates.length > 0) {
      setDuplicateResolution(dupCheck);
    } else {
      finalizeImport(normalizedCandidates);
    }
  };

  // Finalize import with chosen items
  const finalizeImport = (items: ParsedQuestionCandidate[]) => {
    addQuestions(items, 'course');
    onImportSuccess(items.length, selectedWeek);
    setSuccessToast({ count: items.length, week: selectedWeek });
    setInputText('');
    setParsedQuestions([]);
    setErrors([]);
    setHasPreviewed(false);
    setDuplicateResolution(null);
  };

  const isDuplicateItem = (item: ParsedQuestionCandidate) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return existingQuestions.some((eq) => {
      if (eq.source !== 'course') return false;
      const weekMatch =
        selectedWeek === 'all'
          ? eq.week === 'all' || eq.week === 0
          : eq.week === selectedWeek;
      return weekMatch && norm(eq.question) === norm(item.question);
    });
  };

  return (
    <div id="question-importer-container" className="max-w-4xl mx-auto w-full px-4 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
              <UploadCloud className="w-7 h-7 text-indigo-600" />
              <span>Import Questions</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Paste ChatGPT or formatted questions into any course week (Weeks 1 to 12).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPromptHelper(!showPromptHelper)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>ChatGPT Prompt Format</span>
              {showPromptHelper ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Import Successful!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Successfully imported <strong>{successToast.count}</strong> question(s) into{' '}
                  <strong>{successToast.week === 'all' ? 'All Questions' : `Week ${successToast.week}`}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onPracticeWeek && (
                <button
                  type="button"
                  onClick={() => {
                    const w = successToast.week;
                    setSuccessToast(null);
                    onPracticeWeek(w);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Practice {successToast.week === 'all' ? 'All Questions' : `Week ${successToast.week}`}</span>
                </button>
              )}
              {onGoToBank && (
                <button
                  type="button"
                  onClick={() => {
                    setSuccessToast(null);
                    onGoToBank();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <span>Question Bank</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Target Section / Week Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Target Course Section (Required)</span>
          </label>
          <div className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            Selected Target: <strong className="font-bold">{targetLabel}</strong>
          </div>
        </div>

        {/* All Questions Section + 12-Week Pill Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-2">
          {/* All Questions Section */}
          <button
            type="button"
            id="import-section-selector-all"
            onClick={() => {
              setSelectedWeek('all');
              if (hasPreviewed) {
                setParsedQuestions((prev) => prev.map((p) => ({ ...p, week: 'all' })));
              }
            }}
            className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
              selectedWeek === 'all'
                ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40'
            }`}
          >
            <div className="text-xs font-bold">All Qs</div>
            <div
              className={`text-[10px] mt-0.5 ${
                selectedWeek === 'all' ? 'text-indigo-100' : 'text-slate-400'
              }`}
            >
              {existingQuestions.filter((q) => (q.week === 'all' || q.week === 0) && q.source === 'course').length} q
            </div>
          </button>

          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
            const count = existingQuestions.filter((q) => q.week === w && q.source === 'course').length;
            const isSelected = selectedWeek === w;
            return (
              <button
                key={w}
                type="button"
                id={`import-week-selector-${w}`}
                onClick={() => {
                  setSelectedWeek(w);
                  if (hasPreviewed) {
                    setParsedQuestions((prev) => prev.map((p) => ({ ...p, week: w })));
                  }
                }}
                className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <div className="text-xs">W{w}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {count} q
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ChatGPT Prompt Format Guide (Collapsible) */}
      {showPromptHelper && (
        <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/50 rounded-2xl border border-indigo-100 p-5 shadow-xs mb-6 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                ChatGPT / AI Prompt Generator Template
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTemplate ? 'Copied!' : 'Copy Template'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Copy and paste this prompt directly into ChatGPT to generate high-yield Cybersecurity
            questions with explicit tags for <strong>Single-Answer</strong> and <strong>Multiple-Answer</strong> questions:
          </p>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-56">
            {QUESTION_IMPORT_TEMPLATE}
          </pre>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Paste Formatted Questions Block</span>
          </label>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Load Sample Data
            </button>
            {inputText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          id="question-import-textarea"
          rows={11}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setHasPreviewed(false);
          }}
          placeholder={`[QUESTION]\nQuestion text...\n[TYPE]\nsingle (or multiple)\n[OPTION]\nOption A\n[OPTION]\nOption B\n[OPTION]\nOption C\n[OPTION]\nOption D\n[ANSWER]\nB\n[EXPLANATION]\nExplanation...\n[/QUESTION]`}
          className="w-full text-xs sm:text-sm font-mono p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 leading-relaxed"
        />

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Targeting: <strong className="text-slate-800">{targetLabel}</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              id="preview-questions-btn"
              onClick={handlePreview}
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Preview ({hasPreviewed ? parsedQuestions.length : 'Parse'})</span>
            </button>

            <button
              type="button"
              id="import-questions-btn"
              onClick={handleInitiateImport}
              disabled={!inputText.trim() && parsedQuestions.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import to {targetLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Parser Errors View */}
      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Parsing Issues Detected ({errors.length})</span>
          </div>

          <p className="text-xs text-rose-700 mb-3">
            One or more question blocks could not be formatted properly. Please review the errors below:
          </p>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {errors.map((err, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-rose-200 text-xs">
                <div className="font-bold text-rose-900">{err.title}</div>
                <div className="text-slate-600 mt-0.5">{err.reason}</div>
                {err.rawSnippet && (
                  <pre className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto">
                    {err.rawSnippet}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Resolution Modal / Warning */}
      {duplicateResolution && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-6 animate-in fade-in">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Duplicate Questions Found in {targetLabel}</span>
          </div>

          <p className="text-xs text-amber-800 mb-4 leading-relaxed">
            Found <strong>{duplicateResolution.duplicates.length}</strong> question(s) that appear identical
            to questions already saved in {targetLabel}.
          </p>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => finalizeImport(duplicateResolution.uniqueCandidates)}
              disabled={duplicateResolution.uniqueCandidates.length === 0}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
            >
              Skip Duplicates & Import ({duplicateResolution.uniqueCandidates.length})
            </button>
            <button
              type="button"
              onClick={() => finalizeImport(parsedQuestions)}
              className="px-4 py-2 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Import All (Allow Duplicates)
            </button>
            <button
              type="button"
              onClick={() => setDuplicateResolution(null)}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {hasPreviewed && parsedQuestions.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Import Preview ({parsedQuestions.length} valid)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Destination: <strong>{targetLabel}</strong>. Single and multiple questions are marked with their visual input badges.
              </p>
            </div>

            <button
              type="button"
              onClick={handleInitiateImport}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Confirm & Import All ({parsedQuestions.length})</span>
            </button>
          </div>

          <div className="space-y-3">
            {parsedQuestions.map((q, idx) => (
              <QuestionPreview
                key={idx}
                index={idx}
                question={q}
                onUpdate={(up) => handleUpdatePreview(idx, up)}
                onDelete={() => handleDeletePreview(idx)}
                isDuplicate={isDuplicateItem(q)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
