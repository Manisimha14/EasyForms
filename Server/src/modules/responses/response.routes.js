// src/modules/responses/response.routes.js
// Express router for form responses.
// Note: /export is mounted BEFORE /:responseId so 'export' is not parsed as an ID.

import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as responseValidation from './response.validation.js';
import * as responseController from './response.controller.js';

const router = Router({ mergeParams: true });

// List responses for a form
router.get(
  '/',
  validate({
    params: responseValidation.formIdOnlyParamsSchema,
    query: responseValidation.listResponsesSchema,
  }),
  responseController.listResponses
);

// CSV export (MUST be registered before /:responseId)
router.get(
  '/export',
  validate({
    params: responseValidation.formIdOnlyParamsSchema,
    query: responseValidation.exportResponsesSchema,
  }),
  responseController.exportResponsesCsv
);

// Get single response by ID
router.get(
  '/:responseId',
  validate({ params: responseValidation.responseIdParamsSchema }),
  responseController.getResponse
);

// Delete single response by ID
router.delete(
  '/:responseId',
  validate({ params: responseValidation.responseIdParamsSchema }),
  responseController.deleteResponse
);

export { router as responseRoutes };
