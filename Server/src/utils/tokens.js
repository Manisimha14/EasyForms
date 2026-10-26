// src/utils/tokens.js
// Token generation, verification and hashing utilities.
// Access tokens are short-lived JWTs (HS256 only).
// Refresh tokens are high-entropy random strings, stored only as SHA-256 hashes.

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a short-lived signed JWT access token.
 * Contains standard claims: sub (user ID), iat, exp.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} Signed JWT
 */
export function generateAccessToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_ACCESS_TTL,
    }
  );
}

/**
 * Verify a JWT access token.
 * Restricts algorithm strictly to HS256 to avoid alg:none / confusion attacks.
 * @param {string} token
 * @returns {jwt.JwtPayload} Decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  });
}

/**
 * Generate a cryptographically secure refresh token (48 random bytes, base64url).
 * @returns {string}
 */
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * Compute the SHA-256 hash of a token string for safe database storage.
 * @param {string} token
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
