import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  Mail,
  CheckCircle,
  CheckSquare,
  Square,
  ListFilter,
  ToggleLeft,
  Hash,
  Calendar,
  Star,
  Plus,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';
import { LIMITS } from '../../lib/constants';

export const QUESTION_CATEGORIES = [
  {
    category: 'Text',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    types: [
      { id: 'short_text', label: 'Short Text', icon: Type, description: 'Single line text input' },
      { id: 'long_text', label: 'Long Text', icon: AlignLeft, description: 'Multi-line paragraph' },
      { id: 'email', label: 'Email', icon: Mail, description: 'Email address with validation' },
    ],
  },
  {
    category: 'Choice',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    types: [
      { id: 'single_select', label: 'Single Select', icon: CheckCircle, description: 'Radio buttons (one choice)' },
      { id: 'multi_select', label: 'Multi Select', icon: CheckSquare, description: 'Checkboxes (multiple choices)' },
      { id: 'dropdown', label: 'Dropdown', icon: ListFilter, description: 'Select dropdown menu' },
      { id: 'yes_no', label: 'Yes / No', icon: ToggleLeft, description: 'Binary boolean choice' },
      { id: 'checkbox', label: 'Checkbox', icon: Square, description: 'Single confirmation toggle' },
    ],
  },
  {
    category: 'Other',
    color: 'text-stone-600 bg-stone-100 border-stone-200',
    types: [
      { id: 'number', label: 'Number', icon: Hash, description: 'Numeric values & ranges' },
      { id: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
      { id: 'rating', label: 'Rating', icon: Star, description: 'Star rating scale' },
      { id: 'file_upload', label: 'File Upload', icon: Upload, description: 'Resumes, images, or PDFs' },
    ],
  },
];

export function AddQuestionPalette({ onAdd, currentCount, onOpenAiModal, onOpenTemplatesModal }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const isMaxReached = currentCount >= LIMITS.FIELDS_MAX;

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">Add a Question</h3>
            <p className="text-2xs text-stone-500">Pick from 11 question types across Text, Choice, and Other</p>
          </div>
        </div>

        {/* Actions: AI Generate, Templates, Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenAiModal && (
            <button
              type="button"
              onClick={onOpenAiModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs hover:brightness-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Form Generator</span>
            </button>
          )}

          {onOpenTemplatesModal && (
            <button
              type="button"
              onClick={onOpenTemplatesModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-stone-700 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Templates</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All
            </button>
            {QUESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setActiveCategory(cat.category)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeCategory === cat.category
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Question Buttons */}
      <div className="space-y-3">
        {QUESTION_CATEGORIES.filter(
          (cat) => activeCategory === 'all' || activeCategory === cat.category
        ).map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            {activeCategory === 'all' && (
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-400 block px-1">
                {cat.category}
              </span>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {cat.types.map((qt) => {
                const Icon = qt.icon;
                return (
                  <button
                    key={qt.id}
                    type="button"
                    disabled={isMaxReached}
                    onClick={() => onAdd(qt.id)}
                    className="group relative flex items-center gap-2 p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-orange-50/60 hover:border-orange-300 hover:shadow-xs transition-all text-left disabled:opacity-40 disabled:pointer-events-none"
                    title={qt.description}
                  >
                    <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 group-hover:border-orange-300 group-hover:bg-orange-500 group-hover:text-white text-stone-600 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <span className="text-xs font-medium text-stone-700 group-hover:text-stone-900 group-hover:font-semibold truncate">
                      {qt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
