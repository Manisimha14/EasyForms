// src/middleware/require-json.js
// Enforces Content-Type: application/json on body-carrying requests (POST, PUT, PATCH).
// Returns 415 UNSUPPORTED_MEDIA_TYPE if the header is missing or wrong.

/**
 * Middleware that rejects body-carrying requests without a JSON Content-Type.
 * Only checks POST, PUT, and PATCH — other methods are passed through.
 */
export function requireJson(req, res, next) {
  const bodyMethods = ['POST', 'PUT', 'PATCH'];

  if (!bodyMethods.includes(req.method)) {
    return next();
  }

  // Content-Length: 0 or truly empty body — no need to check type
  if (req.headers['content-length'] === '0') {
    return next();
  }

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(415).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json.',
        ...(req.id && { requestId: req.id }),
      },
    });
  }

  next();
}
