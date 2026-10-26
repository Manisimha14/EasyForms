// src/modules/forms/form.validation.js
// Zod schemas for form CRUD operations.
// Strict schemas reject any extra parameters (like ownerId, slug, status).

import { z } from 'zod';
import { LIMITS, FORM_STATUS, FORM_VISIBILITY } from '../../constants/form.constants.js';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');

export const formIdParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const createFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LIMITS.FORM_TITLE_MIN, 'Title is required.')
      .max(LIMITS.FORM_TITLE_MAX, `Title must not exceed ${LIMITS.FORM_TITLE_MAX} characters.`),
    description: z
      .string()
      .max(LIMITS.FORM_DESCRIPTION_MAX, `Description must not exceed ${LIMITS.FORM_DESCRIPTION_MAX} characters.`)
      .optional(),
  })
  .strict();

export const listFormsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(LIMITS.PAGINATION_MAX_LIMIT).default(LIMITS.PAGINATION_DEFAULT_LIMIT),
    status: z.enum([FORM_STATUS.DRAFT, FORM_STATUS.PUBLISHED]).optional(),
    search: z.string().max(LIMITS.SEARCH_MAX_LENGTH).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

const dateOrNull = z.union([
  z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid date format.',
  }),
  z.date(),
  z.null(),
]);

export const updateFormMetadataSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LIMITS.FORM_TITLE_MIN, 'Title cannot be empty.')
      .max(LIMITS.FORM_TITLE_MAX, `Title must not exceed ${LIMITS.FORM_TITLE_MAX} characters.`)
      .optional(),
    description: z
      .string()
      .max(LIMITS.FORM_DESCRIPTION_MAX, `Description must not exceed ${LIMITS.FORM_DESCRIPTION_MAX} characters.`)
      .optional(),
    visibility: z.enum([FORM_VISIBILITY.PUBLIC, FORM_VISIBILITY.UNLISTED]).optional(),
    startAt: dateOrNull.optional(),
    endAt: dateOrNull.optional(),
    maxResponses: z.union([z.coerce.number().int().positive('Max responses must be greater than 0.'), z.null()]).optional(),
    notifications: z
      .object({
        respondentReceipt: z.boolean().optional(),
        ownerNotification: z.boolean().optional(),
        respondentEmailFieldId: z.union([z.string().trim(), z.null()]).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update.',
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'End date and time must be later than start date and time.',
      path: ['endAt'],
    }
  );
