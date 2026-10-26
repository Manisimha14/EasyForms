// src/modules/responses/response.controller.js
// Handles HTTP request/response parsing for response management and CSV export.

import { asyncHandler } from '../../utils/async-handler.js';
import * as responseService from './response.service.js';

export const listResponses = asyncHandler(async (req, res) => {
  const result = await responseService.listResponses(
    req.userId,
    req.params.id,
    req.query
  );
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getResponse = asyncHandler(async (req, res) => {
  const response = await responseService.getResponseById(
    req.userId,
    req.params.id,
    req.params.responseId
  );
  res.status(200).json({
    success: true,
    data: response,
  });
});

export const deleteResponse = asyncHandler(async (req, res) => {
  await responseService.deleteResponse(
    req.userId,
    req.params.id,
    req.params.responseId
  );
  res.status(204).send();
});

export const exportResponsesCsv = asyncHandler(async (req, res) => {
  const { csv, filename } = await responseService.exportResponsesCsv(
    req.userId,
    req.params.id,
    req.query
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});
