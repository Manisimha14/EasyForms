// src/app.js
// Builds and configures the Express application.
// Exported as a function so Supertest can create an app without opening a port.
// server.js is the only file that connects to the database and calls app.listen().

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/request-id.js';
import { generalLimiter } from './middleware/rate-limiters.js';
import { notFound } from './middleware/not-found.js';
import { requireJson } from './middleware/require-json.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRoutes } from './routes/index.js';
import { docsRoutes } from './modules/docs/docs.routes.js';
import { LIMITS } from './constants/form.constants.js';

export function createApp() {
  const app = express();

  // --- 1. Trust proxy (for correct IP behind Render/Railway) ---
  const trustProxy = env.TRUST_PROXY;
  // Allow numeric strings (like "1") or boolean-ish values
  if (/^\d+$/.test(trustProxy)) {
    app.set('trust proxy', Number(trustProxy));
  } else if (trustProxy === 'true') {
    app.set('trust proxy', true);
  } else {
    app.set('trust proxy', trustProxy);
  }

  // Prevent NoSQL operator injection from query strings
  app.set('query parser', 'simple');

  // Remove the X-Powered-By header
  app.disable('x-powered-by');

  // --- 2. Request ID ---
  app.use(requestId);

  // --- 3. HTTP request logging ---
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        // Attach the request ID to each log line
        customProps: (req) => ({
          requestId: req.id,
          appVersion: env.APP_VERSION,
        }),
        // Log the route pattern, not the raw URL with params
        customSuccessMessage: (req, res) =>
          `${req.method} ${req.route?.path || req.originalUrl} ${res.statusCode}`,
        // Redact response bodies from logs
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      })
    );
  }

  // --- 4. Helmet (security headers with Scalar CDN support) ---
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          'style-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
          'img-src': ["'self'", 'data:', 'cdn.jsdelivr.net', 'https:'],
          'font-src': ["'self'", 'fonts.gstatic.com', 'data:', 'cdn.jsdelivr.net'],
          'connect-src': ["'self'", 'https:', 'data:'],
        },
      },
    })
  );

  // --- 5. CORS ---
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server, health checks)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Always allow local development origins (localhost & 127.0.0.1 on any port)
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        // Allow Vercel preview & production deployments if vercel.app is permitted
        const isVercelAllowed = allowedOrigins.some(
          (o) => o.includes('vercel.app') && origin.endsWith('.vercel.app')
        );
        if (isVercelAllowed) {
          return callback(null, true);
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'If-Match', 'X-Request-Id'],
      exposedHeaders: ['ETag', 'X-Request-Id', 'RateLimit', 'Retry-After'],
      maxAge: 600,
      credentials: true,
    })
  );

  // --- 6. Mount Scalar API Reference and OpenAPI spec (/api-docs) ---
  app.use('/api-docs', docsRoutes);

  // --- 7. Enforce JSON Content-Type on body-carrying requests (/api/v1) ---
  app.use('/api/v1', requireJson);

  // --- 8. JSON body parser (private endpoints = 1 MB default) ---
  app.use(express.json({ limit: LIMITS.PRIVATE_BODY_LIMIT }));

  // --- 9. General rate limiter for private routes ---
  app.use('/api/v1', generalLimiter);

  // --- 9. Mount all routes under /api/v1 ---
  app.use('/api/v1', apiRoutes);

  // --- 10. Not-found handler (unknown routes) ---
  app.use(notFound);

  // --- 11. Central error handler ---
  app.use(errorHandler);

  return app;
}
