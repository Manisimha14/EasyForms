import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../utils/app-error.js';
import { validateFormSubmission } from '../responses/answer-validator.js';
import { getAvailabilityStatus, checkSubmissionAvailability } from '../../utils/availability.js';
import { handleSubmissionNotifications } from '../../services/email.service.js';
import { logger } from '../../config/logger.js';

/**
 * Retrieve public form structure for respondents.
 * Unpublished forms or non-existent slugs return 404 NOT_FOUND.
 * Excludes internal timestamps, ownership, status, revision, and response counts.
 * Communicates availability status: 'open', 'scheduled', or 'closed'.
 * @param {string} slug
 */
export async function getPublicFormBySlug(slug) {
  const form = await Form.findOne({ slug, status: 'published' });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const responseCount = await Response.countDocuments({ formId: form._id });
  const availabilityStatus = getAvailabilityStatus(form, responseCount);

  const sortedFields = [...(form.fields || [])]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      required: f.required,
      placeholder: f.placeholder || '',
      description: f.description || '',
      order: f.order,
      ...(f.options ? { options: f.options } : {}),
      ...(f.validation ? { validation: f.validation } : {}),
    }));

  return {
    title: form.title,
    description: form.description || '',
    fields: sortedFields,
    theme: form.theme,
    availability: {
      status: availabilityStatus,
      startAt: form.startAt || null,
      endAt: form.endAt || null,
      maxResponses: form.maxResponses || null,
    },
  };
}

/**
 * Validate and persist a respondent submission.
 * Enforces scheduling windows, maximum responses, and email notifications.
 * Rejects unknown or duplicate field IDs and type-coerced inputs.
 * @param {string} slug
 * @param {Array<{ fieldId: string, value: any }>} rawAnswers
 */
export async function submitResponse(slug, rawAnswers) {
  const form = await Form.findOne({ slug, status: 'published' });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  // Enforce availability window and response limits
  const responseCount = await Response.countDocuments({ formId: form._id });
  const availability = checkSubmissionAvailability(form, responseCount);
  if (!availability.allowed) {
    throw new ForbiddenError(availability.message);
  }

  if (!Array.isArray(rawAnswers)) {
    throw new ValidationError('The request contains invalid data.', [
      { path: 'answers', message: 'Answers must be an array.' },
    ]);
  }

  const { isValid, validAnswers, errors } = validateFormSubmission(form, rawAnswers);
  if (!isValid) {
    throw new ValidationError('The request contains invalid data.', errors);
  }

  const response = await Response.create({
    formId: form._id,
    answers: validAnswers,
    submittedAt: new Date(),
  });

  // Dispatch email notifications (safe delivery - never blocks or breaks response)
  handleSubmissionNotifications({
    form,
    response,
    answers: validAnswers,
  }).catch((err) => {
    logger.error({ err: err.message }, 'Failed to dispatch email notifications');
  });

  return {
    id: response._id.toString(),
    submittedAt: response.submittedAt,
  };
}
