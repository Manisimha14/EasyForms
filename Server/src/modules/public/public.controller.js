// src/modules/public/public.controller.js
// Handles HTTP request/response for public form views and submissions.

import { asyncHandler } from '../../utils/async-handler.js';
import * as publicService from './public.service.js';

export const getPublicForm = asyncHandler(async (req, res) => {
  const data = await publicService.getPublicFormBySlug(req.params.slug);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    success: true,
    data,
  });
});

export const submitResponse = asyncHandler(async (req, res) => {
  const result = await publicService.submitResponse(
    req.params.slug,
    req.body.answers
  );
  res.status(201).json({
    success: true,
    data: result,
  });
});
