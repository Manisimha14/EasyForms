// src/middleware/request-id.js
// Attaches a unique request ID to every request.
// Reuses a valid incoming X-Request-Id header or generates a new one.
// The ID appears in all logs and in 500 responses.

import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  // Accept the incoming ID if it looks like a UUID or a short safe string
  const id = incoming && /^[\w-]{1,128}$/.test(incoming) ? incoming : randomUUID();

  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
