// src/modules/analytics/analytics.routes.js
// Express router for per-form analytics and daily trends.

import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as analyticsValidation from './analytics.validation.js';
import * as analyticsController from './analytics.controller.js';

const router = Router({ mergeParams: true });

// Form analytics summary
router.get(
  '/',
  validate({
    params: analyticsValidation.formIdParamsSchema,
    query: analyticsValidation.analyticsQuerySchema,
  }),
  analyticsController.getFormAnalytics
);

// Daily response trend points
router.get(
  '/trends',
  validate({
    params: analyticsValidation.formIdParamsSchema,
    query: analyticsValidation.trendsQuerySchema,
  }),
  analyticsController.getFormTrends
);

export { router as analyticsRoutes };
