// tests/unit/analytics-helpers.test.js
// Unit tests for per-type answer summarization and UTC trend generation.

import {
  summarizeTextField,
  summarizeNumberField,
  summarizeBooleanField,
  summarizeSelectField,
  summarizeMultiSelectField,
  summarizeRatingField,
  buildTrendPoints,
} from '../../src/modules/analytics/analytics.helpers.js';

describe('Analytics Helpers', () => {
  test('summarizeTextField counts answered and unanswered without exposing content', () => {
    const values = ['Alex', '', null, 'Jordan', '   ', undefined];
    const result = summarizeTextField(values, 6);

    expect(result.answered).toBe(2);
    expect(result.unanswered).toBe(4);
  });

  test('summarizeNumberField computes average, min, and max correctly', () => {
    const values = [10, 20, 30, null, 40];
    const result = summarizeNumberField(values, 5);

    expect(result.answered).toBe(4);
    expect(result.unanswered).toBe(1);
    expect(result.average).toBe(25);
    expect(result.min).toBe(10);
    expect(result.max).toBe(40);
  });

  test('summarizeNumberField handles 0 answered numbers gracefully', () => {
    const values = [null, undefined, 'not-a-number'];
    const result = summarizeNumberField(values, 3);

    expect(result.answered).toBe(0);
    expect(result.unanswered).toBe(3);
    expect(result.average).toBeNull();
    expect(result.min).toBeNull();
    expect(result.max).toBeNull();
  });

  test('summarizeBooleanField counts true, false, and unanswered', () => {
    const values = [true, false, true, true, null];
    const result = summarizeBooleanField(values, 5);

    expect(result.trueCount).toBe(3);
    expect(result.falseCount).toBe(1);
    expect(result.unanswered).toBe(1);
  });

  test('summarizeSelectField aggregates counts per configured option', () => {
    const options = ['Red', 'Green', 'Blue'];
    const values = ['Red', 'Blue', 'Red', 'Unknown', null];
    const result = summarizeSelectField(options, values, 5);

    expect(result.optionCounts).toEqual({
      Red: 2,
      Green: 0,
      Blue: 1,
    });
    expect(result.answered).toBe(3);
    expect(result.unanswered).toBe(2);
  });

  test('summarizeMultiSelectField counts multiple options per respondent', () => {
    const options = ['JavaScript', 'Python', 'Go'];
    const values = [
      ['JavaScript', 'Python'],
      ['Python'],
      ['Go', 'JavaScript'],
      [],
    ];
    const result = summarizeMultiSelectField(options, values, 4);

    expect(result.optionCounts).toEqual({
      JavaScript: 2,
      Python: 2,
      Go: 1,
    });
    expect(result.answered).toBe(3);
  });

  test('summarizeRatingField computes average and exact distribution across rating scale', () => {
    const values = [5, 4, 5, 1, null];
    const result = summarizeRatingField(1, 5, values, 5);

    expect(result.answered).toBe(4);
    expect(result.unanswered).toBe(1);
    expect(result.distribution).toEqual({
      1: 1,
      2: 0,
      3: 0,
      4: 1,
      5: 2,
    });
    // (5 + 4 + 5 + 1) / 4 = 3.75
    expect(result.average).toBe(3.75);
  });

  test('buildTrendPoints returns exact number of points including zero counts', () => {
    const referenceDate = new Date('2026-10-25T12:00:00.000Z');
    const rawData = [
      { date: '2026-10-24', count: 5 },
      { date: '2026-10-25', count: 12 },
    ];

    const points = buildTrendPoints(7, rawData, referenceDate);

    expect(points).toHaveLength(7);
    expect(points[6].date).toBe('2026-10-25');
    expect(points[6].count).toBe(12);
    expect(points[5].date).toBe('2026-10-24');
    expect(points[5].count).toBe(5);
    expect(points[4].date).toBe('2026-10-23');
    expect(points[4].count).toBe(0);
  });
});
