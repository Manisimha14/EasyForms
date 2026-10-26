// src/config/logger.js
// Configures pino logger with structured JSON output.
// Redacts sensitive fields from logs.

import pino from 'pino';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,

  // Redact sensitive data so it never appears in logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.refreshToken',
      'req.body.answers',
    ],
    censor: '[REDACTED]',
  },

  // Pretty-print in development; JSON in production
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        },
      }),
});
