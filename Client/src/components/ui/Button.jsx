import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-xs focus:ring-orange-500',
    secondary: 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs focus:ring-orange-500',
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900 focus:ring-stone-400',
    outline: 'bg-transparent border border-orange-500 text-orange-600 hover:bg-orange-50 focus:ring-orange-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500',
    'danger-ghost': 'bg-transparent hover:bg-rose-50 text-rose-600 hover:text-rose-700 focus:ring-rose-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8 font-medium',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10 font-medium',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 h-12 font-semibold',
    icon: 'p-2 rounded-xl h-10 w-10',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
}
