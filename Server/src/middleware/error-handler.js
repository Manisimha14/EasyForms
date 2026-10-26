// src/middleware/error-handler.js
// Central error middleware that converts all errors into the standard error envelope.
// Handles: AppError subclasses, Zod errors, Mongoose validation/cast/duplicate-key errors,
// JWT errors, body-parser size errors, and unexpected errors.

import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Format a Zod error into the standard details array.
 */
function formatZodError(zodError) {
  return zodError.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Central error handler — must be registered with all 4 parameters.
 */
export function errorHandler(err, req, res, _next) {
  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid data.',
        details: formatZodError(err),
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- Our own AppError subclasses ---
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(req.id && { requestId: req.id }),
      },
    };
    if (err.details) {
      response.error.details = err.details;
    }
    if (err.statusCode === 405 && err.allowedMethods) {
      res.setHeader('Allow', err.allowedMethods);
    }
    return res.status(err.statusCode).json(response);
  }

  // --- Mongoose CastError (invalid ObjectId, etc.) ---
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid value for ${err.path}: ${err.value}`,
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- Mongoose ValidationError ---
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation failed.',
        details,
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- Mongoose duplicate key error ---
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `A resource with that ${field} already exists.`,
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- JWT errors ---
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token.',
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token has expired.',
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- Body-parser size errors ---
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'The request body is too large.',
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- SyntaxError from body-parser (malformed JSON) ---
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON in the request body.',
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  // --- Everything else is an unexpected 500 ---
  logger.error(
    { err, requestId: req.id },
    'Unhandled error'
  );

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message;

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(req.id && { requestId: req.id }),
    },
  });
}
