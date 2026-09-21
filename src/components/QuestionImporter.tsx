import React, { useState } from 'react';
import { ParsedQuestionCandidate, ParseError, Question } from '../types';
import { parseQuestions, detectDuplicates, QUESTION_IMPORT_TEMPLATE } from '../lib/parser';
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
  Download,
  Play,
  ArrowRight,
  FolderGit2,
} from 'lucide-react';

interface QuestionImporterProps {
  existingQuestionsForWeek: Question[];
  defaultWeek?: number | 'all';
  onPracticeParsedQuestions?: (questions: Question[]) => void;
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
  existingQuestionsForWeek,
  defaultWeek = 'all',
  onPracticeParsedQuestions,
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
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showTemplateAccordion, setShowTemplateAccordion] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const targetFilename = selectedWeek === 'all' ? 'all-questions.json' : `week-${selectedWeek}.json`;
  const targetIdPrefix = selectedWeek === 'all' ? 'all' : `w${selectedWeek}`;

  // Validate & Preview
  const handleValidateAndPreview = () => {
    const result = parseQuestions(inputText, selectedWeek);
    setErrors(result.errors);
    setParsedQuestions(result.validQuestions);
    setHasPreviewed(true);
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

  // Format questions into pure repository JSON structure
  const getFormattedJson = () => {
    const jsonObjects = parsedQuestions.map((q, idx) => ({
      id: `${targetIdPrefix}-q${idx + 1}`,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswers: q.correctAnswers,
      ...(q.explanation ? { explanation: q.explanation } : {}),
    }));
    return JSON.stringify(jsonObjects, null, 2);
  };

  // Export & Download JSON
  const handleExportJson = () => {
    if (parsedQuestions.length === 0) return;
    const jsonString = getFormattedJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = targetFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    if (parsedQuestions.length === 0) return;
    navigator.clipboard.writeText(getFormattedJson());
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const duplicateCheck = hasPreviewed
    ? detectDuplicates(parsedQuestions, existingQuestionsForWeek)
    : { duplicates: [], uniqueCandidates: [] };

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
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Paste formatted question blocks, validate structure, and export the resulting JSON file for your repository.
            </p>
          </div>

          {/* Target Section / Week Selector */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-600">Target Section:</span>
            <select
              id="week-select-dropdown"
              value={selectedWeek}
              onChange={(e) => {
                const val = e.target.value;
                const newWeek: number | 'all' = val === 'all' ? 'all' : Number(val);
                setSelectedWeek(newWeek);
                if (hasPreviewed && parsedQuestions.length > 0) {
                  const updated = parsedQuestions.map((q) => ({
                    ...q,
                    week: newWeek,
                  }));
                  setParsedQuestions(updated);
                }
              }}
              className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Questions Section (all-questions.json)</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w} (week-{w}.json)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Instructions & Template Helper Accordion */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs">
        <button
          type="button"
          onClick={() => setShowTemplateAccordion(!showTemplateAccordion)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Format Guidelines & ChatGPT Prompt Template</span>
          </div>
          {showTemplateAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showTemplateAccordion && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-3">
            <p>
              Use the tags <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">[QUESTION]</code>,{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">[TYPE]</code> (single or multiple),{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">[OPTION]</code> (exactly 4 options),{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">[ANSWER]</code> (A, B, C, or D), and optional{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono">[EXPLANATION]</code>.
            </p>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copiedTemplate ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Format Template</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Load Sample MCQs</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="question-input-area" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Paste Questions Text
          </label>
          {inputText && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <textarea
          id="question-input-area"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (hasPreviewed) setHasPreviewed(false);
          }}
          placeholder="Paste questions here in [QUESTION] ... [/QUESTION] format..."
          rows={12}
          className="w-full font-mono text-xs p-4 rounded-2xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden leading-relaxed"
        />

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Targeting: <span className="font-semibold text-slate-700">Week {selectedWeek}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="parse-preview-button"
              onClick={handleValidateAndPreview}
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              <span>Parse & Validate Questions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Parsing Errors Banner */}
      {errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Parsing Issues Detected ({errors.length})
              </h3>
              <p className="text-xs text-rose-700 mt-1 mb-3">
                Review the errors below and correct the question formatting:
              </p>
              <div className="space-y-2">
                {errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-slate-800"
                  >
                    <div className="font-bold text-rose-700">{err.title}</div>
                    <div className="text-slate-600 mt-0.5">{err.reason}</div>
                    {err.rawSnippet && (
                      <div className="mt-2 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-500 overflow-x-auto">
                        {err.rawSnippet}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section & Export Actions */}
      {hasPreviewed && parsedQuestions.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Export Action Card */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/40 border border-indigo-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-indigo-100">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    {parsedQuestions.length} Valid Question{parsedQuestions.length > 1 ? 's' : ''} Ready
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Export as <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-700">{targetFilename}</code> to include in repository.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {targetFilename}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>

                {onPracticeParsedQuestions && (
                  <button
                    type="button"
                    onClick={() => {
                      const questionsToPractice: Question[] = parsedQuestions.map((q, idx) => ({
                        id: `${targetIdPrefix}-q${idx + 1}`,
                        question: q.question,
                        type: q.type,
                        options: q.options,
                        correctAnswers: q.correctAnswers,
                        explanation: q.explanation,
                        week: selectedWeek,
                      }));
                      onPracticeParsedQuestions(questionsToPractice);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Practice these parsed questions in memory right now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Practice in Session</span>
                  </button>
                )}
              </div>
            </div>

            {/* Step-by-step instructions for repository placement */}
            <div className="mt-4 pt-2">
              <div className="flex items-start space-x-3 text-xs text-slate-600 bg-white/80 p-3.5 rounded-2xl border border-indigo-100">
                <FolderGit2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-slate-800">How to save to repository: </span>
                  Download the file and save it to{' '}
                  <code className="font-mono bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                    data/questions/{targetFilename}
                  </code>
                  . Commit and push to git. It will be loaded permanently and automatically.
                </div>
              </div>
            </div>

            {downloadSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Downloaded <strong>{targetFilename}</strong>! Place it into <code>data/questions/</code> in your repository.</span>
              </div>
            )}
          </div>

          {/* Question Preview List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Questions Preview ({parsedQuestions.length})
            </h3>

            {parsedQuestions.map((q, idx) => {
              const isDup = duplicateCheck.duplicates.some(
                (d) => d.candidate.question.toLowerCase() === q.question.toLowerCase()
              );
              return (
                <QuestionPreview
                  key={idx}
                  index={idx}
                  question={q}
                  onUpdate={(updated) => handleUpdatePreview(idx, updated)}
                  onDelete={() => handleDeletePreview(idx)}
                  isDuplicate={isDup}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
