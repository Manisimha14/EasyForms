// src/utils/pagination.js
// Standardized pagination calculation and envelope builder.

/**
 * Compute pagination parameters from raw inputs.
 * Defaults: page = 1, limit = 20, max limit = 100.
 * @param {number|string} [page=1]
 * @param {number|string} [limit=20]
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function getPaginationParams(page = 1, limit = 20) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
}

/**
 * Format pagination metadata for the API response envelope.
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
export function formatPagination(page, limit, total) {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    page,
    limit,
    total,
    totalPages,
  };
}
