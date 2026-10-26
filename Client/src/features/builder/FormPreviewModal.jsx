import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  RotateCcw,
  Star,
  CheckCircle2,
  Calendar,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getContrastTextColor } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export function FormPreviewModal({ isOpen, onClose, form, fields, theme }) {
  if (!isOpen) return null;

  const [device, setDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [answers, setAnswers] = useState({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  const activeTheme = theme || form?.theme || {
    primaryColor: '#F97316',
    backgroundColor: '#FFFDF9',
    fontFamily: 'Inter',
  };

  const contrastColor = getContrastTextColor(activeTheme.backgroundColor);

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleReset = () => {
    setAnswers({});
    setPreviewSubmitted(false);
  };

  const handleSimulateSubmit = (e) => {
    e.preventDefault();
    setPreviewSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex flex-col items-center justify-start p-3 sm:p-6 animate-fade-in">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-3xl bg-white border border-stone-200 rounded-2xl shadow-xl px-4 py-2.5 mb-4 flex items-center justify-between gap-4 sticky top-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-900 tracking-tight">
            Live Respondent Preview
          </span>
          <span className="hidden sm:inline-block text-2xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
            Draft mode • Not published
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              device === 'desktop'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              device === 'mobile'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            title="Reset answers"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Container Container */}
      <div
        className={`w-full transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 my-auto ${
          device === 'mobile' ? 'max-w-md ring-8 ring-stone-800' : 'max-w-2xl'
        }`}
        style={{
          backgroundColor: activeTheme.backgroundColor,
          color: contrastColor,
          fontFamily: activeTheme.fontFamily || 'Inter',
        }}
      >
        <div className="p-6 sm:p-8 space-y-6">
          {previewSubmitted ? (
            <div className="bg-white/95 backdrop-blur-xs border border-stone-200 rounded-2xl p-8 text-center text-stone-900 shadow-card animate-scale-in">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-md"
                style={{ backgroundColor: activeTheme.primaryColor }}
              >
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Thank you!</h3>
              <p className="text-sm text-stone-600 mb-6">
                Your response was submitted in test preview mode.
              </p>
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Reset and Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Form Title & Description */}
              <div className="bg-white/95 backdrop-blur-xs border border-stone-200/80 rounded-2xl p-6 shadow-card text-stone-900">
                <h1 className="text-2xl font-bold tracking-tight">
                  {form?.title || 'Untitled Form'}
                </h1>
                {form?.description && (
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed whitespace-pre-line">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Form Questions */}
              {fields.length === 0 ? (
                <div className="bg-white/95 border border-stone-200 rounded-2xl p-8 text-center text-stone-500 text-sm">
                  No questions have been added to this form yet.
                </div>
              ) : (
                <form onSubmit={handleSimulateSubmit} className="space-y-4">
                  {fields.map((field, idx) => {
                    const val = answers[field.id];

                    return (
                      <div
                        key={field.id}
                        className="bg-white/95 backdrop-blur-xs border border-stone-200/80 rounded-2xl p-5 shadow-card text-stone-900 space-y-3"
                      >
                        <div>
                          <label className="text-sm font-semibold text-stone-900 flex items-start gap-1">
                            <span>
                              {idx + 1}. {field.label || 'Untitled Question'}
                            </span>
                            {field.required && (
                              <span
                                className="font-bold text-sm"
                                style={{ color: activeTheme.primaryColor }}
                              >
                                *
                              </span>
                            )}
                          </label>
                          {field.description && (
                            <p className="text-xs text-stone-500 mt-0.5 leading-normal">
                              {field.description}
                            </p>
                          )}
                        </div>

                        {/* short_text */}
                        {field.type === 'short_text' && (
                          <input
                            type="text"
                            value={val || ''}
                            placeholder={field.placeholder || 'Your answer'}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                          />
                        )}

                        {/* long_text */}
                        {field.type === 'long_text' && (
                          <textarea
                            rows={3}
                            value={val || ''}
                            placeholder={field.placeholder || 'Your answer'}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400 resize-y"
                          />
                        )}

                        {/* number */}
                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={val !== undefined ? val : ''}
                            placeholder={field.placeholder || 'Enter a number'}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                          />
                        )}

                        {/* email */}
                        {field.type === 'email' && (
                          <input
                            type="email"
                            value={val || ''}
                            placeholder={field.placeholder || 'name@example.com'}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                          />
                        )}

                        {/* yes_no */}
                        {field.type === 'yes_no' && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(field.id, true)}
                              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                val === true
                                  ? 'text-white border-transparent shadow-xs'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                              style={{
                                backgroundColor: val === true ? activeTheme.primaryColor : undefined,
                              }}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(field.id, false)}
                              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                val === false
                                  ? 'text-white border-transparent shadow-xs'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                              style={{
                                backgroundColor: val === false ? activeTheme.primaryColor : undefined,
                              }}
                            >
                              No
                            </button>
                          </div>
                        )}

                        {/* single_select */}
                        {field.type === 'single_select' && (
                          <div className="space-y-1.5">
                            {(field.options || []).map((opt) => (
                              <label
                                key={opt}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  val === opt
                                    ? 'border-orange-400 bg-orange-50/50'
                                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`preview_${field.id}`}
                                  value={opt}
                                  checked={val === opt}
                                  onChange={() => handleAnswerChange(field.id, opt)}
                                  className="w-4 h-4 text-orange-600 border-stone-300 focus:ring-orange-500"
                                />
                                <span className="text-xs text-stone-800">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* multi_select */}
                        {field.type === 'multi_select' && (
                          <div className="space-y-1.5">
                            {(field.options || []).map((opt) => {
                              const checked = Array.isArray(val) && val.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    checked
                                      ? 'border-orange-400 bg-orange-50/50'
                                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = Array.isArray(val) ? [...val] : [];
                                      if (e.target.checked) {
                                        handleAnswerChange(field.id, [...currentList, opt]);
                                      } else {
                                        handleAnswerChange(
                                          field.id,
                                          currentList.filter((x) => x !== opt)
                                        );
                                      }
                                    }}
                                    className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                                  />
                                  <span className="text-xs text-stone-800">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* dropdown */}
                        {field.type === 'dropdown' && (
                          <select
                            value={val || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                          >
                            <option value="">Select an option...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* checkbox */}
                        {field.type === 'checkbox' && (
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => handleAnswerChange(field.id, e.target.checked)}
                              className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                            />
                            <span className="text-xs text-stone-700">
                              {field.placeholder || 'I confirm and agree'}
                            </span>
                          </label>
                        )}

                        {/* rating */}
                        {field.type === 'rating' && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {Array.from({ length: field.validation?.max || 5 }).map((_, i) => {
                              const starNum = i + 1;
                              const isFilled = (val || 0) >= starNum;
                              return (
                                <button
                                  key={starNum}
                                  type="button"
                                  onClick={() => handleAnswerChange(field.id, starNum)}
                                  className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
                                >
                                  <Star
                                    className={`w-6 h-6 transition-all ${
                                      isFilled
                                        ? 'fill-amber-400 text-amber-400 scale-105'
                                        : 'text-stone-300 hover:text-amber-300'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* date */}
                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={val || ''}
                            min={field.validation?.minDate}
                            max={field.validation?.maxDate}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-stone-400"
                          />
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 text-sm font-semibold rounded-xl text-white shadow-md hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: activeTheme.primaryColor }}
                    >
                      <span>Simulate Submission</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="text-2xs text-stone-400 text-center pt-2">
            Powered by Easy Forms • Live Preview
          </div>
        </div>
      </div>
    </div>
  );
}
