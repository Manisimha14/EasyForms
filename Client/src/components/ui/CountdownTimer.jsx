import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

/**
 * Calculate remaining time parts from now until targetDate.
 */
function calculateTimeRemaining(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, totalMs: diff, isExpired: false };
}

/**
 * Reusable countdown timer for scheduled launches and closing deadlines.
 *
 * @param {object} props
 * @param {string|Date} props.targetDate - Target ISO string or Date
 * @param {'card'|'compact'|'badge'} [props.variant='card'] - Display layout
 * @param {string} [props.label=''] - Optional caption
 * @param {function} [props.onExpire] - Callback invoked when timer hits zero
 * @param {string} [props.className='']
 */
export function CountdownTimer({
  targetDate,
  variant = 'card',
  label = '',
  onExpire,
  className = '',
}) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate));

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeLeft(remaining);

      if (remaining && remaining.isExpired) {
        clearInterval(timer);
        if (typeof onExpire === 'function') {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!timeLeft) return null;

  const pad = (n) => String(n).padStart(2, '0');

  // Compact variant (e.g. deadline pill in header)
  if (variant === 'compact') {
    if (timeLeft.isExpired) {
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-stone-500" />
          <span>Deadline reached</span>
        </span>
      );
    }

    const formatted = timeLeft.days > 0
      ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
      : `${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`;

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>{label ? `${label}: ` : ''}<strong>{formatted}</strong></span>
      </span>
    );
  }

  // Full Card layout for launch countdown / scheduled page
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 text-center">
          {label}
        </p>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
        {/* Days */}
        <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 text-center shadow-subtle">
          <span className="block text-xl sm:text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {pad(timeLeft.days)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-stone-500 uppercase tracking-wide">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 text-center shadow-subtle">
          <span className="block text-xl sm:text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {pad(timeLeft.hours)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-stone-500 uppercase tracking-wide">
            Hours
          </span>
        </div>

        {/* Mins */}
        <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 text-center shadow-subtle">
          <span className="block text-xl sm:text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {pad(timeLeft.minutes)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-stone-500 uppercase tracking-wide">
            Mins
          </span>
        </div>

        {/* Secs */}
        <div className="bg-white border border-primary-200/80 bg-primary-50/20 rounded-xl p-2.5 sm:p-3 text-center shadow-subtle">
          <span className="block text-xl sm:text-2xl font-bold text-primary-600 font-mono tracking-tight">
            {pad(timeLeft.seconds)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-primary-700 uppercase tracking-wide">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}
