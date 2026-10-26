import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { analyticsApi, formsApi } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  BarChart2,
  TrendingUp,
  Inbox,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Hash,
  Star,
  Users,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { QrShareModal } from '../../components/ui/QrShareModal';
import { AiResponseAnalystChatbot } from './AiResponseAnalystChatbot';

export function AnalyticsPage() {
  const { id: paramId, formId } = useParams();
  const id = paramId || formId;

  const [form, setForm] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [range, setRange] = useState('7d'); // 7d | 30d | 90d
  const [isLoading, setIsLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [formRes, anaRes, trendRes] = await Promise.all([
        formsApi.getById(id),
        analyticsApi.getFormAnalytics(id),
        analyticsApi.getTrends(id, range),
      ]);

      if (formRes.success) setForm(formRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
      if (trendRes.success && trendRes.data?.points) {
        setTrends(trendRes.data.points);
      }
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [id, range]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const totalResponses = analytics?.totalResponses || 0;

  const fieldList = Array.isArray(analytics?.fields)
    ? analytics.fields
    : analytics?.fields && typeof analytics.fields === 'object'
    ? Object.entries(analytics.fields).map(([fieldId, fieldData]) => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/forms"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to forms list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {form?.title || 'Form'} Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Performance metrics, submission velocity, and question insights
            </p>
          </div>
        </div>

        {/* Right controls: Share & QR + Range Switch */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-1.5 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50"
            title="Share form and view QR Code"
          >
            <Share2 className="w-4 h-4 text-primary-500" />
            <span>Share & QR</span>
          </Button>

          {/* Range Switch */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  range === r
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Last {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {totalResponses === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No responses yet"
          description="Analytics will generate automatically once respondents begin answering your form."
          actionLabel="View Form Builder"
          onAction={() => (window.location.href = `/forms/${id}/edit`)}
        />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Inbox className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Submissions
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {totalResponses}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">All time</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Window Velocity
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {trends.reduce((sum, p) => sum + (p.count || 0), 0)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submissions in last {range}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Daily Average
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {(
                    trends.reduce((sum, p) => sum + (p.count || 0), 0) /
                    (trends.length || 1)
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Submissions / day</p>
              </div>
            </Card>
          </div>

          {/* Submission Trends Chart */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Submission Activity Trend
                </h3>
                <p className="text-xs text-slate-500">
                  Daily response counts over time (UTC days)
                </p>
              </div>
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

          {/* Per-Question Insight Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Question Summaries
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldList.map((q, idx) => {
                const answered = q.answeredCount ?? q.answered ?? 0;
                const completionRate =
                  totalResponses > 0
                    ? Math.round((answered / totalResponses) * 100)
                    : 0;

                return (
                  <Card key={q.fieldId || idx} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mb-1 inline-block">
                          {q.type}
                        </span>
                        <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                          {idx + 1}. {q.label}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-primary-600">
                          {completionRate}%
                        </span>
                        <p className="text-[11px] text-slate-400">answered</p>
                      </div>
                    </div>

                    {/* Breakdown by Type */}

                    {/* Number Question Metrics */}
                    {q.type === 'number' && (
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center">
                        <div>
                          <p className="text-[11px] text-slate-500 uppercase">Average</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">
                            {q.average !== null && q.average !== undefined ? q.average.toFixed(1) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 uppercase">Min</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">
                            {q.min ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 uppercase">Max</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">
                            {q.max ?? '—'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rating Question Metrics */}
                    {q.type === 'rating' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
                          <span className="text-xl font-bold text-slate-900">
                            {q.average !== null && q.average !== undefined ? q.average.toFixed(1) : '—'}
                          </span>
                          <span className="text-xs text-slate-500">out of {q.max || 5}</span>
                        </div>

                        {/* Frequency breakdown */}
                        {q.distribution && (
                          <div className="space-y-1.5 pt-2">
                            {Object.entries(q.distribution).map(([starNum, count]) => {
                              const pct = answered > 0 ? (count / answered) * 100 : 0;
                              return (
                                <div key={starNum} className="flex items-center gap-2 text-xs">
                                  <span className="w-7 text-slate-600 font-medium">{starNum}★</span>
                                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-amber-400 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-right text-slate-500">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selection Types: single_select, multi_select, dropdown */}
                    {['single_select', 'multi_select', 'dropdown'].includes(q.type) && q.optionsBreakdown && (
                      <div className="space-y-2 pt-1">
                        {q.optionsBreakdown.map((opt) => {
                          const pct = answered > 0 ? (opt.count / answered) * 100 : 0;
                          return (
                            <div key={opt.option} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-700 truncate max-w-[200px]">{opt.option}</span>
                                <span className="text-slate-500">{opt.count} ({Math.round(pct)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-primary-600 h-full rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Boolean Types: yes_no, checkbox */}
                    {(q.type === 'yes_no' || q.type === 'checkbox') && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
                          <p className="text-xs text-emerald-800 font-semibold">Yes / True</p>
                          <p className="text-lg font-bold text-emerald-900 mt-0.5">{q.trueCount || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-100/60 border border-slate-200 rounded-xl text-center">
                          <p className="text-xs text-slate-700 font-semibold">No / False</p>
                          <p className="text-lg font-bold text-slate-900 mt-0.5">{q.falseCount || 0}</p>
                        </div>
                      </div>
                    )}

                    {/* Text types or general completion count */}
                    {['short_text', 'long_text', 'email', 'date'].includes(q.type) && (
                      <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
                        <span>Answered: <strong>{answered}</strong></span>
                        <span>Skipped: <strong>{Math.max(0, totalResponses - answered)}</strong></span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* QR Code Share Modal */}
      <QrShareModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        formId={id}
        formTitle={form?.title}
        isPublished={form?.status === 'published'}
      />

      {/* AI Response Analyst Chatbot */}
      <AiResponseAnalystChatbot
        formId={id}
        formTitle={form?.title}
        responseCount={analytics?.overview?.totalResponses || 0}
      />
    </div>
  );
}
