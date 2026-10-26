// src/modules/analytics/dashboard.routes.js
// Express router for high-level owner dashboard statistics.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', analyticsController.getDashboardStats);

export { router as dashboardRoutes };
