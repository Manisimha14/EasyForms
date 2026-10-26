// src/middleware/validate.js
// Reusable Zod validation middleware.
// Accepts an object with optional { body, params, query } schemas.
// Parsed values replace the originals on req so controllers get clean data.

import { ZodError } from 'zod';

/**
 * @param {{ body?: import('zod').ZodSchema, params?: import('zod').ZodSchema, query?: import('zod').ZodSchema }} schemas
 */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];

  if (schemas.params) {
    const result = schemas.params.safeParse(req.params);
    if (result.success) {
      req.params = result.data;
    } else {
      errors.push(...result.error.issues);
    }
  }

  if (schemas.query) {
    const result = schemas.query.safeParse(req.query);
    if (result.success) {
      req.query = result.data;
    } else {
      errors.push(...result.error.issues);
    }
  }

  if (schemas.body) {
    const result = schemas.body.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
    } else {
      errors.push(...result.error.issues);
    }
  }

  if (errors.length > 0) {
    const zodError = new ZodError(errors);
    return next(zodError);
  }

  next();
};
