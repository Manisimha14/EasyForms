// src/modules/responses/answer-validator.js
// Strict per-field answer schema generation and validation without type coercion.
// Enforces required rules, bounds, options, and calendar date validity.

import { z } from 'zod';
import { isValidCalendarDate } from '../forms/field.validation.js';
import { LIMITS } from '../../constants/form.constants.js';

/**
 * Builds a strict Zod schema for a specific field definition.
 * Does not coerce types (e.g. "5" is rejected for numbers/ratings).
 * @param {object} field
 * @returns {z.ZodTypeAny}
 */
export function buildAnswerSchema(field) {
  let schema;

  switch (field.type) {
    case 'short_text': {
      const min = field.validation?.minLength ?? 0;
      const max = field.validation?.maxLength ?? LIMITS.SHORT_TEXT_MAX_LENGTH;
      schema = z
        .string({ invalid_type_error: 'Must be a text string.' })
        .refine((val) => val.trim().length >= min, {
          message: `Text must be at least ${min} characters.`,
        })
        .refine((val) => val.trim().length <= max, {
          message: `Text cannot exceed ${max} characters.`,
        });
      if (field.required) {
        schema = schema.refine((val) => val.trim().length > 0, {
          message: 'This question is required.',
        });
      }
      break;
    }

    case 'long_text': {
      const min = field.validation?.minLength ?? 0;
      const max = field.validation?.maxLength ?? LIMITS.LONG_TEXT_MAX_LENGTH;
      schema = z
        .string({ invalid_type_error: 'Must be a text string.' })
        .refine((val) => val.trim().length >= min, {
          message: `Text must be at least ${min} characters.`,
        })
        .refine((val) => val.trim().length <= max, {
          message: `Text cannot exceed ${max} characters.`,
        });
      if (field.required) {
        schema = schema.refine((val) => val.trim().length > 0, {
          message: 'This question is required.',
        });
      }
      break;
    }

    case 'number': {
      schema = z
        .number({ invalid_type_error: 'Must be a valid number.' })
        .refine((val) => Number.isFinite(val), 'Must be a finite number.');
      if (field.validation?.min !== undefined) {
        const minVal = field.validation.min;
        schema = schema.refine((val) => val >= minVal, {
          message: `Number must be at least ${minVal}.`,
        });
      }
      if (field.validation?.max !== undefined) {
        const maxVal = field.validation.max;
        schema = schema.refine((val) => val <= maxVal, {
          message: `Number cannot exceed ${maxVal}.`,
        });
      }
      break;
    }

    case 'yes_no':
    case 'checkbox': {
      schema = z.boolean({ invalid_type_error: 'Must be a boolean (true or false).' });
      break;
    }

    case 'email': {
      schema = z
        .string({ invalid_type_error: 'Must be an email string.' })
        .trim()
        .email('Invalid email address.')
        .max(254, 'Email cannot exceed 254 characters.');
      if (field.required) {
        schema = schema.refine((val) => val.trim().length > 0, {
          message: 'This question is required.',
        });
      }
      break;
    }

    case 'single_select':
    case 'dropdown': {
      const allowedOptions = new Set((field.options || []).map((o) => o.trim()));
      schema = z
        .string({ invalid_type_error: 'Must be a selected option string.' })
        .refine((val) => allowedOptions.has(val.trim()), {
          message: 'Selected value is not one of the allowed options.',
        });
      break;
    }

    case 'multi_select': {
      const allowedOptions = new Set((field.options || []).map((o) => o.trim()));
      schema = z
        .array(z.string({ invalid_type_error: 'Options must be strings.' }), {
          invalid_type_error: 'Must be an array of selected options.',
        })
        .refine((arr) => arr.every((item) => allowedOptions.has(item.trim())), {
          message: 'One or more selected values are not in the allowed options.',
        })
        .refine((arr) => new Set(arr.map((i) => i.trim())).size === arr.length, {
          message: 'Selected options must be unique.',
        });
      if (field.required) {
        schema = schema.refine((arr) => arr.length > 0, {
          message: 'At least one option must be selected.',
        });
      }
      break;
    }

    case 'rating': {
      const min = field.validation?.min ?? LIMITS.RATING_MIN_DEFAULT;
      const max = field.validation?.max ?? LIMITS.RATING_MAX_DEFAULT;
      schema = z
        .number({ invalid_type_error: 'Rating must be an integer.' })
        .int('Rating must be an integer.')
        .refine((val) => val >= min && val <= max, {
          message: `Rating must be between ${min} and ${max}.`,
        });
      break;
    }

    case 'date': {
      schema = z
        .string({ invalid_type_error: 'Date must be a string.' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.')
        .refine(isValidCalendarDate, 'Must be a valid calendar date.');
      if (field.validation?.minDate) {
        const minDate = field.validation.minDate;
        schema = schema.refine((val) => val >= minDate, {
          message: `Date cannot be earlier than ${minDate}.`,
        });
      }
      if (field.validation?.maxDate) {
        const maxDate = field.validation.maxDate;
        schema = schema.refine((val) => val <= maxDate, {
          message: `Date cannot be later than ${maxDate}.`,
        });
      }
      break;
    }

    case 'file_upload': {
      schema = z.union([
        z.string().max(20000000, 'File attachment exceeds maximum size limit.'),
        z.object({
          name: z.string().max(255).optional(),
          size: z.number().nonnegative().optional(),
          type: z.string().max(120).optional(),
          dataUrl: z.string().max(20000000).optional(),
          url: z.string().max(2000).optional(),
        }).passthrough(),
      ]);
      if (field.required) {
        schema = schema.refine(
          (val) => {
            if (!val) return false;
            if (typeof val === 'string') return val.trim().length > 0;
            return Boolean(val.url || val.dataUrl || val.name);
          },
          { message: 'Please upload a file.' }
        );
      }
      break;
    }

    default:
      schema = z.any();
  }

  return schema;
}

/**
 * Validate submitted answers against the form's field definitions.
 * Returns { validAnswers, errors }
 * @param {object} form
 * @param {Array<{ fieldId: string, value: any }>} rawAnswers
 */
export function validateFormSubmission(form, rawAnswers) {
  const errors = [];
  const fieldsMap = new Map((form.fields || []).map((f) => [f.id, f]));
  const answeredFieldIds = new Set();
  const validAnswers = [];

  // Check structure: no more answers than fields
  if (rawAnswers.length > form.fields.length) {
    errors.push({
      path: 'answers',
      message: 'Too many answers submitted.',
    });
  }

  for (let idx = 0; idx < rawAnswers.length; idx += 1) {
    const item = rawAnswers[idx];

    if (!item || typeof item !== 'object' || !item.fieldId) {
      errors.push({
        path: `answers[${idx}]`,
        message: 'Each answer must include a fieldId.',
      });
      continue;
    }

    const { fieldId, value } = item;

    // Check unknown field ID
    if (!fieldsMap.has(fieldId)) {
      errors.push({
        path: `answers[${idx}].fieldId`,
        message: `Unknown field ID '${fieldId}'.`,
      });
      continue;
    }

    // Check duplicate answer for the same field ID
    if (answeredFieldIds.has(fieldId)) {
      errors.push({
        path: `answers[${idx}].fieldId`,
        message: `Duplicate answer for field ID '${fieldId}'.`,
      });
      continue;
    }
    answeredFieldIds.add(fieldId);

    const field = fieldsMap.get(fieldId);

    // If answer is null or undefined
    if (value === null || value === undefined) {
      if (field.required) {
        errors.push({
          path: `answers.${fieldId}`,
          message: `Field '${field.label}' is required.`,
        });
      }
      // Unanswered optional answers are omitted from storage
      continue;
    }

    // Validate value against type schema
    const schema = buildAnswerSchema(field);
    const parsed = schema.safeParse(value);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          path: `answers.${fieldId}`,
          message: issue.message,
        });
      }
    } else {
      validAnswers.push({
        fieldId,
        value: parsed.data,
      });
    }
  }

  // Check that all required fields were answered
  for (const field of form.fields || []) {
    if (field.required && !answeredFieldIds.has(field.id)) {
      errors.push({
        path: `answers.${field.id}`,
        message: `Field '${field.label}' is required.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    validAnswers,
    errors,
  };
}
