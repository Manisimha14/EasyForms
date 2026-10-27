import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { publicApi, ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Banner } from '../../components/ui/Banner';
import { Skeleton } from '../../components/ui/Skeleton';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { getContrastTextColor } from '../../lib/format';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Star,
  Send,
  RefreshCw,
  Clock,
  Sparkles,
  Calendar,
  Lock,
  Upload,
  FileText,
  X,
} from 'lucide-react';

export function PublicFormPage() {
  const { slug: paramSlug, shareId } = useParams();
  const slug = paramSlug || shareId;

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftLastSaved, setDraftLastSaved] = useState(null);

  const draftStorageKey = `easyforms_draft_${slug}`;

  // Load public form
  const fetchForm = useCallback(async () => {
    setIsLoading(true);
    setIsUnavailable(false);
    try {
      const res = await publicApi.getForm(slug);
      if (res.success && res.data) {
        setForm(res.data);
        // Initialize answers with defaults if needed
        const initial = {};
        (res.data.fields || []).forEach((f) => {
          if (f.type === 'multi_select') {
            initial[f.id] = [];
          }
        });

        // Restore draft from localStorage if present
        try {
          const saved = localStorage.getItem(`easyforms_draft_${slug}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              setAnswers({ ...initial, ...parsed });
              setDraftRestored(true);
            } else {
              setAnswers(initial);
            }
          } else {
            setAnswers(initial);
          }
        } catch {
          setAnswers(initial);
        }
      }
    } catch (err) {
      if (err.status === 404) {
        setIsUnavailable(true);
      } else {
        setFormError('Failed to load form. Please refresh the page.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // Auto-save draft to localStorage whenever answers change
  useEffect(() => {
    if (!form || !slug || isSubmitted || Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(answers));
      setDraftLastSaved(Date.now());
    } catch {
      // Ignore storage quota limits
    }
  }, [answers, form, slug, isSubmitted, draftStorageKey]);

  // Reset/clear restored draft
  const handleClearDraft = () => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
    const initial = {};
    (form?.fields || []).forEach((f) => {
      if (f.type === 'multi_select') {
        initial[f.id] = [];
      }
    });
    setAnswers(initial);
    setDraftRestored(false);
    setDraftLastSaved(null);
  };

  // Handle file uploads (converts file to base64 Data URL)
  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMb = field.validation?.maxSizeMb || 5;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrors((prev) => ({
        ...prev,
        [field.id]: `File size exceeds the ${maxSizeMb} MB limit.`,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleAnswerChange(field.id, {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => {
      setErrors((prev) => ({
        ...prev,
        [field.id]: 'Failed to read file. Please try another file.',
      }));
    };
    reader.readAsDataURL(file);
  };

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => (prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  // Handle value change for an answer
  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear specific error on change
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    if (!form || !form.fields) return;

    // Build payload: omit unanswered optional fields!
    // Send numbers as numbers, booleans as booleans, ratings as integers
    const formattedAnswers = [];

    for (const field of form.fields) {
      const val = answers[field.id];

      // Check required
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0) ||
        (field.type === 'file_upload' && (!val || (!val.dataUrl && !val.url)));

      if (field.required && isEmpty) {
        setErrors((prev) => ({
          ...prev,
          [field.id]: 'This question is required.',
        }));
        return;
      }

      if (isEmpty) {
        continue; // Omit unanswered optional
      }

      let finalVal = val;
      if (field.type === 'number') {
        finalVal = Number(val);
      } else if (field.type === 'rating') {
        finalVal = parseInt(val, 10);
      } else if (field.type === 'yes_no' || field.type === 'checkbox') {
        finalVal = Boolean(val);
      } else if (typeof val === 'string') {
        finalVal = val.trim();
      }

      formattedAnswers.push({
        fieldId: field.id,
        value: finalVal,
      });
    }

    setIsSubmitting(true);

    try {
      const res = await publicApi.submitResponse(slug, formattedAnswers);
      if (res.success) {
        setIsSubmitted(true);
        try {
          localStorage.removeItem(draftStorageKey);
        } catch {
          // Ignore
        }
        // Trigger celebratory confetti animation!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err) {
      if (err.status === 400 && err.details?.length) {
        // Map field-level error details
        const mappedErrors = {};
        err.details.forEach((d) => {
          if (d.path && d.path.startsWith('answers.')) {
            const fieldId = d.path.slice('answers.'.length);
            mappedErrors[fieldId] = d.message;
          } else {
            setFormError(d.message || 'Please check your answers.');
          }
        });
        setErrors(mappedErrors);
      } else if (err.status === 403) {
        setFormError(err.message || 'This form is no longer accepting submissions.');
      } else if (err.status === 429) {
        const retrySec = err.retryAfter || 60;
        setRateLimitCountdown(retrySec);
        setFormError(`Rate limit reached. Please wait ${retrySec} seconds before submitting again.`);
      } else if (err.status === 404) {
        setIsUnavailable(true);
      } else {
        setFormError(err.message || 'Failed to submit response. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setAnswers({});
    setErrors({});
    setFormError('');
  };

  // 404 Friendly Unavailable Page
  if (isUnavailable) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Form Unavailable
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            This form is either no longer accepting submissions or the link is invalid. Please contact the form creator for assistance.
          </p>
          <div className="text-xs text-slate-400">
            Powered by Easy Forms
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-2xl p-8 shadow-card space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const theme = form?.theme || {
    primaryColor: '#F97316',
    backgroundColor: '#FFFDF9',
    fontFamily: 'Inter',
  };

  const contrastColor = getContrastTextColor(theme.backgroundColor);

  // Scheduled Form Screen (Form published but startAt in future)
  if (form?.availability?.status === 'scheduled') {
    const formattedStart = form.availability.startAt
      ? new Date(form.availability.startAt).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : null;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
        style={{
          backgroundColor: theme.backgroundColor,
          color: contrastColor,
          fontFamily: theme.fontFamily,
        }}
      >
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-sm border border-stone-200/80 rounded-2xl p-8 text-center shadow-card text-stone-900 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Calendar className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            This form is not accepting responses yet
          </h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            {formattedStart
              ? `This form is scheduled to open for submissions on ${formattedStart}.`
              : 'This form has been scheduled by its creator to open at a future time.'}
          </p>

          {/* Live Launch Countdown Timer */}
          {form?.availability?.startAt && (
            <div className="mb-6 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/70">
              <CountdownTimer
                targetDate={form.availability.startAt}
                variant="card"
                label="Opening Countdown"
                onExpire={() => {
                  fetchForm();
                }}
              />
            </div>
          )}

          {form?.description && (
            <div className="text-xs text-stone-500 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 mb-6 text-left">
              <strong className="block text-stone-700 font-semibold mb-1">About {form.title}:</strong>
              {form.description}
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchForm()}
              className="text-xs"
            >
              Check Availability Now
            </Button>
          </div>

          <div className="text-xs text-stone-400 pt-6 mt-6 border-t border-stone-100">
            Powered by Easy Forms
          </div>
        </div>
      </div>
    );
  }

  // Closed Form Screen (Expired by endAt or maxResponses limit)
  if (form?.availability?.status === 'closed') {
    const isCapReached = form.availability?.maxResponses != null;
    const formattedEnd = form.availability?.endAt
      ? new Date(form.availability.endAt).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : null;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
        style={{
          backgroundColor: theme.backgroundColor,
          color: contrastColor,
          fontFamily: theme.fontFamily,
        }}
      >
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm border border-stone-200/80 rounded-2xl p-8 text-center shadow-card text-stone-900 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-600 border border-stone-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            This form is now closed
          </h2>
          <p className="text-sm text-stone-600 mb-4 leading-relaxed">
            {formattedEnd
              ? `This form concluded on ${formattedEnd} and is no longer accepting submissions.`
              : isCapReached
              ? 'This form has reached its maximum response capacity and is no longer accepting new submissions.'
              : 'This form is no longer accepting submissions. If you believe this is in error, please contact the form owner.'}
          </p>

          {form?.description && (
            <div className="text-xs text-stone-500 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 mb-6 text-left">
              <strong className="block text-stone-700 font-semibold mb-1">About {form.title}:</strong>
              {form.description}
            </div>
          )}

          <div className="text-xs text-stone-400 pt-4 border-t border-stone-100">
            Powered by Easy Forms
          </div>
        </div>
      </div>
    );
  }

  // Success Thank-You Screen
  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
        style={{
          backgroundColor: theme.backgroundColor,
          color: contrastColor,
          fontFamily: theme.fontFamily,
        }}
      >
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-8 text-center shadow-elevated text-slate-900 animate-scale-in">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white shadow-md"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <CheckCircle2 className="w-8 h-8 stroke-[2]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Thank you!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your response has been recorded successfully.
          </p>
          <Button
            variant="secondary"
            className="w-full justify-center"
            onClick={handleReset}
          >
            Submit Another Response
          </Button>
          <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">
            Powered by Easy Forms
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-10 px-4 transition-colors duration-300 flex flex-col justify-between"
      style={{
        backgroundColor: theme.backgroundColor,
        color: contrastColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Active Time-Limited Deadline Banner */}
        {form?.availability?.endAt && (
          <div className="mb-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 stroke-[2] animate-pulse" />
              </div>
              <div>
                <span className="font-semibold block text-amber-900 text-sm leading-tight">Time-Limited Form</span>
                <span className="text-amber-700 text-xs">
                  Accepting responses until {new Date(form.availability.endAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
            <CountdownTimer
              targetDate={form.availability.endAt}
              variant="compact"
              label="Closes in"
              onExpire={() => {
                fetchForm();
              }}
            />
          </div>
        )}

        {/* Form Header Box */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-card text-slate-900 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {form?.title}
          </h1>
          {form?.description && (
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
              {form?.description}
            </p>
          )}
        </div>

        {formError && (
          <div className="mb-6">
            <Banner type="error">{formError}</Banner>
          </div>
        )}

        {/* Draft Restored Banner */}
        {draftRestored && (
          <div className="flex items-center justify-between p-3.5 mb-6 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>Draft restored:</strong> Your previous progress was recovered automatically.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900 underline shrink-0 ml-3 cursor-pointer"
            >
              Clear draft
            </button>
          </div>
        )}

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {(form?.fields || []).map((field, idx) => {
            const error = errors[field.id];
            const val = answers[field.id];

            return (
              <div
                key={field.id}
                className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-6 shadow-card text-slate-900 transition-all hover:border-slate-300 space-y-3"
              >
                {/* Question Label */}
                <div>
                  <label className="text-base font-semibold text-slate-900 flex items-start gap-1">
                    <span>
                      {idx + 1}. {field.label}
                    </span>
                    {field.required && (
                      <span
                        className="font-bold text-base"
                        style={{ color: theme.primaryColor }}
                      >
                        *
                      </span>
                    )}
                  </label>
                  {field.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      {field.description}
                    </p>
                  )}
                </div>

                {/* Input Controls for each of the 11 Types */}

                {/* 1. short_text */}
                {field.type === 'short_text' && (
                  <input
                    type="text"
                    value={val || ''}
                    placeholder={field.placeholder || 'Your answer'}
                    minLength={field.validation?.minLength}
                    maxLength={field.validation?.maxLength}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  />
                )}

                {/* 2. long_text */}
                {field.type === 'long_text' && (
                  <textarea
                    rows={4}
                    value={val || ''}
                    placeholder={field.placeholder || 'Your answer'}
                    minLength={field.validation?.minLength}
                    maxLength={field.validation?.maxLength}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-y"
                  />
                )}

                {/* 3. number */}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={val !== undefined ? val : ''}
                    placeholder={field.placeholder || 'Enter a number'}
                    min={field.validation?.min}
                    max={field.validation?.max}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  />
                )}

                {/* 4. email */}
                {field.type === 'email' && (
                  <input
                    type="email"
                    value={val || ''}
                    placeholder={field.placeholder || 'name@example.com'}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  />
                )}

                {/* 5. yes_no */}
                {field.type === 'yes_no' && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(field.id, true)}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                        val === true
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      style={val === true ? { backgroundColor: theme.primaryColor } : {}}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(field.id, false)}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                        val === false
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      style={val === false ? { backgroundColor: theme.primaryColor } : {}}
                    >
                      No
                    </button>
                  </div>
                )}

                {/* 6. single_select (Radio Group) */}
                {field.type === 'single_select' && (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          val === opt
                            ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          checked={val === opt}
                          onChange={() => handleAnswerChange(field.id, opt)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-slate-800">
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* 7. multi_select (Checkbox Group) */}
                {field.type === 'multi_select' && (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt) => {
                      const selectedList = Array.isArray(val) ? val : [];
                      const isChecked = selectedList.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleAnswerChange(field.id, [...selectedList, opt]);
                              } else {
                                handleAnswerChange(
                                  field.id,
                                  selectedList.filter((x) => x !== opt)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-slate-800">
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 8. checkbox (Single Boolean Toggle) */}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) => handleAnswerChange(field.id, e.target.checked)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      {field.placeholder || 'I confirm and agree'}
                    </span>
                  </label>
                )}

                {/* 9. dropdown */}
                {field.type === 'dropdown' && (
                  <select
                    value={val || ''}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">
                      {field.placeholder || 'Select an option...'}
                    </option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {/* 10. rating (1 to max) */}
                {field.type === 'rating' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {Array.from(
                      { length: field.validation?.max || 5 },
                      (_, i) => i + 1
                    ).map((ratingNum) => {
                      const isSelected = val === ratingNum;
                      return (
                        <button
                          key={ratingNum}
                          type="button"
                          onClick={() => handleAnswerChange(field.id, ratingNum)}
                          className={`w-11 h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                            isSelected
                              ? 'text-white shadow-md scale-105'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: theme.primaryColor }
                              : {}
                          }
                        >
                          <Star
                            className={`w-4 h-4 mr-1 ${
                              isSelected ? 'fill-white stroke-white' : 'stroke-slate-500'
                            }`}
                          />
                          {ratingNum}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 11. date */}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={val || ''}
                    min={field.validation?.minDate}
                    max={field.validation?.maxDate}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}

                {/* 12. file_upload */}
                {field.type === 'file_upload' && (
                  <div>
                    {val && (val.dataUrl || val.url || val.name) ? (
                      <div className="flex items-center justify-between p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          {val.type?.startsWith('image/') && val.dataUrl ? (
                            <img
                              src={val.dataUrl}
                              alt="preview"
                              className="w-10 h-10 object-cover rounded-lg border border-orange-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {val.name || 'Uploaded File'}
                            </p>
                            {val.size && (
                              <p className="text-[11px] text-stone-500">
                                {(val.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(field.id, null)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 hover:border-orange-400 rounded-xl p-6 bg-stone-50/50 hover:bg-orange-50/20 cursor-pointer transition-colors group">
                        <input
                          type="file"
                          className="hidden"
                          accept={field.validation?.allowedExtensions?.join(',') || 'image/*,.pdf,.doc,.docx,.txt'}
                          onChange={(e) => handleFileUpload(field, e)}
                        />
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-2 group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-stone-800">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          PDF, Word, or Images up to {field.validation?.maxSizeMb || 5} MB
                        </p>
                      </label>
                    )}
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-xs text-rose-600 font-semibold animate-fade-in flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </p>
                )}
              </div>
            );
          })}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || rateLimitCountdown !== null}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Submitting response...
                </>
              ) : rateLimitCountdown !== null ? (
                <>
                  <Clock className="w-5 h-5" />
                  Please wait {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Response
                </>
              )}
            </button>
            {draftLastSaved && !isSubmitted && (
              <p className="text-center text-xs text-stone-400 mt-2.5 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Draft saved locally — progress won't be lost
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="text-center pt-10 text-xs opacity-60">
        Easy Forms — Clean, Accessible Form Builder
      </footer>
    </div>
  );
}
