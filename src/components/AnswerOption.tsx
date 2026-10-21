import React from 'react';
import { CheckCircle2, XCircle, Check, Circle } from 'lucide-react';
import { QuestionType } from '../types';

interface AnswerOptionProps {
  index: number;
  letter: string;
  optionText: string;
  questionType: QuestionType;
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrectOption: boolean;
  showFeedback: boolean; // false in Exam mode until results
  disabled: boolean;
  onSelect: () => void;
  id?: string;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  index,
  letter,
  optionText,
  questionType,
  isSelected,
  isSubmitted,
  isCorrectOption,
  showFeedback,
  disabled,
  onSelect,
  id,
}) => {
  // Determine styles based on state
  let containerStyle =
    'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900';
  let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (!isSubmitted) {
    if (isSelected) {
      containerStyle = 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-100 font-medium';
      badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
    }
  } else if (showFeedback) {
    // In practice mode after submission:
    if (isCorrectOption) {
      // Always highlight correct answer in green
      containerStyle =
        'border-emerald-500 dark:border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 font-medium';
      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
    } else if (isSelected && !isCorrectOption) {
      // User selected wrong answer
      containerStyle =
        'border-rose-500 dark:border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20 font-medium';
      badgeStyle = 'bg-rose-600 text-white border-rose-600';
    } else {
      // Unselected other options
      containerStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-60';
      badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700';
    }
  } else {
    // In Exam mode: just highlight selected option
    if (isSelected) {
      containerStyle = 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-100 font-medium';
      badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
    }
  }

  return (
    <button
      type="button"
      id={id || `answer-option-${index}`}
      disabled={disabled}
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start space-x-3.5 group cursor-pointer disabled:cursor-default relative ${containerStyle}`}
    >
      {/* Radio or Checkbox visual indicator */}
      <div className="pt-0.5 shrink-0">
        {questionType === 'single' ? (
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              isSelected
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-500'
            }`}
          >
            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        ) : (
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              isSelected
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400 dark:group-hover:border-slate-500'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        )}
      </div>

      {/* Letter Badge */}
      <div
        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${badgeStyle}`}
      >
        {letter}
      </div>

      {/* Option Text */}
      <div className="flex-1 text-sm md:text-base leading-relaxed pt-0.5">
        {optionText}
      </div>

      {/* Keyboard shortcut hint (only before submit) */}
      {!isSubmitted && (
        <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shrink-0">
          {index + 1}
        </span>
      )}

      {/* Status icons after submit in practice feedback */}
      {isSubmitted && showFeedback && (
        <div className="shrink-0 pt-0.5">
          {isCorrectOption && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in zoom-in-50" />
          )}
          {isSelected && !isCorrectOption && (
            <XCircle className="w-5 h-5 text-rose-600 animate-in zoom-in-50" />
          )}
        </div>
      )}
    </button>
  );
};
