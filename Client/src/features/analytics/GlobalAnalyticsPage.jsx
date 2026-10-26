import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formsApi, analyticsApi } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { QrShareModal } from '../../components/ui/QrShareModal';
import { AiResponseAnalystChatbot } from './AiResponseAnalystChatbot';
import { formatDateTime, formatPercentChange } from '../../lib/format';
import {
  BarChart3,
  BarChart2,
  TrendingUp,
  Inbox,
  Calendar,
  Users,
  Share2,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

export function GlobalAnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFormId = searchParams.get('formId') || '';

  const [forms, setForms] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [selectedFormAnalytics, setSelectedFormAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [range, setRange] = useState('7d'); // '7d' | '30d' | '90d'
  const [isLoading, setIsLoading] = useState(true);
  const [isFormAnalyticsLoading, setIsFormAnalyticsLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Initial load: all forms & global stats
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [formsRes, statsRes] = await Promise.all([
          formsApi.list({ sortBy: 'updatedAt', order: 'desc', limit: 50 }),
          analyticsApi.getStats(),
        ]);
        if (formsRes.success) setForms(formsRes.data || []);
        if (statsRes.success) setGlobalStats(statsRes.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // When a specific form is selected, load its detailed analytics & trends
  const loadFormAnalytics = useCallback(async (formId) => {
    if (!formId) {
      setSelectedFormAnalytics(null);
      setTrends([]);
      return;
    }
    setIsFormAnalyticsLoading(true);
    try {
      const [anaRes, trendRes] = await Promise.all([
        analyticsApi.getFormAnalytics(formId),
        analyticsApi.getTrends(formId, range),
      ]);
      if (anaRes.success) setSelectedFormAnalytics(anaRes.data);
      if (trendRes.success && trendRes.data?.points) {
        setTrends(trendRes.data.points);
      }
    } catch {
      toast.error('Failed to load form analytics');
    } finally {
      setIsFormAnalyticsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (selectedFormId) {
      loadFormAnalytics(selectedFormId);
    } else {
      setSelectedFormAnalytics(null);
      setTrends([]);
    }
  }, [selectedFormId, loadFormAnalytics]);

  const handleSelectForm = (id) => {
    if (id) {
      setSearchParams({ formId: id });
    } else {
      setSearchParams({});
    }
  };

  const activeForm = forms.find((f) => f.id === selectedFormId);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const percentChange = formatPercentChange(
    globalStats?.monthOverMonthChangePercent ?? globalStats?.responsesPercentChange
  );

  const fieldList = Array.isArray(selectedFormAnalytics?.fields)
    ? selectedFormAnalytics.fields
    : selectedFormAnalytics?.fields && typeof selectedFormAnalytics.fields === 'object'
    ? Object.entries(selectedFormAnalytics.fields).map(([fieldId, fieldData]) => {
        let optionsBreakdown = fieldData.optionsBreakdown;
        if (!optionsBreakdown && fieldData.optionCounts) {
          optionsBreakdown = Object.entries(fieldData.optionCounts).map(([option, count]) => ({
            option,
            count,
          }));
        }
        return {
          fieldId,
          ...fieldData,
          answeredCount: fieldData.answeredCount ?? fieldData.answered ?? 0,
          optionsBreakdown,
        };
      })
    : [];

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time submission velocity, respondent engagement, and question breakdowns
          </p>
        </div>

        {/* Form Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="analytics-form-select" className="text-xs font-semibold text-stone-600 shrink-0">
            View Analytics For:
          </label>
          <select
            id="analytics-form-select"
            value={selectedFormId}
            onChange={(e) => handleSelectForm(e.target.value)}
            className="text-xs font-medium bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Forms Overview ({forms.length})</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} ({f.responseCount} {f.responseCount === 1 ? 'response' : 'responses'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW A: SPECIFIC FORM ANALYTICS */}
      {selectedFormId && activeForm ? (
        <div className="space-y-6">
          {/* Active Form Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900">{activeForm.title}</h2>
                  <Badge variant={activeForm.status === 'published' ? 'published' : 'draft'}>
                    {activeForm.status}
                  </Badge>
                </div>
                <p className="text-2xs text-stone-500 mt-0.5">
                  {activeForm.responseCount} total submissions • Visibility: {activeForm.visibility}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={() => navigate(`/forms/${activeForm.id}/edit`)}
              >
                Builder
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Inbox}
                onClick={() => navigate(`/forms/${activeForm.id}/responses`)}
              >
                Submissions Table
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={() => setQrModalOpen(true)}
              >
                Share & QR
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700">Submission Trend Window</p>
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80">
              {['7d', '30d', '90d'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    range === r
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Last {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {isFormAnalyticsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : selectedFormAnalytics?.totalResponses === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No responses recorded yet"
              description="Analytics charts will automatically populate once respondents begin submitting your form."
              actionLabel="Share Form Link"
              onAction={() => setQrModalOpen(true)}
            />
          ) : (
            <>
              {/* Form Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Inbox className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold text-stone-900 mt-0.5">
                      {selectedFormAnalytics?.totalResponses || 0}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">All time</p>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Window Submissions
                    </p>
                    <p className="text-2xl font-bold text-stone-900 mt-0.5">
                      {trends.reduce((sum, p) => sum + (p.count || 0), 0)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">Past {range}</p>
                  </div>
                </Card>

                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Daily Average
                    </p>
                    <p className="text-2xl font-bold text-stone-900 mt-0.5">
                      {(
                        trends.reduce((sum, p) => sum + (p.count || 0), 0) /
                        (trends.length || 1)
                      ).toFixed(1)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">Submissions / day</p>
                  </div>
                </Card>
              </div>

              {/* Submission Trend Chart */}
              <Card className="space-y-4">
                <div>
                  <h3 className="font-semibold text-stone-900 text-base">
                    Submission Activity Trend
                  </h3>
                  <p className="text-xs text-stone-500">
                    Daily response volume over time (UTC days)
                  </p>
                </div>

                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#78716C' }}
                        tickLine={false}
                        axisLine={{ stroke: '#E7E5E4' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#78716C' }}
                        tickLine={false}
                        axisLine={{ stroke: '#E7E5E4' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#292524',
                          borderRadius: '10px',
                          color: '#FFF',
                          fontSize: '12px',
                          border: 'none',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#F97316"
                        strokeWidth={2.5}
                        dot={{ fill: '#F97316', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, fill: '#EA580C', stroke: '#FFF', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Per-Question Insights */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Question Performance</h3>
                    <p className="text-xs text-stone-500">
                      Answer distributions, response percentages, and completion rates
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldList.map((q, idx) => {
                    const answered = q.answeredCount ?? q.answered ?? 0;
                    const completionRate =
                      (selectedFormAnalytics?.totalResponses || 0) > 0
                        ? Math.round((answered / selectedFormAnalytics.totalResponses) * 100)
                        : 0;

                    return (
                      <Card key={q.fieldId || idx} className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 mb-1 inline-block">
                              {q.type}
                            </span>
                            <h4 className="font-semibold text-stone-900 text-sm leading-snug">
                              {idx + 1}. {q.label}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 shrink-0">
                            {completionRate}% answered
                          </span>
                        </div>

                        {/* Visual Breakdown for Select Options */}
                        {q.optionsBreakdown && q.optionsBreakdown.length > 0 && (
                          <div className="space-y-2 pt-2">
                            {q.optionsBreakdown.map((opt, oIdx) => {
                              const pct = answered > 0 ? Math.round((opt.count / answered) * 100) : 0;
                              return (
                                <div key={oIdx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span className="text-stone-700 truncate pr-2">{opt.option}</span>
                                    <span className="text-stone-500 shrink-0">
                                      {opt.count} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Rating Average Indicator */}
                        {q.type === 'rating' && (
                          <div className="flex items-center gap-4 pt-2">
                            <div className="text-3xl font-bold text-orange-600">
                              {q.averageRating ? q.averageRating.toFixed(1) : '—'}
                            </div>
                            <div className="text-xs text-stone-500">
                              Average rating out of 5 stars
                              <div className="text-2xs text-stone-400 mt-0.5">
                                {answered} total ratings
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Formly AI Analyst Chatbot Drawer */}
              <AiResponseAnalystChatbot
                formId={activeForm.id}
                formTitle={activeForm.title}
                responseCount={selectedFormAnalytics.totalResponses}
              />
            </>
          )}

          {activeForm && (
            <QrShareModal
              isOpen={qrModalOpen}
              onClose={() => setQrModalOpen(false)}
              formTitle={activeForm.title}
              slug={activeForm.slug}
            />
          )}
        </div>
      ) : (
        /* VIEW B: ALL FORMS OVERVIEW */
        <div className="space-y-8">
          {/* Global Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Inbox className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Total Submissions
                </p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5">
                  {globalStats?.totalResponses ?? 0}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">Across all forms</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Active Forms
                </p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5">
                  {globalStats?.publishedForms ?? 0}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {globalStats?.totalForms ?? forms.length} total forms
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  This Month
                </p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5">
                  {globalStats?.responsesThisMonth ?? 0}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">Submissions collected</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Monthly Growth
                </p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5">
                  {percentChange.text}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">Vs. previous month</p>
              </div>
            </Card>
          </div>

          {/* Form Breakdown Table / Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Forms Performance Directory</h3>
                <p className="text-xs text-stone-500">
                  Select any form to inspect deep conversion metrics, trends, and Formly AI analysis
                </p>
              </div>
            </div>

            {forms.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No forms created yet"
                description="Create your first form in Form Studio to start gathering audience submissions and viewing analytics."
                actionLabel="Create Form"
                onAction={() => navigate('/forms')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forms.map((form) => (
                  <Card key={form.id} className="p-5 flex flex-col justify-between hover:border-orange-300 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-bold text-stone-900 text-base leading-snug">
                            {form.title}
                          </h4>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {form.description || 'No description provided.'}
                          </p>
                        </div>
                        <Badge variant={form.status === 'published' ? 'published' : 'draft'}>
                          {form.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 py-3 border-y border-stone-100 my-3 text-xs text-stone-600">
                        <div>
                          <span className="font-bold text-stone-900 text-sm block">
                            {form.responseCount}
                          </span>
                          <span className="text-2xs text-stone-400">Submissions</span>
                        </div>
                        <div className="h-6 w-px bg-stone-200" />
                        <div>
                          <span className="font-semibold text-stone-900 text-xs block">
                            {form.fields?.length || 0}
                          </span>
                          <span className="text-2xs text-stone-400">Questions</span>
                        </div>
                        <div className="h-6 w-px bg-stone-200" />
                        <div>
                          <span className="font-semibold text-stone-700 text-xs block capitalize">
                            {form.visibility || 'public'}
                          </span>
                          <span className="text-2xs text-stone-400">Visibility</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xs text-stone-400">
                        Updated {formatDateTime(form.updatedAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Inbox}
                          onClick={() => navigate(`/forms/${form.id}/responses`)}
                        >
                          Responses
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={BarChart3}
                          onClick={() => handleSelectForm(form.id)}
                        >
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
