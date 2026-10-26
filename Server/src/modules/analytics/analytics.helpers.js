// src/modules/analytics/analytics.helpers.js
// Pure helper functions for per-question-type statistics and trend bucket generation.
// Scoped to UTC date math and unit-testable without a database connection.

/**
 * Summarize answers for text-like fields (short_text, long_text, email, date).
 * Never exposes actual respondent content.
 * @param {any[]} values
 * @param {number} totalCount
 */
export function summarizeTextField(values, totalCount) {
  const answered = values.filter((v) => v !== null && v !== undefined && String(v).trim().length > 0).length;
  return {
    answered,
    unanswered: Math.max(0, totalCount - answered),
  };
}

/**
 * Summarize numeric fields with average, min, and max.
 * @param {any[]} values
 * @param {number} totalCount
 */
export function summarizeNumberField(values, totalCount) {
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) {
    return {
      answered: 0,
      unanswered: totalCount,
      average: null,
      min: null,
      max: null,
    };
  }

  const sum = nums.reduce((acc, curr) => acc + curr, 0);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const average = Number((sum / nums.length).toFixed(2));

  return {
    answered: nums.length,
    unanswered: Math.max(0, totalCount - nums.length),
    average,
    min,
    max,
  };
}

/**
 * Summarize boolean fields (yes_no, checkbox).
 * @param {any[]} values
 * @param {number} totalCount
 */
export function summarizeBooleanField(values, totalCount) {
  let trueCount = 0;
  let falseCount = 0;

  for (const v of values) {
    if (v === true) trueCount += 1;
    else if (v === false) falseCount += 1;
  }

  const answered = trueCount + falseCount;
  return {
    trueCount,
    falseCount,
    unanswered: Math.max(0, totalCount - answered),
  };
}

/**
 * Summarize single-selection and dropdown fields with counts per option.
 * @param {string[]} configuredOptions
 * @param {any[]} values
 * @param {number} totalCount
 */
export function summarizeSelectField(configuredOptions, values, totalCount) {
  const optionCounts = {};
  for (const opt of configuredOptions || []) {
    optionCounts[opt] = 0;
  }

  let answered = 0;
  for (const v of values) {
    if (typeof v === 'string' && optionCounts[v] !== undefined) {
      optionCounts[v] += 1;
      answered += 1;
    }
  }

  return {
    optionCounts,
    answered,
    unanswered: Math.max(0, totalCount - answered),
  };
}

/**
 * Summarize multi-selection fields with counts per selected option.
 * @param {string[]} configuredOptions
 * @param {any[]} values
 * @param {number} totalCount
 */
export function summarizeMultiSelectField(configuredOptions, values, totalCount) {
  const optionCounts = {};
  for (const opt of configuredOptions || []) {
    optionCounts[opt] = 0;
  }

  let answered = 0;
  for (const arr of values) {
    if (Array.isArray(arr) && arr.length > 0) {
      answered += 1;
      for (const item of arr) {
        if (typeof item === 'string' && optionCounts[item] !== undefined) {
          optionCounts[item] += 1;
        }
      }
    }
  }

  return {
    optionCounts,
    answered,
    unanswered: Math.max(0, totalCount - answered),
  };
}

/**
 * Summarize rating fields with distribution per integer rating and average.
 * @param {number} min
 * @param {number} max
 * @param {any[]} values
 * @param {number} totalCount
 */
export function summarizeRatingField(min, max, values, totalCount) {
  const distribution = {};
  for (let i = min; i <= max; i += 1) {
    distribution[i] = 0;
  }

  const ratings = values.filter((v) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max);

  for (const r of ratings) {
    distribution[r] += 1;
  }

  const average = ratings.length > 0
    ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
    : null;

  return {
    average,
    distribution,
    answered: ratings.length,
    unanswered: Math.max(0, totalCount - ratings.length),
  };
}

/**
 * Generate a complete series of zero-filled daily points for a UTC day range ending today.
 * @param {number} daysCount (e.g. 7, 30, 90)
 * @param {Array<{ date: string, count: number }>} rawData
 * @param {Date} [referenceDate] Defaults to new Date()
 * @returns {Array<{ date: string, count: number }>}
 */
export function buildTrendPoints(daysCount, rawData = [], referenceDate = new Date()) {
  const countsMap = new Map();
  for (const item of rawData) {
    countsMap.set(item.date, item.count);
  }

  const points = [];
  // Build date points starting from (daysCount - 1) days ago up to today (UTC)
  const endUtc = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));

  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const d = new Date(endUtc.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    points.push({
      date: dateStr,
      count: countsMap.get(dateStr) || 0,
    });
  }

  return points;
}
