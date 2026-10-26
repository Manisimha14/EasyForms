// src/modules/responses/response.service.js
// Business logic for private response retrieval, individual response deletion,
// and CSV export with RFC 4180 escaping and formula injection protection.

import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import { NotFoundError, UnprocessableError } from '../../utils/app-error.js';
import { getPaginationParams, formatPagination } from '../../utils/pagination.js';
import { formatCsv, slugifyTitle } from '../../utils/csv.js';
import { LIMITS } from '../../constants/form.constants.js';

/**
 * Builds a database query filter for submittedAt based on optional start and end dates.
 * @param {string} formId
 * @param {string} [startDate]
 * @param {string} [endDate]
 */
function buildDateFilter(formId, startDate, endDate) {
  const filter = { formId };

  if (startDate || endDate) {
    filter.submittedAt = {};
    if (startDate) {
      filter.submittedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      // If date is simple YYYY-MM-DD, include the entire UTC day
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        end.setUTCHours(23, 59, 59, 999);
      }
      filter.submittedAt.$lte = end;
    }
  }

  return filter;
}

/**
 * List responses for a form owned by the authenticated user with pagination and date filters.
 * @param {string} userId
 * @param {string} formId
 * @param {object} query
 */
export async function listResponses(userId, formId, query) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const { page, limit, skip } = getPaginationParams(query.page, query.limit);
  const filter = buildDateFilter(formId, query.startDate, query.endDate);

  const total = await Response.countDocuments(filter);
  const sortOrder = query.order || query.sort || 'desc';
  const sort = { [query.sortBy || 'submittedAt']: sortOrder === 'asc' ? 1 : -1 };

  const responses = await Response.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const data = responses.map((r) => ({
    id: r._id.toString(),
    submittedAt: r.submittedAt,
    answers: r.answers,
  }));

  return {
    data,
    pagination: formatPagination(page, limit, total),
  };
}

/**
 * Retrieve a single response by ID with parent form ownership verification.
 * @param {string} userId
 * @param {string} formId
 * @param {string} responseId
 */
export async function getResponseById(userId, formId, responseId) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const response = await Response.findOne({ _id: responseId, formId });
  if (!response) {
    throw new NotFoundError('Response not found.');
  }

  return response.toJSON();
}

/**
 * Permanently delete a single response.
 * @param {string} userId
 * @param {string} formId
 * @param {string} responseId
 */
export async function deleteResponse(userId, formId, responseId) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const result = await Response.deleteOne({ _id: responseId, formId });
  if (result.deletedCount === 0) {
    throw new NotFoundError('Response not found.');
  }
}

/**
 * Export responses to CSV with formula injection defense and RFC 4180 escaping.
 * Caps export at 10,000 rows.
 * @param {string} userId
 * @param {string} formId
 * @param {object} query
 */
export async function exportResponsesCsv(userId, formId, query) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const filter = buildDateFilter(formId, query.startDate, query.endDate);
  const total = await Response.countDocuments(filter);

  if (total > LIMITS.CSV_ROW_LIMIT) {
    throw new UnprocessableError(
      `Export exceeds the ${LIMITS.CSV_ROW_LIMIT.toLocaleString()} rows limit. Please narrow your date range.`
    );
  }

  const sortedFields = [...(form.fields || [])].sort((a, b) => a.order - b.order);
  const headers = ['Submitted At', ...sortedFields.map((f) => f.label)];

  const responses = await Response.find(filter)
    .sort({ submittedAt: 1 })
    .lean();

  const rows = responses.map((r) => {
    const row = [r.submittedAt ? new Date(r.submittedAt).toISOString() : ''];
    const answerMap = new Map((r.answers || []).map((a) => [a.fieldId, a.value]));

    for (const field of sortedFields) {
      const val = answerMap.get(field.id);
      if (val === undefined || val === null) {
        row.push('');
      } else if (Array.isArray(val)) {
        // Multi-select values joined with " ;  "
        row.push(val.join(' ;  '));
      } else if (typeof val === 'boolean') {
        row.push(String(val));
      } else {
        row.push(val);
      }
    }

    return row;
  });

  const csv = formatCsv(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${slugifyTitle(form.title)}-responses-${dateStr}.csv`;

  return {
    csv,
    filename,
  };
}
