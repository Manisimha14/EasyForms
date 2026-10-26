// src/modules/health/health.routes.js
// Health and readiness endpoints.
// GET /api/v1/health — always 200 while the process is up.
// GET /api/v1/health/ready — 200 only when MongoDB is connected and responds to a ping.

import { Router } from 'express';
import { isDatabaseReady } from '../../config/database.js';
import { env } from '../../config/env.js';

const router = Router();

const startTime = Date.now();

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      version: env.APP_VERSION,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      email: {
        mode: env.EMAIL_MODE,
        provider: env.EMAIL_PROVIDER,
        configured: Boolean(env.SMTP_USER && env.SMTP_APP_PASSWORD),
      },
    },
  });
});

router.get('/ready', async (_req, res) => {
  const ready = await isDatabaseReady();

  if (ready) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        version: env.APP_VERSION,
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      },
    });
  }

  return res.status(503).json({
    success: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database is not ready.',
    },
  });
});

export { router as healthRoutes };
