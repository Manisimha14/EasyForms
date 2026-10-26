import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formsApi } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { QrShareModal } from '../../components/ui/QrShareModal';
import { AiFormGeneratorModal } from '../builder/AiFormGeneratorModal';
import { TemplatePickerModal } from '../builder/TemplatePickerModal';
import { formatDateTime } from '../../lib/format';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Copy,
  ExternalLink,
  Edit3,
  BarChart2,
  Inbox,
  Trash2,
  FileText,
  Check,
  QrCode,
  Share2,
  Clock,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export function FormsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'updatedAt';
  const order = searchParams.get('order') || 'desc';

  const [searchInput, setSearchInput] = useState(search);
  const [forms, setForms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Create Form state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Delete Form state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Share & QR Modal state
  const [shareForm, setShareForm] = useState(null);

  // Fetch forms
  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await formsApi.list({
        page,
        limit: 20,
        status: status || undefined,
        search: search || undefined,
        sortBy,
        order,
      });
      if (res.success) {
        setForms(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search, sortBy, order]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearchParams]);

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await formsApi.create({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      if (res.success && res.data) {
        toast.success('Form created!');
        navigate(`/forms/${res.data.id}/edit`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      const res = await formsApi.create({
        title: template.title,
        description: template.description,
      });
      if (res.success && res.data) {
        if (template.fields?.length) {
          await formsApi.saveFields(res.data.id, template.fields, res.etag);
        }
        if (template.theme) {
          await formsApi.saveTheme(res.data.id, template.theme);
        }
        toast.success(`Form created from "${template.title}" template!`);
        navigate(`/forms/${res.data.id}/edit`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create form from template');
    }
  };

  const handleCreateFromAi = async (generated) => {
    try {
      const res = await formsApi.create({
        title: generated.title || 'AI Generated Form',
        description: generated.description,
      });
      if (res.success && res.data) {
        if (generated.fields?.length) {
          await formsApi.saveFields(res.data.id, generated.fields, res.etag);
        }
        if (generated.theme) {
          await formsApi.saveTheme(res.data.id, generated.theme);
        }
        toast.success('AI generated form created!');
        navigate(`/forms/${res.data.id}/edit`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create AI form');
    }
  };

  const handleDeleteForm = async () => {
    if (!formToDelete) return;
    setDeleting(true);
    try {
      await formsApi.delete(formToDelete.id);
      toast.success('Form and all associated responses deleted');
      setDeleteModalOpen(false);
      setFormToDelete(null);
      fetchForms();
    } catch (err) {
      toast.error(err.message || 'Failed to delete form');
    } finally {
      setDeleting(false);
    }
  };

  const copyPublicLink = (slug) => {
    const origin = window.location.origin;
    const url = `${origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Public form link copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Forms
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your surveys, questionnaires, and responses
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            icon={Sparkles}
            onClick={() => setAiModalOpen(true)}
            className="border-orange-200 text-orange-700 bg-orange-50/70 hover:bg-orange-100"
          >
            Generate with AI
          </Button>
          <Button
            variant="secondary"
            icon={Layers}
            onClick={() => setTemplatePickerOpen(true)}
          >
            Templates
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Blank Form
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-xl shadow-subtle">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search forms by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Status and Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => updateParam('sortBy', e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-primary-500"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Title</option>
          </select>

          {/* Order */}
          <button
            type="button"
            onClick={() => updateParam('order', order === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title={`Sort order: ${order === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Forms List Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || status ? 'No forms match your search' : 'No forms yet'}
          description={
            search || status
              ? 'Try adjusting your filters or search keywords.'
              : 'Create your first form to start collecting responses.'
          }
          actionLabel={search || status ? 'Clear Filters' : 'Create Form'}
          onAction={() => {
            if (search || status) {
              setSearchParams({});
              setSearchInput('');
            } else {
              setCreateModalOpen(true);
            }
          }}
          actionIcon={Plus}
        />
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-slate-300 hover:shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    onClick={() => navigate(`/forms/${form.id}/edit`)}
                    className="text-base font-semibold text-slate-900 hover:text-primary-600 transition-colors cursor-pointer truncate max-w-md"
                  >
                    {form.title}
                  </h2>
                  <Badge variant={form.status === 'published' ? 'published' : 'draft'}>
                    {form.status}
                  </Badge>
                  {form.status === 'published' && form.availabilityStatus && form.availabilityStatus !== 'open' && (
                    <Badge variant={form.availabilityStatus === 'scheduled' ? 'warning' : 'neutral'}>
                      {form.availabilityStatus === 'scheduled' ? 'Scheduled' : 'Closed'}
                    </Badge>
                  )}
                  <Badge variant={form.visibility === 'public' ? 'public' : 'unlisted'}>
                    {form.visibility}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone-500">
                  <span>Updated {formatDateTime(form.updatedAt)}</span>
                  <span>•</span>
                  <span>{form.fieldCount} {form.fieldCount === 1 ? 'question' : 'questions'}</span>
                  <span>•</span>
                  <span>{form.responseCount} {form.responseCount === 1 ? 'response' : 'responses'}</span>
                  {form.maxResponses && (
                    <>
                      <span>•</span>
                      <span className="text-stone-600 font-medium">Quota: {form.responseCount}/{form.maxResponses}</span>
                    </>
                  )}
                  {form.endAt && form.availabilityStatus === 'open' && (
                    <>
                      <span>•</span>
                      <span className="text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Closes {new Date(form.endAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                  {form.startAt && form.availabilityStatus === 'scheduled' && (
                    <>
                      <span>•</span>
                      <span className="text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        Opens {new Date(form.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
                {form.description && (
                  <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {form.status === 'published' && form.slug && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={QrCode}
                    onClick={() => setShareForm(form)}
                    title="Share link, QR code, or embed"
                  >
                    Share & QR
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => navigate(`/forms/${form.id}/edit`)}
                >
                  Edit
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Inbox}
                  onClick={() => navigate(`/forms/${form.id}/responses`)}
                >
                  Responses ({form.responseCount})
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={BarChart2}
                  onClick={() => navigate(`/forms/${form.id}/analytics`)}
                >
                  Analytics
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setFormToDelete(form);
                    setDeleteModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  title="Delete form"
                  aria-label="Delete form"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
              <p className="text-xs text-slate-500">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => updateParam('page', pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateParam('page', pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Form"
        description="Provide a title and optional description."
      >
        <form onSubmit={handleCreateForm} className="space-y-4">
          <Input
            label="Form Title"
            id="modal-title"
            required
            autoFocus
            maxLength={120}
            placeholder="e.g. Employee Feedback 2026"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <Textarea
            label="Description (optional)"
            id="modal-desc"
            rows={3}
            maxLength={2000}
            placeholder="Brief description for respondents"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={creating}
            >
              Create Form
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Form Confirmation Dialog */}
      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Form"
        description="Are you sure you want to delete this form?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Deleting <strong>{formToDelete?.title}</strong> will immediately and permanently delete this form and all <strong>{formToDelete?.responseCount || 0}</strong> responses collected. This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteForm}
              isLoading={deleting}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Share & QR Modal */}
      <QrShareModal
        isOpen={!!shareForm}
        onClose={() => setShareForm(null)}
        formTitle={shareForm?.title}
        publicUrl={shareForm?.slug ? `${window.location.origin}/f/${shareForm.slug}` : ''}
        slug={shareForm?.slug}
      />

      {/* AI Form Generator Modal */}
      <AiFormGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyForm={handleCreateFromAi}
      />

      {/* Ready-Made Form Templates Modal */}
      <TemplatePickerModal
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelectTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}
