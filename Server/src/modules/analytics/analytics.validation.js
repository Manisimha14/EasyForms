// src/modules/analytics/analytics.validation.js
// Zod schemas for dashboard and analytics endpoints.

import { z } from 'zod';
import { objectIdSchema } from '../forms/form.validation.js';

export const analyticsQuerySchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();

export const trendsQuerySchema = z
  .object({
    range: z.enum(['7d', '30d', '90d']).default('7d'),
  })
  .strict();

export const formIdParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();
