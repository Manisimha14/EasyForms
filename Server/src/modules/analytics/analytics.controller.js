// src/modules/analytics/analytics.controller.js
// Handles HTTP request/response parsing for dashboard statistics, form analytics, and trends.

import { asyncHandler } from '../../utils/async-handler.js';
import * as analyticsService from './analytics.service.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDashboardStats(req.userId);
  res.status(200).json({
    success: true,
    data,
  });
});

export const getFormAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getFormAnalytics(
    req.userId,
    req.params.id,
    req.query
  );
  res.status(200).json({
    success: true,
    data,
  });
});

export const getFormTrends = asyncHandler(async (req, res) => {
  const data = await analyticsService.getFormTrends(
    req.userId,
    req.params.id,
    req.query.range
  );
  res.status(200).json({
    success: true,
    data,
  });
});
