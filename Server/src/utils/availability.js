// src/utils/availability.js
// Utility functions for form scheduling, response limit checking, and availability statuses.

/**
 * Calculate the availability status of a form.
 * Status values:
 * - 'draft': Form is not published
 * - 'scheduled': Form is published, but current time is before startAt
 * - 'closed': Form is published, but current time is at/after endAt or max responses reached
 * - 'open': Form is published and currently accepting responses
 *
 * @param {object} form
 * @param {number} [responseCount=0]
 * @param {Date|string|number} [now=new Date()]
 * @returns {'draft'|'scheduled'|'closed'|'open'}
 */
export function getAvailabilityStatus(form, responseCount = 0, now = new Date()) {
  if (!form || form.status !== 'published') {
    return 'draft';
  }

  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (form.startAt) {
    const startTime = new Date(form.startAt).getTime();
    if (!Number.isNaN(startTime) && currentTime < startTime) {
      return 'scheduled';
    }
  }

  if (form.endAt) {
    const endTime = new Date(form.endAt).getTime();
    if (!Number.isNaN(endTime) && currentTime >= endTime) {
      return 'closed';
    }
  }

  if (form.maxResponses != null && form.maxResponses > 0) {
    if (responseCount >= form.maxResponses) {
      return 'closed';
    }
  }

  return 'open';
}

/**
 * Evaluate if a submission can proceed based on scheduling and response limits.
 *
 * @param {object} form
 * @param {number} [responseCount=0]
 * @param {Date|string|number} [now=new Date()]
 * @returns {{ allowed: boolean, reason: string|null, message: string|null, statusCode: number }}
 */
export function checkSubmissionAvailability(form, responseCount = 0, now = new Date()) {
  if (!form || form.status !== 'published') {
    return {
      allowed: false,
      reason: 'unpublished',
      message: 'Form not found.',
      statusCode: 404,
    };
  }

  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (form.startAt) {
    const startTime = new Date(form.startAt).getTime();
    if (!Number.isNaN(startTime) && currentTime < startTime) {
      return {
        allowed: false,
        reason: 'scheduled',
        message: 'This form is not accepting responses yet.',
        statusCode: 403,
      };
    }
  }

  if (form.endAt) {
    const endTime = new Date(form.endAt).getTime();
    if (!Number.isNaN(endTime) && currentTime >= endTime) {
      return {
        allowed: false,
        reason: 'closed',
        message: 'This form is now closed.',
        statusCode: 403,
      };
    }
  }

  if (form.maxResponses != null && form.maxResponses > 0) {
    if (responseCount >= form.maxResponses) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: 'This form has reached its maximum response limit.',
        statusCode: 403,
      };
    }
  }

  return {
    allowed: true,
    reason: null,
    message: null,
    statusCode: 200,
  };
}
