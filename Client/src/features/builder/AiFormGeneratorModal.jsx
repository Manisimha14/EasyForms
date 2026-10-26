import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Wand2,
  CheckCircle2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { aiApi } from '../../api/client';
import { toast } from 'sonner';

const SAMPLE_PROMPTS = [
  'Create a college event registration form with name, email, department, and attendance preference.',
  'Customer feedback survey with star rating, favorite features, improvements, and recommendation.',
  'Job application form for a Software Engineer with portfolio link, experience, and start date.',
  'Food and dietary preferences survey with meal options, allergies, cuisines, and spice tolerance.',
  'Knowledge quiz on web development and databases with multiple choice questions.',
];

export function AiFormGeneratorModal({ isOpen, onClose, onApplyForm }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);

  const handleGenerate = async (customPrompt) => {
    const text = customPrompt || prompt;
    if (!text.trim()) {
      toast.error('Please enter a description for your form.');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);
    setSelectedFieldIds([]);

    try {
      const res = await aiApi.generateForm(text.trim());
      if (res.success && res.data) {
        setGeneratedResult(res.data);
        const allIds = (res.data.fields || []).map((f, i) => f.id || `fld_${i}`);
        setSelectedFieldIds(allIds);
        toast.success(`Generated ${res.data.fields?.length || 0} questions for your form!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFieldSelection = (fieldId) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleToggleAll = () => {
    if (!generatedResult?.fields) return;
    const allIds = generatedResult.fields.map((f, i) => f.id || `fld_${i}`);
    if (selectedFieldIds.length === allIds.length) {
      setSelectedFieldIds([]);
    } else {
      setSelectedFieldIds(allIds);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    const fieldsToInsert = (generatedResult.fields || []).filter((f, i) =>
      selectedFieldIds.includes(f.id || `fld_${i}`)
    );

    if (fieldsToInsert.length === 0) {
      toast.error('Please select at least one question to insert.');
      return;
    }

    onApplyForm({
      ...generatedResult,
      fields: fieldsToInsert,
    });
    onClose();
    setGeneratedResult(null);
    setSelectedFieldIds([]);
    setPrompt('');
  };

  const totalGenerated = generatedResult?.fields?.length || 0;
  const selectedCount = selectedFieldIds.length;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Formly AI Form Generator"
      description="Describe the form you want to create and Formly AI will generate questions for you."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-1">
        {/* Clean, User-Facing Single-Line Banner */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-orange-50 border border-orange-200/80 text-xs text-orange-950 font-medium">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <span className="truncate">
            Describe your form in plain English and Formly AI will draft your questions, choices, and settings automatically.
          </span>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 block mb-1.5">
            Describe your form:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. Knowing about the food preferences of the person, dietary needs, and spice level..."
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y"
          />
        </div>

        {/* Quick Prompt Suggestions */}
        <div>
          <span className="text-2xs font-semibold text-stone-500 block mb-1.5">
            Quick suggestion prompts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sample);
                  handleGenerate(sample);
                }}
                disabled={isGenerating}
                className="text-2xs px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-800 text-stone-600 transition-all text-left truncate max-w-full"
              >
                💡 {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Preview of Generated Form with Question Selection Checkboxes */}
        {generatedResult && (
          <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3 animate-fade-in max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-stone-900 truncate">
                  {generatedResult.title}
                </h4>
                <p className="text-2xs text-stone-500 truncate">
                  {generatedResult.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-2xs font-semibold text-orange-700 hover:text-orange-900 hover:underline"
                >
                  {selectedCount === totalGenerated ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                  {selectedCount} of {totalGenerated} selected
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              {(generatedResult.fields || []).map((f, i) => {
                const fieldId = f.id || `fld_${i}`;
                const isSelected = selectedFieldIds.includes(fieldId);

                return (
                  <div
                    key={fieldId}
                    onClick={() => toggleFieldSelection(fieldId)}
                    className={`flex items-center justify-between gap-3 text-xs p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-orange-300 shadow-2xs text-stone-900 ring-1 ring-orange-200/60'
                        : 'bg-stone-100/60 border-stone-200 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 text-orange-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 fill-orange-500 text-white" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-300" />
                        )}
                      </div>
                      <span className="font-medium truncate">
                        <span className="text-stone-400 font-mono mr-1.5">{i + 1}.</span>
                        {f.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                        {f.type}
                      </span>
                      {f.required && (
                        <span className="text-2xs font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {!generatedResult ? (
              <Button
                variant="primary"
                size="sm"
                icon={isGenerating ? Loader2 : Wand2}
                isLoading={isGenerating}
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? 'Generating with Formly AI...' : 'Generate with Formly AI'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={handleApply}
                disabled={selectedCount === 0}
              >
                Insert Selected ({selectedCount} Questions)
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
