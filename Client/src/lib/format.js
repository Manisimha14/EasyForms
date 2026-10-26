/**
 * Formatting and Color Utilities
 */

/**
 * Calculates whether text should be dark or light based on WCAG luminance of background color
 * @param {string} hex - Color hex string (e.g. #FFFFFF or #000)
 * @returns {'#0F172A' | '#FFFFFF'} Appropriate text color
 */
export function getContrastTextColor(hex) {
  if (!hex || typeof hex !== 'string') return '#0F172A';
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return '#0F172A';

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Return dark text for light background, light text for dark background
  return L > 0.4 ? '#0F172A' : '#FFFFFF';
}

/**
 * Formats an ISO date into local readable string
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Formats an ISO date into short date only
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Formats month-over-month percent change
 * If null, returns { text: 'no data for last month', formatted: '—' }
 */
export function formatPercentChange(changePercent) {
  if (changePercent === null || changePercent === undefined) {
    return {
      formatted: '—',
      label: 'no data for last month',
      isPositive: null,
    };
  }
  const isPositive = changePercent >= 0;
  return {
    formatted: `${isPositive ? '+' : ''}${changePercent}%`,
    label: 'vs last month',
    isPositive,
  };
}

/**
 * Truncate long strings cleanly
 */
export function truncate(str, maxLength = 60) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
