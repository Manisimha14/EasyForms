import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi, formsApi } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Dialog } from '../../components/ui/Dialog';
import { Input, Textarea } from '../../components/ui/Input';
import { QrShareModal } from '../../components/ui/QrShareModal';
import { formatDateTime, formatPercentChange } from '../../lib/format';
import {
  FileText,
  CheckCircle2,
  Inbox,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  QrCode,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentForms, setRecentForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareForm, setShareForm] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, formsRes] = await Promise.all([
        analyticsApi.getStats(),
        formsApi.list({ sortBy: 'updatedAt', order: 'desc', limit: 5 }),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (formsRes.success) setRecentForms(formsRes.data || []);
    } catch (err) {
      toast.error('Unable to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const percentChange = formatPercentChange(stats?.monthOverMonthChangePercent ?? stats?.responsesPercentChange);
  const publishedFormsCount = stats?.publishedForms ?? stats?.activeForms ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Overview of your active forms, audience responses, and submission velocity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Form
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4 hover:border-stone-300">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 border border-primary-200/60 shadow-xs">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Total Forms
              </p>
              <p className="text-3xl font-bold text-stone-900 mt-0.5 tracking-tight">
                {stats?.totalForms ?? 0}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {publishedFormsCount} published
              </p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 hover:border-stone-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Published
              </p>
              <p className="text-3xl font-bold text-stone-900 mt-0.5 tracking-tight">
                {publishedFormsCount}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Ready for respondents
              </p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 hover:border-stone-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs">
              <Inbox className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Total Responses
              </p>
              <p className="text-3xl font-bold text-stone-900 mt-0.5 tracking-tight">
                {stats?.totalResponses ?? 0}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                All-time submissions
              </p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 hover:border-stone-300">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary-600 flex items-center justify-center shrink-0 border border-orange-200/60 shadow-xs">
              <TrendingUp className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                This Month
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold text-stone-900 tracking-tight">
                  {stats?.responsesThisMonth ?? 0}
                </span>
                {percentChange.formatted && (
                  <span
                    className={`text-xs font-semibold ${
                      percentChange.isPositive === null
                        ? 'text-stone-400'
                        : percentChange.isPositive
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {percentChange.formatted}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {percentChange.label || 'Submissions in current month'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Action Navigation Bar */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <Sparkles className="w-4 h-4 text-primary-500 shrink-0" />
          <span className="font-semibold">Quick Actions:</span>
          <span className="text-stone-500 hidden sm:inline">Build a new form, inspect collected answers, or review metrics.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={FileText}
            onClick={() => navigate('/forms')}
          >
            My Forms
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            New Form
          </Button>
        </div>
      </div>

      {/* Recent Forms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Forms
          </h2>
          <Link
            to="/forms"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
          >
            View all forms <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : recentForms.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No forms created yet"
            description="Create your first form to start collecting responses and viewing analytics."
            actionLabel="Create Form"
            onAction={() => setCreateModalOpen(true)}
            actionIcon={Plus}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentForms.map((form) => (
              <div
                key={form.id}
                onClick={() => navigate(`/forms/${form.id}/edit`)}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-stone-300 hover:shadow-subtle transition-all cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900 group-hover:text-primary-600 transition-colors">
                      {form.title}
                    </h3>
                    <Badge variant={form.status === 'published' ? 'published' : 'draft'}>
                      {form.status}
                    </Badge>
                    {form.status === 'published' && form.availabilityStatus && form.availabilityStatus !== 'open' && (
                      <Badge variant={form.availabilityStatus === 'scheduled' ? 'warning' : 'neutral'}>
                        {form.availabilityStatus === 'scheduled' ? 'Scheduled' : 'Closed'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    Updated {formatDateTime(form.updatedAt)} • {form.fieldCount} fields • {form.responseCount} responses
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {form.status === 'published' && form.slug && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={QrCode}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareForm(form);
                      }}
                      title="Share link & QR code"
                    >
                      Share & QR
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/forms/${form.id}/edit`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/forms/${form.id}/responses`);
                    }}
                  >
                    Responses ({form.responseCount})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Form"
        description="Give your form a title and an optional description to get started."
      >
        <form onSubmit={handleCreateForm} className="space-y-4">
          <Input
            label="Form Title"
            id="form-title"
            required
            autoFocus
            maxLength={120}
            placeholder="e.g. Customer Satisfaction Survey"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <Textarea
            label="Description (optional)"
            id="form-desc"
            rows={3}
            maxLength={2000}
            placeholder="Briefly describe what this form is about"
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

      {/* Share & QR Modal */}
      <QrShareModal
        isOpen={!!shareForm}
        onClose={() => setShareForm(null)}
        formTitle={shareForm?.title}
        publicUrl={shareForm?.slug ? `${window.location.origin}/f/${shareForm.slug}` : ''}
        slug={shareForm?.slug}
      />
    </div>
  );
}
