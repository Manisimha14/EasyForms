// src/middleware/not-found.js
// Catches requests to undefined routes and returns a 404 in the standard error envelope.

export function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      ...(req.id && { requestId: req.id }),
    },
  });
}
