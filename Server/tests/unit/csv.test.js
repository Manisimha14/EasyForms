// tests/unit/csv.test.js
// Unit tests for CSV formatting, RFC 4180 escaping, and spreadsheet formula injection defense.

import {
  sanitizeAndEscapeCsvCell,
  formatCsv,
  slugifyTitle,
} from '../../src/utils/csv.js';

describe('CSV utilities', () => {
  describe('sanitizeAndEscapeCsvCell', () => {
    test('neutralizes formula injection triggers (=, +, -, @, \\t, \\r) with leading single quote', () => {
      expect(sanitizeAndEscapeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeAndEscapeCsvCell('+12345')).toBe("'+12345");
      expect(sanitizeAndEscapeCsvCell('-cmd|/c calc')).toBe("'-cmd|/c calc");
      expect(sanitizeAndEscapeCsvCell('@SUM(A1:B10)')).toBe("'@SUM(A1:B10)");
      expect(sanitizeAndEscapeCsvCell('@SUM(1,2)')).toBe('"' + "'@SUM(1,2)" + '"'); // comma requires RFC 4180 quotes
      expect(sanitizeAndEscapeCsvCell('\ttext')).toBe("'\ttext");
      expect(sanitizeAndEscapeCsvCell('\rtext')).toBe('"\'\rtext"'); // \r requires RFC 4180 quotes
    });

    test('escapes quotes by doubling them and wrapping cell in quotes (RFC 4180)', () => {
      expect(sanitizeAndEscapeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    });

    test('wraps cell in quotes if it contains commas or newlines (RFC 4180)', () => {
      expect(sanitizeAndEscapeCsvCell('Apple, Banana')).toBe('"Apple, Banana"');
      expect(sanitizeAndEscapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    test('handles null and undefined as empty string', () => {
      expect(sanitizeAndEscapeCsvCell(null)).toBe('');
      expect(sanitizeAndEscapeCsvCell(undefined)).toBe('');
    });

    test('passes standard alphanumeric text through unchanged', () => {
      expect(sanitizeAndEscapeCsvCell('Simple Text 123')).toBe('Simple Text 123');
    });
  });

  describe('formatCsv', () => {
    test('produces valid CSV string with CRLF row delimiters', () => {
      const headers = ['Name', 'Role', 'Formula'];
      const rows = [
        ['Alice', 'Developer', '=1+1'],
        ['Bob "The Builder"', 'Manager, Lead', 'Safe'],
      ];

      const csv = formatCsv(headers, rows);

      expect(csv).toBe(
        'Name,Role,Formula\r\n' +
        "Alice,Developer,'=1+1\r\n" +
        '"Bob ""The Builder""","Manager, Lead",Safe'
      );
    });
  });

  describe('slugifyTitle', () => {
    test('converts titles to lowercase URL/filename safe strings', () => {
      expect(slugifyTitle('Customer Satisfaction Survey 2026!')).toBe(
        'customer-satisfaction-survey-2026'
      );
      expect(slugifyTitle('   Special   --- Title   ')).toBe('special-title');
      expect(slugifyTitle('')).toBe('form');
    });
  });
});
