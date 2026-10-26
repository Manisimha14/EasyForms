// src/modules/forms/form.controller.js
// Handles HTTP request/response parsing for form CRUD endpoints.
// Sets ETag header for revision tracking.

import { asyncHandler } from '../../utils/async-handler.js';
import * as formService from './form.service.js';

export const createForm = asyncHandler(async (req, res) => {
  const form = await formService.createForm(req.userId, req.body);
  res.setHeader('ETag', `"${form.revision}"`);
  res.status(201).json({
    success: true,
    data: form,
  });
});

export const listForms = asyncHandler(async (req, res) => {
  const result = await formService.listForms(req.userId, req.query);
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getForm = asyncHandler(async (req, res) => {
  const form = await formService.getFormById(req.userId, req.params.id);
  res.setHeader('ETag', `"${form.revision}"`);
  res.status(200).json({
    success: true,
    data: form,
  });
});

export const updateForm = asyncHandler(async (req, res) => {
  const ifMatch = req.headers['if-match'];
  const form = await formService.updateFormMetadata(
    req.userId,
    req.params.id,
    req.body,
    ifMatch
  );
  res.setHeader('ETag', `"${form.revision}"`);
  res.status(200).json({
    success: true,
    data: form,
  });
});

export const deleteForm = asyncHandler(async (req, res) => {
  await formService.deleteForm(req.userId, req.params.id);
  res.status(204).send();
});

export const replaceFields = asyncHandler(async (req, res) => {
  const ifMatch = req.headers['if-match'];
  const { form, warnings } = await formService.replaceFields(
    req.userId,
    req.params.id,
    req.body.fields,
    ifMatch
  );
  res.setHeader('ETag', `"${form.revision}"`);
  res.status(200).json({
    success: true,
    data: form,
    ...(warnings && warnings.length > 0 ? { warnings } : {}),
  });
});

export const updateTheme = asyncHandler(async (req, res) => {
  const ifMatch = req.headers['if-match'];
  const { theme, revision } = await formService.updateTheme(
    req.userId,
    req.params.id,
    req.body,
    ifMatch
  );
  res.setHeader('ETag', `"${revision}"`);
  res.status(200).json({
    success: true,
    data: theme,
  });
});

export const publishForm = asyncHandler(async (req, res) => {
  const result = await formService.publishForm(req.userId, req.params.id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const unpublishForm = asyncHandler(async (req, res) => {
  const result = await formService.unpublishForm(req.userId, req.params.id);
  res.status(200).json({
    success: true,
    data: result,
  });
});


