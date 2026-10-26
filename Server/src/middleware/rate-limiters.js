// src/middleware/rate-limiters.js
// Configures express-rate-limit instances for different endpoint groups.
// Defaults are overridable via environment variables.

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Shared handler that returns the standard error envelope on 429.
 */
const standardHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  });
};

/**
 * Normalize an IP address for use as a rate limit key.
 * Strips the IPv6 prefix from IPv4-mapped addresses (e.g., ::ffff:127.0.0.1 → 127.0.0.1).
 */
function normalizeIp(ip) {
  if (!ip) return 'unknown';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

// Disable the keyGeneratorIpFallback validation on all custom keyGenerators
// because we handle IPv6 normalization ourselves.
const noIpValidation = { xForwardedForHeader: false, ip: false, keyGeneratorIpFallback: false };

/** General private API — 300 requests per 15 minutes per user (or IP) */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_GENERAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || normalizeIp(req.ip),
  handler: standardHandler,
  validate: noIpValidation,
});

/** Public form retrieval — 120 per 15 minutes per IP */
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_PUBLIC_READ_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
});

/** Public submissions — 20 per 15 minutes per IP per form slug */
export const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_PUBLIC_SUBMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${normalizeIp(req.ip)}:${req.params.slug}`,
  handler: standardHandler,
  validate: noIpValidation,
});

/** Login — 10 per 15 minutes per IP+email pair */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${normalizeIp(req.ip)}:${(req.body?.email || '').toLowerCase()}`,
  handler: standardHandler,
  validate: noIpValidation,
});

/** Registration — 5 per hour per IP */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
});

/** Token refresh — 30 per 15 minutes per IP */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardHandler,
});
