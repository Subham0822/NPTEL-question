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
    'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-800 bg-white';
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (!isSubmitted) {
    if (isSelected) {
      containerStyle = 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950 font-medium';
      badgeStyle = 'bg-indigo-600 text-white border-indigo-600';
    }
  } else if (showFeedback) {
    // In practice mode after submission:
    if (isCorrectOption) {
      // Always highlight correct answer in green
      containerStyle =
        'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 font-medium';
      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
    } else if (isSelected && !isCorrectOption) {
      // User selected wrong answer
      containerStyle =
        'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-500/20 font-medium';
      badgeStyle = 'bg-rose-600 text-white border-rose-600';
    } else {
      // Unselected other options
      containerStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
      badgeStyle = 'bg-slate-100 text-slate-400 border-slate-200';
    }
  } else {
    // In Exam mode: just highlight selected option
    if (isSelected) {
      containerStyle = 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950 font-medium';
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
                : 'border-slate-300 bg-white group-hover:border-slate-400'
            }`}
          >
            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        ) : (
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              isSelected
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 bg-white group-hover:border-slate-400'
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
        <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200 shrink-0">
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
