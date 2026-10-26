// src/routes/index.js
// Central route registry. All API routes are mounted under /api/v1.
// Import and mount module routers here as milestones progress.

import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { formRoutes } from '../modules/forms/form.routes.js';
import { publicRoutes } from '../modules/public/public.routes.js';
import { dashboardRoutes } from '../modules/analytics/dashboard.routes.js';
import { aiRoutes } from '../modules/ai/ai.routes.js';

const router = Router();

// Health (no authentication required)
router.use('/health', healthRoutes);

// Authentication (register, login, refresh, logout, profile)
router.use('/auth', authRoutes);

// Forms (private management endpoints)
router.use('/forms', formRoutes);

// Public (respondent-facing form views and submissions)
router.use('/public', publicRoutes);

// Dashboard (owner stats)
router.use('/dashboard', dashboardRoutes);

// AI (natural language generation & response analysis)
router.use('/ai', aiRoutes);

export { router as apiRoutes };

