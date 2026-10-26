import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    description,
    error,
    required = false,
    className = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {description && (
        <p className="text-xs text-slate-500 leading-normal">{description}</p>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-100'
        } ${className}`}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-600 font-medium animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  {
    label,
    description,
    error,
    required = false,
    className = '',
    id,
    rows = 3,
    ...props
  },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 flex items-center gap-1 select-none"
        >
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {description && (
        <p className="text-xs text-slate-500 leading-normal">{description}</p>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-y ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-100'
        } ${className}`}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-600 font-medium animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
});
