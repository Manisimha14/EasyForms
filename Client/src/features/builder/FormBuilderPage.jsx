import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { formsApi } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Dialog } from '../../components/ui/Dialog';
import { Banner } from '../../components/ui/Banner';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { QuestionEditor } from './QuestionEditor';
import { AddQuestionPalette } from './AddQuestionPalette';
import { FormPreviewModal } from './FormPreviewModal';
import { AiFormGeneratorModal } from './AiFormGeneratorModal';
import { TemplatePickerModal } from './TemplatePickerModal';
import { ThemeTab } from './ThemeTab';
import { SettingsTab } from './SettingsTab';
import { QrShareModal } from '../../components/ui/QrShareModal';
import { LIMITS } from '../../lib/constants';
import {
  Save,
  Send,
  Eye,
  Plus,
  ArrowLeft,
  ExternalLink,
  ListOrdered,
  Palette,
  Settings,
  QrCode,
  Check,
  AlertCircle,
  Loader2,
  Edit2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export function FormBuilderPage() {
  const { id: paramId, formId } = useParams();
  const id = paramId || formId;
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [revision, setRevision] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [warnings, setWarnings] = useState([]);

  // Title inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Modals
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [publishErrors, setPublishErrors] = useState([]);
  const [publishing, setPublishing] = useState(false);

  const handleApplyTemplate = (template) => {
    if (template.fields) {
      setFields(template.fields.map((f, i) => ({ ...f, order: i })));
      setIsDirty(true);
    }
    if (template.theme) {
      setForm((prev) => ({ ...prev, theme: template.theme }));
    }
    if (template.title && (!form?.title || form.title.startsWith('Untitled'))) {
      setForm((prev) => ({
        ...prev,
        title: template.title,
        description: template.description || prev.description,
      }));
      setTitleDraft(template.title);
    }
  };

  const handleApplyAiForm = (generated) => {
    if (generated.fields) {
      setFields(generated.fields.map((f, i) => ({ ...f, order: i })));
      setIsDirty(true);
    }
    if (generated.theme) {
      setForm((prev) => ({ ...prev, theme: generated.theme }));
    }
    if (generated.title) {
      setForm((prev) => ({
        ...prev,
        title: generated.title,
        description: generated.description || prev.description,
      }));
      setTitleDraft(generated.title);
    }
  };

  // Load Form and ETag
  const loadForm = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await formsApi.getById(id);
      if (res.success && res.data) {
        setForm(res.data);
        setTitleDraft(res.data.title || '');
        const sortedFields = [...(res.data.fields || [])].sort((a, b) => a.order - b.order);
        setFields(sortedFields);
        setRevision(res.etag || `"${res.data.revision}"`);
        setIsDirty(false);
      }
    } catch (err) {
      if (err.status === 404) {
        toast.error('Form not found');
        navigate('/forms');
      } else {
        toast.error('Failed to load form details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  // Prevent accidental navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Inline Title Save
  const handleSaveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(form?.title || '');
      setIsEditingTitle(false);
      return;
    }
    if (trimmed === form?.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const res = await formsApi.updateMetadata(id, { title: trimmed }, revision);
      if (res.success && res.data) {
        setForm(res.data);
        setRevision(res.etag || revision);
        toast.success('Form title updated');
      }
    } catch (err) {
      if (err.status === 412) {
        setConflictModalOpen(true);
      } else {
        toast.error(err.message || 'Failed to update title');
      }
    } finally {
      setIsEditingTitle(false);
    }
  };

  // Question Management
  const handleAddField = (type = 'short_text') => {
    if (fields.length >= LIMITS.FIELDS_MAX) {
      toast.error(`Maximum limit of ${LIMITS.FIELDS_MAX} questions reached.`);
      return;
    }

    const newField = {
      id: `fld_${nanoid(8)}`,
      label: `Untitled Question`,
      type,
      required: false,
      placeholder: '',
      description: '',
      order: fields.length,
      options: ['single_select', 'multi_select', 'dropdown'].includes(type)
        ? ['Option 1', 'Option 2']
        : undefined,
      validation: type === 'rating' ? { min: 1, max: 5 } : {},
    };

    setFields([...fields, newField]);
    setIsDirty(true);
  };

  const handleUpdateField = (index, updatedField) => {
    const next = [...fields];
    next[index] = updatedField;
    setFields(next);
    setIsDirty(true);
  };

  const handleDeleteField = (index) => {
    const next = fields
      .filter((_, i) => i !== index)
      .map((f, i) => ({ ...f, order: i }));
    setFields(next);
    setIsDirty(true);
  };

  const handleDuplicateField = (index) => {
    if (fields.length >= LIMITS.FIELDS_MAX) {
      toast.error(`Maximum limit of ${LIMITS.FIELDS_MAX} questions reached.`);
      return;
    }
    const source = fields[index];
    const duplicated = {
      ...source,
      id: `fld_${nanoid(8)}`,
      label: `${source.label} (Copy)`,
      order: index + 1,
    };
    const next = [...fields];
    next.splice(index + 1, 0, duplicated);
    const reordered = next.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    setIsDirty(true);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const next = [...fields];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    const reordered = next.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    setIsDirty(true);
  };

  // Save Fields
  const handleSaveFields = async () => {
    if (isSaving || publishing) return;

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label.trim()) {
        toast.error(`Question ${i + 1} must have a label.`);
        return;
      }
      if (['single_select', 'multi_select', 'dropdown'].includes(f.type)) {
        if (!f.options || f.options.length === 0) {
          toast.error(`Question ${i + 1} (${f.label}) must have at least one option.`);
          return;
        }
        const trimmedOptions = f.options.map((o) => o.trim());
        const uniqueOptions = new Set(trimmedOptions);
        if (uniqueOptions.size !== trimmedOptions.length) {
          toast.error(`Question ${i + 1} contains duplicate options.`);
          return;
        }
      }
    }

    setIsSaving(true);
    setWarnings([]);

    try {
      const sanitizedFields = fields.map((f, idx) => {
        const item = {
          id: f.id || `fld_${nanoid(8)}`,
          label: (f.label || '').trim(),
          type: f.type,
          required: Boolean(f.required),
          placeholder: typeof f.placeholder === 'string' ? f.placeholder.trim() : '',
          description: typeof f.description === 'string' ? f.description.trim() : '',
          order: idx,
        };

        if (['single_select', 'multi_select', 'dropdown'].includes(f.type)) {
          item.options = (f.options || [])
            .map((o) => (typeof o === 'string' ? o.trim() : String(o)))
            .filter((o) => o.length > 0);
        }

        if (f.type === 'short_text' || f.type === 'long_text') {
          const val = {};
          if (typeof f.validation?.minLength === 'number' && !isNaN(f.validation.minLength)) {
            val.minLength = f.validation.minLength;
          }
          if (typeof f.validation?.maxLength === 'number' && !isNaN(f.validation.maxLength)) {
            val.maxLength = f.validation.maxLength;
          }
          item.validation = val;
        } else if (f.type === 'number') {
          const val = {};
          if (typeof f.validation?.min === 'number' && !isNaN(f.validation.min)) {
            val.min = f.validation.min;
          }
          if (typeof f.validation?.max === 'number' && !isNaN(f.validation.max)) {
            val.max = f.validation.max;
          }
          item.validation = val;
        } else if (f.type === 'rating') {
          item.validation = {
            min: typeof f.validation?.min === 'number' ? f.validation.min : 1,
            max: typeof f.validation?.max === 'number' ? f.validation.max : 5,
          };
        } else if (f.type === 'date') {
          const val = {};
          if (f.validation?.minDate) val.minDate = f.validation.minDate;
          if (f.validation?.maxDate) val.maxDate = f.validation.maxDate;
          item.validation = val;
        } else {
          item.validation = {};
        }

        return item;
      });

      const res = await formsApi.saveFields(id, sanitizedFields, revision);
      if (res.success && res.data) {
        setForm(res.data);
        const sortedFields = [...(res.data.fields || [])].sort((a, b) => a.order - b.order);
        setFields(sortedFields);
        setRevision(res.etag || `"${res.data.revision}"`);
        setIsDirty(false);
        toast.success('Questions saved successfully!');
        if (res.warnings && res.warnings.length > 0) {
          setWarnings(res.warnings);
        }
      }
    } catch (err) {
      if (err.status === 412) {
        setConflictModalOpen(true);
      } else {
        const errorDetailMsg = err.details?.length
          ? err.details.map((d) => d.message).join(' ')
          : null;
        toast.error(errorDetailMsg || err.message || 'Failed to save questions');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save Theme
  const handleSaveTheme = async (themeData) => {
    setIsSaving(true);
    try {
      const res = await formsApi.saveTheme(id, themeData, revision);
      if (res.success && res.data) {
        setForm({ ...form, theme: res.data });
        setRevision(res.etag || revision);
        toast.success('Theme saved successfully!');
      }
    } catch (err) {
      if (err.status === 412) {
        setConflictModalOpen(true);
      } else {
        toast.error(err.message || 'Failed to save theme');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save Settings
  const handleSaveMetadata = async (metadata) => {
    setIsSaving(true);
    try {
      const res = await formsApi.updateMetadata(id, metadata, revision);
      if (res.success && res.data) {
        setForm(res.data);
        setTitleDraft(res.data.title || '');
        setRevision(res.etag || revision);
        toast.success('Settings updated!');
      }
    } catch (err) {
      if (err.status === 412) {
        setConflictModalOpen(true);
      } else {
        toast.error(err.message || 'Failed to update settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Form
  const handlePublish = async () => {
    if (isDirty) {
      toast.error('Please save question changes before publishing.');
      return;
    }
    if (isSaving || publishing) return;

    setPublishing(true);
    setPublishErrors([]);

    try {
      const res = await formsApi.publish(id);
      if (res.success && res.data) {
        setForm((prev) => ({ ...prev, status: 'published', slug: res.data.slug }));
        toast.success('Form published successfully!');
        setPublishModalOpen(false);
        setShareModalOpen(true);
      }
    } catch (err) {
      if (err.status === 422 && err.details?.length) {
        setPublishErrors(err.details.map((d) => d.message || d));
        setPublishModalOpen(true);
      } else {
        toast.error(err.message || 'Failed to publish form.');
      }
    } finally {
      setPublishing(false);
    }
  };

  // Unpublish Form
  const handleUnpublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await formsApi.unpublish(id);
      if (res.success) {
        setForm((prev) => ({ ...prev, status: 'draft' }));
        toast.success('Form unpublished. Public submissions are now blocked.');
        setUnpublishModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to unpublish form');
    } finally {
      setPublishing(false);
    }
  };

  const publicUrl = form?.slug
    ? `${window.location.origin}/f/${form.slug}`
    : '';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'questions', label: 'Questions', icon: ListOrdered, badge: fields.length },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Editor Header: Form title, status, save indicator, and actions */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Back button, editable title, status badges */}
        <div className="flex items-center gap-3">
          <Link
            to="/forms"
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors shrink-0"
            title="Back to forms list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={titleDraft}
                    maxLength={LIMITS.TITLE_MAX}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setTitleDraft(form?.title || '');
                        setIsEditingTitle(false);
                      }
                    }}
                    onBlur={handleSaveTitle}
                    autoFocus
                    className="px-2.5 py-1 text-base font-bold text-stone-900 bg-stone-50 border border-orange-400 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    className="p-1 text-xs text-orange-600 hover:bg-orange-50 rounded-md"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight cursor-pointer hover:text-orange-600 transition-colors"
                    title="Click to edit title"
                  >
                    {form?.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 rounded transition-all"
                    title="Rename form"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Status Badge */}
              <Badge variant={form?.status === 'published' ? 'published' : 'draft'}>
                {form?.status}
              </Badge>

              {/* Availability Status Badge */}
              {form?.status === 'published' &&
                form?.availabilityStatus &&
                form.availabilityStatus !== 'open' && (
                  <Badge variant={form.availabilityStatus === 'scheduled' ? 'warning' : 'neutral'}>
                    {form.availabilityStatus === 'scheduled' ? 'Scheduled' : 'Closed'}
                  </Badge>
                )}

              {/* Compact Save State Indicator Pill */}
              <div className="inline-flex items-center">
                {isSaving ? (
                  <span className="inline-flex items-center gap-1.5 text-2xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                    Saving...
                  </span>
                ) : isDirty ? (
                  <span className="inline-flex items-center gap-1.5 text-2xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-2xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    Saved
                  </span>
                )}
              </div>
            </div>

            <p className="text-2xs text-stone-500 mt-1">
              {fields.length} / {LIMITS.FIELDS_MAX} questions • Visibility: {form?.visibility}
            </p>
          </div>
        </div>

        {/* Right Side Actions: AI Generate, Templates, Live Preview, Save, Publish/Unpublish, Share */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Form Generator Trigger */}
          <Button
            variant="secondary"
            size="sm"
            icon={Sparkles}
            onClick={() => setAiModalOpen(true)}
            title="Generate questions using Formly AI"
            className="border-orange-200 text-orange-700 bg-orange-50/70 hover:bg-orange-100"
          >
            Formly AI
          </Button>

          {/* Form Templates Picker Trigger */}
          <Button
            variant="secondary"
            size="sm"
            icon={Layers}
            onClick={() => setTemplatePickerOpen(true)}
            title="Browse ready-made form templates"
          >
            Templates
          </Button>

          {/* Live Respondent Preview */}
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => setPreviewModalOpen(true)}
            title="Open live respondent preview"
          >
            Preview
          </Button>

          {/* Share & QR for published form */}
          {form?.status === 'published' && form.slug && (
            <Button
              variant="secondary"
              size="sm"
              icon={QrCode}
              onClick={() => setShareModalOpen(true)}
              title="Share link, QR code, or embed code"
            >
              Share & QR
            </Button>
          )}

          {/* Save Questions Action Button */}
          {activeTab === 'questions' && (
            <Button
              variant={isDirty ? 'primary' : 'secondary'}
              size="sm"
              icon={Save}
              isLoading={isSaving}
              disabled={isSaving || publishing}
              onClick={handleSaveFields}
              title={isDirty ? 'Save question changes' : 'All changes saved'}
            >
              Save
            </Button>
          )}

          {/* Publish / Unpublish Action Button */}
          {form?.status === 'published' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUnpublishModalOpen(true)}
              disabled={publishing || isSaving}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={handlePublish}
              disabled={isDirty || fields.length === 0 || isSaving || publishing}
              title={isDirty ? 'Save questions before publishing' : 'Publish form'}
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <Banner type="warning" onDismiss={() => setWarnings([])}>
          <ul className="list-disc pl-4 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Banner>
      )}

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Questions Tab Content */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Question Palette at the top of question creation */}
          {fields.length < LIMITS.FIELDS_MAX && (
            <AddQuestionPalette
              onAdd={handleAddField}
              currentCount={fields.length}
              onOpenAiModal={() => setAiModalOpen(true)}
              onOpenTemplatesModal={() => setTemplatePickerOpen(true)}
            />
          )}

          {fields.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="No questions yet"
              description="Add your first question from Text, Choice, or Other question types above."
              actionLabel="Add Short Text Question"
              onAction={() => handleAddField('short_text')}
              actionIcon={Plus}
            />
          ) : (
            <div className="space-y-3.5">
              {fields.map((field, index) => (
                <QuestionEditor
                  key={field.id}
                  field={field}
                  index={index}
                  totalFields={fields.length}
                  onChange={(updated) => handleUpdateField(index, updated)}
                  onDuplicate={() => handleDuplicateField(index)}
                  onDelete={() => handleDeleteField(index)}
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Theme Tab Content */}
      {activeTab === 'theme' && (
        <ThemeTab
          theme={form?.theme}
          onSaveTheme={handleSaveTheme}
          isSaving={isSaving}
        />
      )}

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <SettingsTab
          form={form}
          onSaveMetadata={handleSaveMetadata}
          isSaving={isSaving}
        />
      )}

      {/* Live Respondent Preview Modal */}
      <FormPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        form={form}
        fields={fields}
        theme={form?.theme}
      />

      {/* AI Form Generator Modal */}
      <AiFormGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyForm={handleApplyAiForm}
      />

      {/* Ready-Made Form Templates Modal */}
      <TemplatePickerModal
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      {/* Publish Errors Dialog (422) */}
      <Dialog
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Cannot Publish Form"
        description="Please address the following prerequisites before publishing:"
      >
        <div className="space-y-4">
          <Banner type="error">
            <ul className="list-disc pl-4 space-y-1">
              {publishErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </Banner>
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setPublishModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Unpublish Confirmation Dialog */}
      <Dialog
        isOpen={unpublishModalOpen}
        onClose={() => setUnpublishModalOpen(false)}
        title="Unpublish Form"
        description="Stop accepting new submissions?"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600 leading-relaxed">
            Unpublishing will immediately block respondents from accessing the public form link. Existing responses and analytics are safely preserved.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setUnpublishModalOpen(false)}
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleUnpublish}
              isLoading={publishing}
            >
              Unpublish Form
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Live Form Share & QR Modal */}
      <QrShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        formTitle={form?.title}
        publicUrl={publicUrl}
        slug={form?.slug}
      />

      {/* Concurrency Conflict Dialog (412) */}
      <Dialog
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="Concurrent Edit Conflict"
        description="This form was modified elsewhere since you opened it."
      >
        <div className="space-y-4">
          <Banner type="warning">
            Your current changes cannot be saved because another session updated this form.
          </Banner>
          <p className="text-sm text-stone-600">
            You can reload the latest version to discard your local edits, or force overwrite with your current changes.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setConflictModalOpen(false);
                loadForm();
              }}
            >
              Discard & Reload
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setConflictModalOpen(false);
                try {
                  const latest = await formsApi.getById(id);
                  if (latest.success) {
                    setRevision(latest.etag);
                    const res = await formsApi.saveFields(id, fields, latest.etag);
                    if (res.success) {
                      setRevision(res.etag);
                      setIsDirty(false);
                      toast.success('Overwritten with local edits.');
                    }
                  }
                } catch {
                  toast.error('Failed to overwrite.');
                }
              }}
            >
              Overwrite Anyway
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
