// src/utils/csv.js
// RFC 4180-compliant CSV formatting and formula injection defense.
// Prevents spreadsheet execution of malicious formulas starting with =, +, -, @, \t, or \r.

/**
 * Escapes a single cell value for CSV output.
 * Prefixes formula triggers with a single quote (') to neutralize spreadsheet injection.
 * Escapes quotes and wraps strings with quotes if they contain commas, quotes, or newlines.
 * @param {any} value
 * @returns {string}
 */
export function sanitizeAndEscapeCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Formula injection defense: neutralize spreadsheet triggers
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    str = `'${str}`;
  }

  // RFC 4180 escaping: if cell contains quotes, commas, or newlines, quote the field
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of headers and an array of rows into a valid CSV string.
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 * @returns {string}
 */
export function formatCsv(headers, rows) {
  const headerLine = headers.map(sanitizeAndEscapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeAndEscapeCsvCell).join(','));

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Slugify a form title for safe use in Content-Disposition filename.
 * @param {string} title
 * @returns {string}
 */
export function slugifyTitle(title) {
  return (title || 'form')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'form';
}
