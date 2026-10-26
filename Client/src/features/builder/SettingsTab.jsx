import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Banner } from '../../components/ui/Banner';
import { Badge } from '../../components/ui/Badge';
import {
  Settings,
  Globe,
  EyeOff,
  Calendar,
  Clock,
  Hash,
  Mail,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { LIMITS } from '../../lib/constants';

/**
 * Format a Date or ISO string into local 'YYYY-MM-DDTHH:mm' for datetime-local input.
 */
function toLocalDatetimeInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert local datetime string 'YYYY-MM-DDTHH:mm' to UTC ISO string.
 */
function fromLocalDatetimeInput(localStr) {
  if (!localStr) return null;
  const d = new Date(localStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Add specified duration to now and return local datetime input string.
 */
function getFutureLocalDatetime(hours = 0, days = 0) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  d.setDate(d.getDate() + days);
  return toLocalDatetimeInput(d);
}

/**
 * Get tomorrow at 9:00 AM local time.
 */
function getTomorrow9AM() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalDatetimeInput(d);
}

export function SettingsTab({ form, onSaveMetadata, isSaving }) {
  // General
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [visibility, setVisibility] = useState(form?.visibility || 'unlisted');

  // Availability / Scheduling
  const [enableStart, setEnableStart] = useState(Boolean(form?.startAt));
  const [startTime, setStartTime] = useState(toLocalDatetimeInput(form?.startAt));

  const [enableEnd, setEnableEnd] = useState(Boolean(form?.endAt));
  const [endTime, setEndTime] = useState(toLocalDatetimeInput(form?.endAt));

  const [enableMaxResponses, setEnableMaxResponses] = useState(Boolean(form?.maxResponses));
  const [maxResponses, setMaxResponses] = useState(form?.maxResponses || '');

  // Notifications
  const [respondentReceipt, setRespondentReceipt] = useState(
    Boolean(form?.notifications?.respondentReceipt)
  );
  const [ownerNotification, setOwnerNotification] = useState(
    Boolean(form?.notifications?.ownerNotification)
  );
  const [respondentEmailFieldId, setRespondentEmailFieldId] = useState(
    form?.notifications?.respondentEmailFieldId || ''
  );

  const [dateError, setDateError] = useState('');

  // Extract all email questions in form
  const emailFields = (form?.fields || []).filter((f) => f.type === 'email');

  // Timezone identifier
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const handleSubmit = (e) => {
    e.preventDefault();
    setDateError('');

    const startIso = enableStart && startTime ? fromLocalDatetimeInput(startTime) : null;
    const endIso = enableEnd && endTime ? fromLocalDatetimeInput(endTime) : null;

    if (startIso && endIso) {
      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        setDateError('Closing end date and time must be later than opening start date and time.');
        return;
      }
    }

    onSaveMetadata({
      title: title.trim(),
      description: description.trim() || undefined,
      visibility,
      startAt: startIso,
      endAt: endIso,
      maxResponses: enableMaxResponses && maxResponses ? parseInt(maxResponses, 10) : null,
      notifications: {
        respondentReceipt,
        ownerNotification,
        respondentEmailFieldId: respondentEmailFieldId || null,
      },
    });
  };

  // Determine current status badge
  const availabilityStatus = form?.availabilityStatus || (form?.status === 'published' ? 'open' : 'draft');
  const statusBadgeVariant =
    form?.status !== 'published'
      ? 'draft'
      : availabilityStatus === 'scheduled'
      ? 'warning'
      : availabilityStatus === 'closed'
      ? 'neutral'
      : 'success';

  // Calculate quota progress
  const responseCount = form?.responseCount || 0;
  const quotaLimit = form?.maxResponses || (enableMaxResponses && maxResponses ? parseInt(maxResponses, 10) : 0);
  const quotaPercentage = quotaLimit > 0 ? Math.min(100, Math.round((responseCount / quotaLimit) * 100)) : 0;
  const spotsRemaining = quotaLimit > 0 ? Math.max(0, quotaLimit - responseCount) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. General Settings Card */}
        <Card>
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-stone-100">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Settings className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">General Settings</h3>
              <p className="text-xs text-stone-500">Update form identity and indexing visibility</p>
            </div>
          </div>

          <div className="space-y-5">
            <Input
              label="Form Title"
              id="builder-title"
              required
              maxLength={LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              label="Form Description (optional)"
              id="builder-desc"
              rows={3}
              maxLength={LIMITS.DESCRIPTION_MAX}
              placeholder="Provide context or instructions to respondents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Visibility Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 block">Form Visibility</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'public'
                      ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-stone-900">
                      <Globe className="w-4 h-4 text-primary-600" /> Public
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Listed and discoverable. Anyone can submit answers.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'unlisted'
                      ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="unlisted"
                    checked={visibility === 'unlisted'}
                    onChange={() => setVisibility('unlisted')}
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-stone-900">
                      <EyeOff className="w-4 h-4 text-amber-600" /> Unlisted
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Accessible only via direct link or QR code.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Form Availability & Scheduling Card */}
        <Card>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-base">Availability & Scheduling</h3>
                <p className="text-xs text-stone-500">
                  Control exact opening, closing deadlines, and response caps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium hidden sm:inline">Status:</span>
              <Badge variant={statusBadgeVariant} size="md">
                {form?.status !== 'published'
                  ? 'Draft'
                  : availabilityStatus === 'scheduled'
                  ? 'Scheduled'
                  : availabilityStatus === 'closed'
                  ? 'Closed'
                  : 'Open'}
              </Badge>
            </div>
          </div>

          {dateError && (
            <div className="mb-4">
              <Banner type="error">{dateError}</Banner>
            </div>
          )}

          {/* Interactive Timeline Visualizer */}
          {(enableStart || enableEnd) && (
            <div className="mb-6 p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                <span>Availability Window Timeline</span>
                <span className="text-primary-600 font-mono text-[11px]">
                  {enableStart && enableEnd ? 'Time-Window Scheduled' : enableStart ? 'Scheduled Opening' : 'Scheduled Deadline'}
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      availabilityStatus === 'scheduled'
                        ? 'bg-amber-400 w-1/3'
                        : availabilityStatus === 'open'
                        ? 'bg-emerald-500 w-2/3'
                        : 'bg-stone-400 w-full'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <span>
                  <strong>Start:</strong> {enableStart && startTime ? new Date(startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate (Now)'}
                </span>
                <span>
                  <strong>End:</strong> {enableEnd && endTime ? new Date(endTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'No Expiry'}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Start Date & Time */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableStart}
                    onChange={(e) => {
                      setEnableStart(e.target.checked);
                      if (!e.target.checked) setStartTime('');
                    }}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-stone-300"
                  />
                  <div>
                    <span className="text-sm font-semibold text-stone-900">Schedule Start Date & Time</span>
                    <p className="text-xs text-stone-500">Form cannot accept submissions before this time</p>
                  </div>
                </label>
              </div>

              {enableStart && (
                <div className="pt-2 pl-6.5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required={enableStart}
                      className="px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-stone-400 font-medium text-[11px] mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setStartTime(toLocalDatetimeInput(new Date()))}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        Open Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartTime(getFutureLocalDatetime(1, 0))}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        +1 Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartTime(getTomorrow9AM())}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        Tomorrow 9 AM
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* End Date & Time */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableEnd}
                    onChange={(e) => {
                      setEnableEnd(e.target.checked);
                      if (!e.target.checked) setEndTime('');
                    }}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-stone-300"
                  />
                  <div>
                    <span className="text-sm font-semibold text-stone-900">Schedule End Date & Time</span>
                    <p className="text-xs text-stone-500">Form automatically stops accepting submissions after this time</p>
                  </div>
                </label>
              </div>

              {enableEnd && (
                <div className="pt-2 pl-6.5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required={enableEnd}
                      className="px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-stone-400 font-medium text-[11px] mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setEndTime(getFutureLocalDatetime(24, 0))}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        +24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndTime(getFutureLocalDatetime(0, 3))}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        +3 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndTime(getFutureLocalDatetime(0, 7))}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndTime(getFutureLocalDatetime(0, 30))}
                        className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                      >
                        +30 Days
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Max Responses Limit & Quota Bar */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableMaxResponses}
                    onChange={(e) => {
                      setEnableMaxResponses(e.target.checked);
                      if (!e.target.checked) setMaxResponses('');
                    }}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-stone-300"
                  />
                  <div>
                    <span className="text-sm font-semibold text-stone-900">Response Cap Limit</span>
                    <p className="text-xs text-stone-500">Automatically close form once a submission quota is reached</p>
                  </div>
                </label>
              </div>

              {enableMaxResponses && (
                <div className="pt-2 pl-6.5 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={maxResponses}
                      onChange={(e) => setMaxResponses(e.target.value)}
                      required={enableMaxResponses}
                      className="w-36 px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                    />
                    <span className="text-xs text-stone-500">maximum submissions</span>
                  </div>

                  {/* Quota Progress Bar */}
                  {quotaLimit > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-stone-700">
                          <strong>{responseCount}</strong> of <strong>{quotaLimit}</strong> responses collected
                        </span>
                        <span className="text-primary-600 font-bold">{quotaPercentage}%</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${quotaPercentage}%` }}
                        />
                      </div>
                      {spotsRemaining !== null && (
                        <p className="text-[11px] text-stone-400">
                          {spotsRemaining === 0 ? 'Quota reached. Form is closed to new responses.' : `${spotsRemaining} spots remaining before automatic closing.`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timezone Notice */}
            <div className="flex items-start gap-2 text-xs text-stone-500 bg-stone-100/70 p-3 rounded-lg border border-stone-200/60">
              <Clock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span>
                Timestamps are securely stored in UTC. Times above are displayed and edited in your local timezone (
                <strong className="text-stone-700">{userTimezone}</strong>).
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Transactional Email Notifications Card */}
        <Card>
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-stone-100">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Mail className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">Email Notifications</h3>
              <p className="text-xs text-stone-500">Configure automated submission receipts and owner alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Respondent Submission Receipt */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={respondentReceipt}
                  onChange={(e) => setRespondentReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-stone-300 mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-stone-900">Respondent Submission Receipt</span>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Sends an email confirmation to the respondent with their submission timestamp and confirmation ID.
                  </p>
                </div>
              </label>

              {respondentReceipt && (
                <div className="pt-2 pl-6.5 space-y-2">
                  <label className="text-xs font-semibold text-stone-700 block">
                    Recipient Email Field:
                  </label>
                  {emailFields.length > 0 ? (
                    <select
                      value={respondentEmailFieldId}
                      onChange={(e) => setRespondentEmailFieldId(e.target.value)}
                      className="px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Auto-detect from first email question</option>
                      {emailFields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      💡 Tip: Add an "Email" question to your form so respondents can provide their email address.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Form Owner Alert */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ownerNotification}
                  onChange={(e) => setOwnerNotification(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-stone-300 mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-stone-900">Form Owner Alert</span>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Notify you by email whenever a new response is submitted. Includes a secure link to view full details in your authenticated dashboard.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="pt-2">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving} className="w-full sm:w-auto">
            Save Settings & Availability
          </Button>
        </div>
      </form>
    </div>
  );
}
