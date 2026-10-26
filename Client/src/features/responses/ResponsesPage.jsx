import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formsApi, responsesApi } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { QrShareModal } from '../../components/ui/QrShareModal';
import { AiResponseAnalystChatbot } from '../analytics/AiResponseAnalystChatbot';
import { formatDateTime, truncate } from '../../lib/format';
import {
  Download,
  Trash2,
  Inbox,
  ArrowLeft,
  ArrowUpDown,
  Share2,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

export function ResponsesPage() {
  const { id: paramId, formId } = useParams();
  const id = paramId || formId;

  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Selected response drawer
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete response dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // CSV Export state
  const [isExporting, setIsExporting] = useState(false);

  // QR Share Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Fetch form & responses
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [formRes, respRes] = await Promise.all([
        formsApi.getById(id),
        responsesApi.list(id, { page, limit: 20, order: sort }),
      ]);

      if (formRes.success) setForm(formRes.data);
      if (respRes.success) {
        setResponses(respRes.data || []);
        if (respRes.pagination) setPagination(respRes.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load responses');
    } finally {
      setIsLoading(false);
    }
  }, [id, page, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open response details in Drawer
  const handleOpenDetail = async (respId) => {
    setDetailLoading(true);
    try {
      const res = await responsesApi.getById(id, respId);
      if (res.success && res.data) {
        setSelectedResponse(res.data);
      }
    } catch {
      toast.error('Failed to load response details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete Response
  const handleDeleteResponse = async () => {
    if (!responseToDelete) return;
    setDeleting(true);
    try {
      await responsesApi.delete(id, responseToDelete.id);
      toast.success('Response deleted');
      setDeleteModalOpen(false);
      setResponseToDelete(null);
      if (selectedResponse?.id === responseToDelete.id) {
        setSelectedResponse(null);
      }
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete response');
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV with Bearer Token
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await responsesApi.exportCsv(id);
      if (res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const slug = form?.slug || id;
        const today = new Date().toISOString().split('T')[0];
        a.download = `${slug}-responses-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Responses exported to CSV!');
      }
    } catch (err) {
      if (err.status === 422) {
        toast.error('Response count exceeds the 10,000 row export limit.');
      } else {
        toast.error(err.message || 'CSV export failed.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to format table answer cell
  const renderCellAnswer = (field, answersList = []) => {
    const answerObj = answersList.find((a) => a.fieldId === field.id);
    if (!answerObj || answerObj.value === undefined || answerObj.value === null) {
      return <span className="text-slate-300 italic">—</span>;
    }

    const val = answerObj.value;

    if (typeof val === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
            val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {val ? 'Yes' : 'No'}
        </span>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    return <span>{truncate(String(val), 40)}</span>;
  };

  const fieldsInOrder = [...(form?.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 animate-fade-in">
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
              {form?.title || 'Form'} Responses
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {pagination.total} {pagination.total === 1 ? 'submission' : 'submissions'} collected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {form?.status === 'published' && form.slug && (
            <Button
              variant="secondary"
              size="sm"
              icon={QrCode}
              onClick={() => setQrModalOpen(true)}
              title="Share link, QR code, or embed"
            >
              Share & QR
            </Button>
          )}

          <button
            type="button"
            onClick={() => setSort(sort === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 text-xs font-medium border border-stone-200 rounded-xl text-stone-700 bg-white hover:bg-stone-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sort === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            isLoading={isExporting}
            disabled={responses.length === 0}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Responses Table or Empty State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : responses.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No responses yet"
          description="Once respondents submit your published form, their answers will appear here in real time."
          actionLabel={form?.status === 'published' ? 'Share & View QR' : 'Go to Builder'}
          onAction={() => {
            if (form?.status === 'published' && form.slug) {
              setQrModalOpen(true);
            } else {
              window.location.href = `/forms/${id}/edit`;
            }
          }}
          actionIcon={form?.status === 'published' ? QrCode : Share2}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Submitted At</th>
                  {fieldsInOrder.map((f) => (
                    <th key={f.id} className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((resp) => (
                  <tr
                    key={resp.id}
                    onClick={() => handleOpenDetail(resp.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {formatDateTime(resp.submittedAt)}
                    </td>
                    {fieldsInOrder.map((field) => (
                      <td key={field.id} className="py-3 px-4 text-slate-800">
                        {renderCellAnswer(field, resp.answers)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResponseToDelete(resp);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete response"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/40">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Detail Drawer */}
      <Drawer
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        title="Response Details"
        subtitle={
          selectedResponse?.submittedAt
            ? `Submitted ${formatDateTime(selectedResponse.submittedAt)}`
            : ''
        }
      >
        <div className="space-y-6">
          {fieldsInOrder.map((field, idx) => {
            const answerObj = selectedResponse?.answers?.find(
              (a) => a.fieldId === field.id
            );
            const val = answerObj?.value;

            return (
              <div
                key={field.id}
                className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5"
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {idx + 1}. {field.label}
                </p>
                <div className="text-sm font-medium text-slate-900 whitespace-pre-wrap">
                  {val === undefined || val === null ? (
                    <span className="text-slate-400 italic">No answer provided</span>
                  ) : typeof val === 'boolean' ? (
                    val ? 'Yes' : 'No'
                  ) : Array.isArray(val) ? (
                    val.join(', ')
                  ) : (
                    String(val)
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-200 flex justify-between">
            <Button
              variant="danger-ghost"
              size="sm"
              icon={Trash2}
              onClick={() => {
                setResponseToDelete(selectedResponse);
                setDeleteModalOpen(true);
              }}
            >
              Delete this response
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedResponse(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Response Confirmation Dialog */}
      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Response"
        description="Are you sure you want to delete this submission?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            This submission will be permanently deleted and cannot be recovered.
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
              onClick={handleDeleteResponse}
              isLoading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Live Form Share & QR Modal */}
      <QrShareModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        formTitle={form?.title}
        publicUrl={form?.slug ? `${window.location.origin}/f/${form.slug}` : ''}
        slug={form?.slug}
      />

      {/* AI Response Analyst Chatbot */}
      <AiResponseAnalystChatbot
        formId={id}
        formTitle={form?.title}
        responseCount={pagination?.total || responses.length}
      />
    </div>
  );
}
