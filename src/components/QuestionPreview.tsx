import React, { useState } from 'react';
import { ParsedQuestionCandidate, QuestionType } from '../types';
import { Check, Edit2, Trash2, X, Lightbulb, CheckSquare, Circle } from 'lucide-react';

interface QuestionPreviewProps {
  question: ParsedQuestionCandidate;
  index: number;
  onUpdate: (updated: ParsedQuestionCandidate) => void;
  onDelete: () => void;
  isDuplicate?: boolean;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
  isDuplicate = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(question.question);
  const [editedType, setEditedType] = useState<QuestionType>(question.type);
  const [editedOptions, setEditedOptions] = useState<[string, string, string, string]>([
    question.options[0],
    question.options[1],
    question.options[2],
    question.options[3],
  ]);
  const [editedCorrectAnswers, setEditedCorrectAnswers] = useState<string[]>(question.correctAnswers);
  const [editedExplanation, setEditedExplanation] = useState(question.explanation || '');

  const isMultiple = question.type === 'multiple';
  const letters = ['A', 'B', 'C', 'D'];

  const handleToggleCorrectOption = (optText: string) => {
    if (editedType === 'single') {
      setEditedCorrectAnswers([optText]);
    } else {
      if (editedCorrectAnswers.includes(optText)) {
        setEditedCorrectAnswers(editedCorrectAnswers.filter((a) => a !== optText));
      } else {
        setEditedCorrectAnswers([...editedCorrectAnswers, optText]);
      }
    }
  };

  const handleSave = () => {
    if (editedCorrectAnswers.length === 0) {
      alert('Please specify at least one correct answer.');
      return;
    }
    if (editedType === 'multiple' && editedCorrectAnswers.length < 2) {
      alert('Multiple-answer questions must have at least two correct answers.');
      return;
    }

    onUpdate({
      ...question,
      question: editedText.trim(),
      type: editedType,
      options: [
        editedOptions[0].trim(),
        editedOptions[1].trim(),
        editedOptions[2].trim(),
        editedOptions[3].trim(),
      ],
      correctAnswers: editedCorrectAnswers,
      explanation: editedExplanation.trim() ? editedExplanation.trim() : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(question.question);
    setEditedType(question.type);
    setEditedOptions([
      question.options[0],
      question.options[1],
      question.options[2],
      question.options[3],
    ]);
    setEditedCorrectAnswers(question.correctAnswers);
    setEditedExplanation(question.explanation || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl border-2 border-indigo-400 p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Editing Question {index + 1}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Question Type Selection */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-600">Type:</span>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1 text-xs cursor-pointer">
              <input
                type="radio"
                name={`type-edit-${index}`}
                checked={editedType === 'single'}
                onChange={() => {
                  setEditedType('single');
                  if (editedCorrectAnswers.length > 1) {
                    setEditedCorrectAnswers([editedCorrectAnswers[0]]);
                  }
                }}
                className="text-indigo-600"
              />
              <span>Single Answer</span>
            </label>
            <label className="flex items-center space-x-1 text-xs cursor-pointer">
              <input
                type="radio"
                name={`type-edit-${index}`}
                checked={editedType === 'multiple'}
                onChange={() => setEditedType('multiple')}
                className="text-indigo-600"
              />
              <span>Multiple Answer</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Question Text</label>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Options ({editedType === 'single' ? 'Select radio for correct answer' : 'Check all correct answers'})
          </label>
          {editedOptions.map((opt, oIdx) => {
            const isCorrect = editedCorrectAnswers.includes(opt);
            return (
              <div key={oIdx} className="flex items-center space-x-2">
                <input
                  type={editedType === 'single' ? 'radio' : 'checkbox'}
                  name={`correct-ans-${index}`}
                  checked={isCorrect}
                  onChange={() => handleToggleCorrectOption(opt)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-400 w-4">{letters[oIdx]}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...editedOptions] as [string, string, string, string];
                    const oldVal = newOpts[oIdx];
                    newOpts[oIdx] = e.target.value;
                    setEditedOptions(newOpts);
                    if (editedCorrectAnswers.includes(oldVal)) {
                      setEditedCorrectAnswers(
                        editedCorrectAnswers.map((a) => (a === oldVal ? e.target.value : a))
                      );
                    }
                  }}
                  className="flex-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Explanation</label>
          <textarea
            value={editedExplanation}
            onChange={(e) => setEditedExplanation(e.target.value)}
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border p-5 transition-all shadow-xs relative ${
        isDuplicate ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
            #{index + 1}
          </span>

          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
              isMultiple
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}
          >
            {isMultiple ? 'Multiple Answer' : 'Single Answer'}
          </span>

          {isDuplicate && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-md">
              Duplicate Question
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            title="Edit Question"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete from preview"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question Body */}
      <h4 className="text-sm font-medium text-slate-900 leading-relaxed mb-3">
        {question.question}
      </h4>

      {isMultiple && (
        <div className="mb-2 text-[11px] font-semibold text-amber-700 flex items-center space-x-1">
          <CheckSquare className="w-3 h-3 text-amber-600" />
          <span>Select all that apply.</span>
        </div>
      )}

      {/* Options preview with radio/checkbox visual cues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {question.options.map((opt, oIdx) => {
          const isCorrect = question.correctAnswers.includes(opt);
          return (
            <div
              key={oIdx}
              className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-colors ${
                isCorrect
                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {/* Radio or Checkbox visual indicator */}
              <div className="shrink-0">
                {isMultiple ? (
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                )}
              </div>

              <span className="font-bold text-[11px] text-slate-400 w-3">{letters[oIdx]}.</span>
              <span className="truncate flex-1">{opt}</span>

              {isCorrect && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded shrink-0">
                  Correct
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div className="mt-3 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-900 mr-1">Explanation:</span>
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  );
};
