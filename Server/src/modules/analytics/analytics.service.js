// src/modules/analytics/analytics.service.js
// Business logic for owner dashboard statistics, per-form answer analytics,
// and daily response trends with zero-count UTC bucket generation.

import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import { NotFoundError } from '../../utils/app-error.js';
import {
  summarizeTextField,
  summarizeNumberField,
  summarizeBooleanField,
  summarizeSelectField,
  summarizeMultiSelectField,
  summarizeRatingField,
  buildTrendPoints,
} from './analytics.helpers.js';
import { LIMITS } from '../../constants/form.constants.js';

/**
 * Compute overall dashboard statistics across all forms owned by the user.
 * Scoped to UTC month boundaries. monthOverMonthChangePercent is null if last month has 0 responses.
 * @param {string} userId
 */
export async function getDashboardStats(userId) {
  const [totalForms, draftForms, publishedForms, ownerForms] = await Promise.all([
    Form.countDocuments({ ownerId: userId }),
    Form.countDocuments({ ownerId: userId, status: 'draft' }),
    Form.countDocuments({ ownerId: userId, status: 'published' }),
    Form.find({ ownerId: userId }).select('_id'),
  ]);

  const formIds = ownerForms.map((f) => f._id);

  if (formIds.length === 0) {
    return {
      totalForms,
      draftForms,
      publishedForms,
      totalResponses: 0,
      responsesThisMonth: 0,
      responsesLastMonth: 0,
      monthOverMonthChangePercent: null,
    };
  }

  // Calculate UTC month date boundaries
  const now = new Date();
  const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const endOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

  const [totalResponses, responsesThisMonth, responsesLastMonth] = await Promise.all([
    Response.countDocuments({ formId: { $in: formIds } }),
    Response.countDocuments({
      formId: { $in: formIds },
      submittedAt: { $gte: startOfThisMonth },
    }),
    Response.countDocuments({
      formId: { $in: formIds },
      submittedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),
  ]);

  let monthOverMonthChangePercent = null;
  if (responsesLastMonth > 0) {
    monthOverMonthChangePercent = Math.round(
      ((responsesThisMonth - responsesLastMonth) / responsesLastMonth) * 100
    );
  }

  return {
    totalForms,
    draftForms,
    publishedForms,
    totalResponses,
    responsesThisMonth,
    responsesLastMonth,
    monthOverMonthChangePercent,
  };
}

/**
 * Compute per-question-type answer summaries for a form within an optional date window.
 * Scoped to current fields only.
 * @param {string} userId
 * @param {string} formId
 * @param {object} query
 */
export async function getFormAnalytics(userId, formId, query) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const filter = { formId };
  if (query.startDate || query.endDate) {
    filter.submittedAt = {};
    if (query.startDate) {
      filter.submittedAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.endDate)) {
        end.setUTCHours(23, 59, 59, 999);
      }
      filter.submittedAt.$lte = end;
    }
  }

  const [totalResponses, responsesInWindow, responses] = await Promise.all([
    Response.countDocuments({ formId }),
    Response.countDocuments(filter),
    Response.find(filter).lean(),
  ]);

  // Group raw answers by fieldId
  const answersByFieldId = new Map();
  for (const r of responses) {
    for (const ans of r.answers || []) {
      if (!answersByFieldId.has(ans.fieldId)) {
        answersByFieldId.set(ans.fieldId, []);
      }
      answersByFieldId.get(ans.fieldId).push(ans.value);
    }
  }

  const fieldsSummary = {};
  for (const field of form.fields || []) {
    const values = answersByFieldId.get(field.id) || [];

    switch (field.type) {
      case 'short_text':
      case 'long_text':
      case 'email':
      case 'date':
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          ...summarizeTextField(values, responsesInWindow),
        };
        break;

      case 'number':
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          ...summarizeNumberField(values, responsesInWindow),
        };
        break;

      case 'yes_no':
      case 'checkbox':
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          ...summarizeBooleanField(values, responsesInWindow),
        };
        break;

      case 'single_select':
      case 'dropdown':
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          ...summarizeSelectField(field.options, values, responsesInWindow),
        };
        break;

      case 'multi_select':
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          ...summarizeMultiSelectField(field.options, values, responsesInWindow),
        };
        break;

      case 'rating': {
        const min = field.validation?.min ?? LIMITS.RATING_MIN_DEFAULT;
        const max = field.validation?.max ?? LIMITS.RATING_MAX_DEFAULT;
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          ...summarizeRatingField(min, max, values, responsesInWindow),
        };
        break;
      }

      default:
        fieldsSummary[field.id] = {
          type: field.type,
          label: field.label,
          answered: values.length,
          unanswered: Math.max(0, responsesInWindow - values.length),
        };
    }
  }

  return {
    totalResponses,
    responsesInWindow,
    fields: fieldsSummary,
  };
}

/**
 * Generate daily response trend points for 7d, 30d, or 90d including zero-count days.
 * @param {string} userId
 * @param {string} formId
 * @param {string} range '7d' | '30d' | '90d'
 */
export async function getFormTrends(userId, formId, range = '7d') {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const daysCount = parseInt(range, 10) || 7;
  const now = new Date();
  const startUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - (daysCount - 1),
    0, 0, 0, 0
  ));

  const rawAggregation = await Response.aggregate([
    {
      $match: {
        formId: form._id,
        submittedAt: { $gte: startUtc },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$submittedAt',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
      },
    },
  ]);

  const points = buildTrendPoints(daysCount, rawAggregation, now);

  return {
    range,
    timezone: 'UTC',
    points,
  };
}
