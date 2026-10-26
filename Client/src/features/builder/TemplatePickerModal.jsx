import React, { useState } from 'react';
import {
  Layers,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { FORM_TEMPLATES } from '../../lib/templates';
import { toast } from 'sonner';

export function TemplatePickerModal({ isOpen, onClose, onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(FORM_TEMPLATES[0]);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Events & Colleges', 'Surveys & Feedback', 'Contact Forms', 'Hiring & Recruitment', 'Education & Quizzes'];

  const filteredTemplates = FORM_TEMPLATES.filter(
    (t) => activeCategory === 'All' || t.category === activeCategory
  );

  const handleApply = () => {
    if (!selectedTemplate) return;
    onSelectTemplate(selectedTemplate);
    onClose();
    toast.success(`Applied "${selectedTemplate.title}" template!`);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Start from a Form Template"
      description="Select a pre-built template to quickly launch your form with questions, field settings, and design."
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4 pt-1">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid & Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Template Cards List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1.5">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-1 ring-orange-500'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-stone-900">
                          {template.title}
                        </h4>
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 shrink-0">
                          {template.fields.length} Qs
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Template Inspector & Preview */}
          <div className="lg:col-span-7 bg-stone-50/70 border border-stone-200 rounded-2xl p-5 flex flex-col justify-between max-h-[460px]">
            {selectedTemplate ? (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-md">
                      {selectedTemplate.category}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {selectedTemplate.fields.length} pre-configured questions
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">
                    {selectedTemplate.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-stone-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                    Questions included in template:
                  </span>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {selectedTemplate.fields.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 shadow-2xs"
                      >
                        <span className="font-medium truncate">
                          <span className="text-stone-400 font-mono mr-1.5">{idx + 1}.</span>
                          {f.label}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-2xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                            {f.type}
                          </span>
                          {f.required && (
                            <span className="text-2xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-stone-400">
                Select a template from the list to preview questions
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between mt-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={handleApply}
                disabled={!selectedTemplate}
              >
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
