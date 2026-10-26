import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

export function Banner({
  type = 'info', // info | warning | error | success
  title,
  children,
  onDismiss,
  className = '',
}) {
  const styles = {
    info: 'bg-primary-50 border-primary-200 text-primary-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };

  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle2,
  };

  const IconComponent = icons[type] || Info;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-slide-up ${styles[type] || styles.info} ${className}`}
    >
      <IconComponent className="w-5 h-5 shrink-0 mt-0.5 opacity-90" />
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition-colors -mr-1 -mt-1"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
