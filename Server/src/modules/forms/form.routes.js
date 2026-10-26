// src/modules/forms/form.routes.js
// Express router for private form management endpoints.
// All endpoints require authentication.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as formValidation from './form.validation.js';
import * as fieldValidation from './field.validation.js';
import * as formController from './form.controller.js';
import { responseRoutes } from '../responses/response.routes.js';
import { analyticsRoutes } from '../analytics/analytics.routes.js';

const router = Router();

// Apply authentication to all form routes
router.use(authenticate);

// Sub-module routers
router.use('/:id/responses', responseRoutes);
router.use('/:id/analytics', analyticsRoutes);

router.post(
  '/',
  validate({ body: formValidation.createFormSchema }),
  formController.createForm
);

router.get(
  '/',
  validate({ query: formValidation.listFormsSchema }),
  formController.listForms
);

router.get(
  '/:id',
  validate({ params: formValidation.formIdParamsSchema }),
  formController.getForm
);

router.patch(
  '/:id',
  validate({
    params: formValidation.formIdParamsSchema,
    body: formValidation.updateFormMetadataSchema,
  }),
  formController.updateForm
);

router.put(
  '/:id/fields',
  validate({
    params: formValidation.formIdParamsSchema,
    body: fieldValidation.replaceFieldsSchema,
  }),
  formController.replaceFields
);

router.put(
  '/:id/theme',
  validate({
    params: formValidation.formIdParamsSchema,
    body: fieldValidation.updateThemeSchema,
  }),
  formController.updateTheme
);

router.post(
  '/:id/publish',
  validate({ params: formValidation.formIdParamsSchema }),
  formController.publishForm
);

router.post(
  '/:id/unpublish',
  validate({ params: formValidation.formIdParamsSchema }),
  formController.unpublishForm
);

router.delete(
  '/:id',
  validate({ params: formValidation.formIdParamsSchema }),
  formController.deleteForm
);

export { router as formRoutes };
