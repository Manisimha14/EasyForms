// src/utils/password.js
// Password hashing and comparison utilities using bcryptjs.
// Passwords are never stored or logged in plain text.

import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

// Pre-computed dummy bcrypt hash (cost 12) for constant-time comparison on unknown emails
// Generated with bcrypt.hashSync('dummy_password_timing_defense', 12)
const DUMMY_HASH = '$2a$12$e80yqR9N9yQh32zVevkQ8O5Fj2z7J4ZkmXzO48fV.37hV/C7U.z3q';

/**
 * Hash a plain text password with bcrypt.
 * Cost factor is configured via BCRYPT_COST in environment.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, env.BCRYPT_COST);
}

/**
 * Compare a plain text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Perform a dummy password comparison against a fixed hash.
 * Used when an email does not exist to mitigate user enumeration timing attacks.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function dummyComparePassword(password) {
  return bcrypt.compare(password, DUMMY_HASH);
}
