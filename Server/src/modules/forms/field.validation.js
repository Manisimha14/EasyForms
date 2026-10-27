// src/modules/forms/field.validation.js
// Zod validation schemas for all 11 question types, fields array, and themes.
// Enforces strict type-specific validation rules and limits.

import { z } from 'zod';
import { LIMITS } from '../../constants/form.constants.js';
import { ALLOWED_FONTS } from '../../constants/theme.constants.js';

/**
 * Validates whether a YYYY-MM-DD string is a valid real calendar date.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidCalendarDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.')
  .refine(isValidCalendarDate, 'Must be a valid real calendar date.');

// Base field attributes shared by all question types
const fieldIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Field ID must be 1-64 alphanumeric characters, underscores or hyphens.')
  .optional();

const baseFieldSchema = {
  id: fieldIdSchema,
  label: z
    .string()
    .trim()
    .min(1, 'Field label is required.')
    .max(LIMITS.FIELD_LABEL_MAX, `Field label cannot exceed ${LIMITS.FIELD_LABEL_MAX} characters.`),
  required: z.boolean().default(false),
  placeholder: z
    .string()
    .trim()
    .max(LIMITS.FIELD_PLACEHOLDER_MAX, `Placeholder cannot exceed ${LIMITS.FIELD_PLACEHOLDER_MAX} characters.`)
    .default(''),
  description: z
    .string()
    .trim()
    .max(LIMITS.FIELD_DESCRIPTION_MAX, `Description cannot exceed ${LIMITS.FIELD_DESCRIPTION_MAX} characters.`)
    .default(''),
  order: z.number().int('Order must be an integer.'),
};

// Selection options schema (1-100 unique non-empty strings)
const optionsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Option cannot be empty.')
      .max(LIMITS.OPTION_TEXT_MAX, `Option text cannot exceed ${LIMITS.OPTION_TEXT_MAX} characters.`)
  )
  .min(1, 'Selection fields must have at least one option.')
  .max(LIMITS.MAX_OPTIONS_PER_FIELD, `Selection fields cannot exceed ${LIMITS.MAX_OPTIONS_PER_FIELD} options.`)
  .refine(
    (opts) => new Set(opts.map((o) => o.trim())).size === opts.length,
    'Options must be unique.'
  );

// Individual type schemas
const shortTextFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('short_text'),
    options: z.undefined().optional(),
    validation: z
      .object({
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(0).max(LIMITS.SHORT_TEXT_MAX_LENGTH).optional(),
      })
      .strict()
      .optional()
      .refine(
        (v) => !v || v.minLength === undefined || v.maxLength === undefined || v.minLength <= v.maxLength,
        'minLength must be less than or equal to maxLength.'
      ),
  })
  .strict();

const longTextFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('long_text'),
    options: z.undefined().optional(),
    validation: z
      .object({
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(0).max(LIMITS.LONG_TEXT_MAX_LENGTH).optional(),
      })
      .strict()
      .optional()
      .refine(
        (v) => !v || v.minLength === undefined || v.maxLength === undefined || v.minLength <= v.maxLength,
        'minLength must be less than or equal to maxLength.'
      ),
  })
  .strict();

const numberFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('number'),
    options: z.undefined().optional(),
    validation: z
      .object({
        min: z.number().finite().optional(),
        max: z.number().finite().optional(),
      })
      .strict()
      .optional()
      .refine(
        (v) => !v || v.min === undefined || v.max === undefined || v.min <= v.max,
        'min must be less than or equal to max.'
      ),
  })
  .strict();

const yesNoFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('yes_no'),
    options: z.undefined().optional(),
    validation: z.object({}).strict().optional(),
  })
  .strict();

const emailFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('email'),
    options: z.undefined().optional(),
    validation: z.object({}).strict().optional(),
  })
  .strict();

const singleSelectFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('single_select'),
    options: optionsSchema,
    validation: z.object({}).strict().optional(),
  })
  .strict();

const multiSelectFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('multi_select'),
    options: optionsSchema,
    validation: z.object({}).strict().optional(),
  })
  .strict();

const checkboxFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('checkbox'),
    options: z.undefined().optional(),
    validation: z.object({}).strict().optional(),
  })
  .strict();

const dropdownFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('dropdown'),
    options: optionsSchema,
    validation: z.object({}).strict().optional(),
  })
  .strict();

const ratingFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('rating'),
    options: z.undefined().optional(),
    validation: z
      .object({
        min: z.number().int().min(1).default(LIMITS.RATING_MIN_DEFAULT),
        max: z.number().int().min(1).max(LIMITS.RATING_MAX_ALLOWED).default(LIMITS.RATING_MAX_DEFAULT),
      })
      .strict()
      .optional()
      .refine(
        (v) => !v || v.min <= v.max,
        'min rating must be less than or equal to max rating.'
      ),
  })
  .strict();

const dateFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('date'),
    options: z.undefined().optional(),
    validation: z
      .object({
        minDate: calendarDateSchema.optional(),
        maxDate: calendarDateSchema.optional(),
      })
      .strict()
      .optional()
      .refine(
        (v) => !v || !v.minDate || !v.maxDate || v.minDate <= v.maxDate,
        'minDate must be before or equal to maxDate.'
      ),
  })
  .strict();

const fileUploadFieldSchema = z
  .object({
    ...baseFieldSchema,
    type: z.literal('file_upload'),
    options: z.undefined().optional(),
    validation: z
      .object({
        maxSizeMb: z.number().positive().max(25).default(5).optional(),
        allowedExtensions: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const singleFieldSchema = z.discriminatedUnion('type', [
  shortTextFieldSchema,
  longTextFieldSchema,
  numberFieldSchema,
  yesNoFieldSchema,
  emailFieldSchema,
  singleSelectFieldSchema,
  multiSelectFieldSchema,
  checkboxFieldSchema,
  dropdownFieldSchema,
  ratingFieldSchema,
  dateFieldSchema,
  fileUploadFieldSchema,
]);

// Full replacement fields schema (PUT /forms/:id/fields)
export const replaceFieldsSchema = z
  .object({
    fields: z
      .array(singleFieldSchema)
      .max(LIMITS.MAX_FIELDS_PER_FORM, `A form cannot exceed ${LIMITS.MAX_FIELDS_PER_FORM} fields.`)
      .refine((fields) => {
        // Enforce uniqueness among supplied field IDs
        const suppliedIds = fields.map((f) => f.id).filter(Boolean);
        return new Set(suppliedIds).size === suppliedIds.length;
      }, 'Field IDs must be unique within the form.'),
  })
  .strict();

// Theme schema (PUT /forms/:id/theme)
export const updateThemeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Theme name is required.')
      .max(40, 'Theme name cannot exceed 40 characters.')
      .regex(/^[a-zA-Z0-9\s_-]+$/, 'Theme name can only contain letters, numbers, spaces, hyphens and underscores.'),
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'primaryColor must be a valid 6-character hex color (e.g. #4F46E5).'),
    backgroundColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'backgroundColor must be a valid 6-character hex color (e.g. #FFFFFF).'),
    fontFamily: z.enum(ALLOWED_FONTS, {
      errorMap: () => ({ message: `fontFamily must be one of: ${ALLOWED_FONTS.join(', ')}.` }),
    }),
  })
  .strict();
