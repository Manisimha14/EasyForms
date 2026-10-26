// src/modules/public/public.routes.js
// Express router for public form access and submission.
// No authentication required. Protected by strict rate limits and body size caps.

import express, { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  publicReadLimiter,
  publicSubmitLimiter,
} from '../../middleware/rate-limiters.js';
import { LIMITS } from '../../constants/form.constants.js';
import * as publicController from './public.controller.js';

const router = Router();

const slugParamsSchema = z
  .object({
    slug: z.string().regex(/^[0-9a-z]{10}$/, 'Invalid form slug format.'),
  })
  .strict();

const submissionBodySchema = z
  .object({
    answers: z.array(
      z
        .object({
          fieldId: z.string().min(1, 'fieldId is required.'),
          value: z.any(),
        })
        .strict()
    ),
  })
  .strict();

// Public form retrieval (120 req / 15m)
router.get(
  '/forms/:slug',
  publicReadLimiter,
  validate({ params: slugParamsSchema }),
  publicController.getPublicForm
);

// Public submission (20 req / 15m per IP per slug, 256 KB body limit)
router.post(
  '/forms/:slug/responses',
  express.json({ limit: LIMITS.PUBLIC_BODY_LIMIT }),
  publicSubmitLimiter,
  validate({ params: slugParamsSchema, body: submissionBodySchema }),
  publicController.submitResponse
);

export { router as publicRoutes };
