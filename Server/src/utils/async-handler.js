// src/utils/async-handler.js
// Wraps async controller functions so rejected promises reach the error middleware.
// Eliminates repetitive try/catch blocks in every controller.

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
