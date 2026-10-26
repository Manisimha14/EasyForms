// src/modules/responses/response.validation.js
// Zod schemas for private response management and export queries.

import { z } from 'zod';
import { objectIdSchema } from '../forms/form.validation.js';
import { LIMITS } from '../../constants/form.constants.js';

export const responseIdParamsSchema = z
  .object({
    id: objectIdSchema,
    responseId: objectIdSchema,
  })
  .strict();

export const formIdOnlyParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const listResponsesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(LIMITS.PAGINATION_MAX_LIMIT).default(LIMITS.PAGINATION_DEFAULT_LIMIT),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['submittedAt']).default('submittedAt'),
    order: z.enum(['asc', 'desc']).optional(),
    sort: z.enum(['asc', 'desc']).optional(),
  })
  .strict()
  .transform((data) => ({
    ...data,
    order: data.order || data.sort || 'desc',
  }));

export const exportResponsesSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();
