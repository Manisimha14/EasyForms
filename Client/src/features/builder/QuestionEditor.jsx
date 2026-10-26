import React, { useState } from 'react';
import {
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Type,
  AlignLeft,
  Hash,
  ToggleLeft,
  Mail,
  CheckCircle,
  CheckSquare,
  Square,
  ListFilter,
  Star,
  Calendar,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { QUESTION_TYPES, LIMITS } from '../../lib/constants';

const typeIcons = {
  short_text: Type,
  long_text: AlignLeft,
  number: Hash,
  yes_no: ToggleLeft,
  email: Mail,
  single_select: CheckCircle,
  multi_select: CheckSquare,
  checkbox: Square,
  dropdown: ListFilter,
  rating: Star,
  date: Calendar,
};

export function QuestionEditor({
  field,
  index,
  totalFields,
  onChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const Icon = typeIcons[field.type] || Type;

  const handleTypeChange = (newType) => {
    const updated = {
      ...field,
      type: newType,
      validation: {},
    };

    if (['single_select', 'multi_select', 'dropdown'].includes(newType)) {
      if (!field.options || field.options.length === 0) {
        updated.options = ['Option 1', 'Option 2'];
      }
    } else {
      delete updated.options;
    }

    if (newType === 'rating') {
      updated.validation = { min: 1, max: 5 };
    }

    onChange(updated);
  };

  const updateValidation = (key, val) => {
    onChange({
      ...field,
      validation: {
        ...(field.validation || {}),
        [key]: val === '' ? undefined : val,
      },
    });
  };

  // Option management for single_select, multi_select, dropdown
  const handleAddOption = () => {
    const current = field.options || [];
    if (current.length >= LIMITS.OPTIONS_MAX) return;
    onChange({
      ...field,
      options: [...current, `Option ${current.length + 1}`],
    });
  };

  const handleOptionChange = (optIndex, value) => {
    const next = [...(field.options || [])];
    next[optIndex] = value;
    onChange({
      ...field,
      options: next,
    });
  };

  const handleRemoveOption = (optIndex) => {
    const current = field.options || [];
    if (current.length <= 1) return;
    onChange({
      ...field,
      options: current.filter((_, i) => i !== optIndex),
    });
  };

  // Detect if any advanced rule is configured to display an indicator badge
  const hasAdvancedConfig = Boolean(
    field.description?.trim() ||
      field.placeholder?.trim() ||
      field.validation?.minLength ||
      field.validation?.maxLength ||
      field.validation?.min !== undefined ||
      field.validation?.max !== undefined ||
      field.validation?.minDate ||
      field.validation?.maxDate
  );

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-stone-300 hover:shadow-subtle focus-within:border-orange-400 space-y-3.5">
      {/* Top Header Strip: Index, Type Selector, Required Toggle, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2">
          {/* Question Index Pill */}
          <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 text-xs font-bold flex items-center justify-center shrink-0 border border-orange-200">
            {index + 1}
          </span>

          {/* Grouped Type Selector */}
          <div className="relative">
            <select
              value={field.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="pl-7 pr-3 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200/70 border border-stone-200/70 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-colors"
            >
              <optgroup label="Text">
                <option value="short_text">Short Text</option>
                <option value="long_text">Long Text</option>
                <option value="email">Email</option>
              </optgroup>
              <optgroup label="Choice">
                <option value="single_select">Single Select</option>
                <option value="multi_select">Multi Select</option>
                <option value="dropdown">Dropdown</option>
                <option value="yes_no">Yes / No</option>
                <option value="checkbox">Checkbox</option>
              </optgroup>
              <optgroup label="Other">
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="rating">Rating</option>
              </optgroup>
            </select>
            <Icon className="w-3.5 h-3.5 text-orange-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Controls: Required Toggle + Reorder & Duplication & Delete */}
        <div className="flex items-center gap-1.5">
          {/* Required Pill Button */}
          <button
            type="button"
            onClick={() => onChange({ ...field, required: !field.required })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl border transition-all ${
              field.required
                ? 'bg-orange-50 border-orange-200 text-orange-700 font-semibold shadow-xs'
                : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700'
            }`}
            title="Toggle required status"
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                field.required ? 'bg-orange-500' : 'bg-stone-300'
              }`}
            />
            <span>Required</span>
          </button>

          <div className="h-4 w-px bg-stone-200 mx-0.5" />

          {/* Reorder Buttons */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Move question up"
            aria-label="Move question up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalFields - 1}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg disabled:opacity-20 disabled:pointer-events-none transition-colors"
            title="Move question down"
            aria-label="Move question down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Duplicate question"
            aria-label="Duplicate question"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button with Confirmation Popover */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-xl animate-fade-in">
              <span className="text-2xs font-semibold text-rose-700">Delete?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
                className="px-1.5 py-0.5 text-2xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-1.5 py-0.5 text-2xs font-medium text-stone-600 hover:bg-stone-200/60 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete question"
              aria-label="Delete question"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Row: Question Label Input */}
      <div>
        <div className="relative">
          <input
            type="text"
            value={field.label}
            maxLength={LIMITS.LABEL_MAX}
            placeholder="e.g. What is your full name?"
            required
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            className="w-full px-3 py-2 text-sm sm:text-base font-semibold text-stone-900 bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-stone-200/80 focus:border-orange-400 rounded-xl focus:outline-none transition-all placeholder:text-stone-400 placeholder:font-normal"
          />
        </div>
      </div>

      {/* Options for Choice Types (single_select, multi_select, dropdown) */}
      {['single_select', 'multi_select', 'dropdown'].includes(field.type) && (
        <div className="space-y-2 pt-1">
          <div className="space-y-1.5">
            {(field.options || []).map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-400 w-5 text-right">
                  {optIndex + 1}.
                </span>
                <input
                  type="text"
                  value={opt}
                  maxLength={LIMITS.OPTION_TEXT_MAX}
                  required
                  placeholder={`Option ${optIndex + 1}`}
                  onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200/80 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optIndex)}
                  disabled={field.options.length <= 1}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg disabled:opacity-20 transition-colors"
                  title="Remove option"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5 pt-0.5 ml-7 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Option
          </button>
        </div>
      )}

      {/* Collapsible Advanced Settings & Validation Section */}
      <div className="pt-1 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors py-1"
        >
          <SlidersHorizontal className="w-3 h-3 text-stone-400" />
          <span>More options & validation</span>
          {hasAdvancedConfig && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Custom validation set" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isExpanded && (
          <div className="pt-3 pb-1 space-y-3 animate-fade-in">
            {/* Helper Description & Placeholder inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                  Helper / Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="Clarify what this question is asking"
                  value={field.description || ''}
                  maxLength={LIMITS.FIELD_DESCRIPTION_MAX}
                  onChange={(e) => onChange({ ...field, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                />
              </div>

              {!['yes_no', 'checkbox', 'rating', 'date'].includes(field.type) && (
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Placeholder text (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Type your answer here..."
                    value={field.placeholder || ''}
                    maxLength={LIMITS.PLACEHOLDER_MAX}
                    onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
              )}
            </div>

            {/* Validation settings by type */}
            {(field.type === 'short_text' || field.type === 'long_text') && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="w-32">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Min Length
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="None"
                    value={field.validation?.minLength ?? ''}
                    onChange={(e) =>
                      updateValidation('minLength', e.target.value ? parseInt(e.target.value, 10) : '')
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="w-32">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Max Length
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="None"
                    value={field.validation?.maxLength ?? ''}
                    onChange={(e) =>
                      updateValidation('maxLength', e.target.value ? parseInt(e.target.value, 10) : '')
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            )}

            {field.type === 'number' && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="w-32">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Min Value
                  </label>
                  <input
                    type="number"
                    placeholder="None"
                    value={field.validation?.min ?? ''}
                    onChange={(e) =>
                      updateValidation('min', e.target.value ? parseFloat(e.target.value) : '')
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="w-32">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Max Value
                  </label>
                  <input
                    type="number"
                    placeholder="None"
                    value={field.validation?.max ?? ''}
                    onChange={(e) =>
                      updateValidation('max', e.target.value ? parseFloat(e.target.value) : '')
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            )}

            {field.type === 'rating' && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="w-36">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Rating Scale
                  </label>
                  <select
                    value={field.validation?.max ?? 5}
                    onChange={(e) => updateValidation('max', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        1 to {num} Stars
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {field.type === 'date' && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="w-36">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Earliest Date
                  </label>
                  <input
                    type="date"
                    value={field.validation?.minDate ?? ''}
                    onChange={(e) => updateValidation('minDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="w-36">
                  <label className="text-2xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                    Latest Date
                  </label>
                  <input
                    type="date"
                    value={field.validation?.maxDate ?? ''}
                    onChange={(e) => updateValidation('maxDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:bg-white focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-2xs text-stone-400 font-mono">
              <span>Question ID: {field.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
