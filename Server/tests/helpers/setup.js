// tests/helpers/setup.js
// Per-test-file setup: reads the MongoDB URI from the temp file written by
// global-setup.js, sets all required env vars, connects to the in-memory MongoDB,
// and provides the app instance for Supertest.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Set env vars BEFORE importing any app code ---
const envFile = join(__dirname, '.test-env.json');
const testEnv = JSON.parse(readFileSync(envFile, 'utf-8'));

process.env.MONGODB_URI = testEnv.MONGODB_URI;
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-secret-at-least-32-characters-long-for-testing';
process.env.JWT_ACCESS_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.BCRYPT_COST = '4';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent';
process.env.TRUST_PROXY = '0';
process.env.APP_VERSION = 'test';
process.env.PORT = '0';
process.env.RATE_LIMIT_GENERAL_MAX = '1000';
process.env.RATE_LIMIT_PUBLIC_READ_MAX = '1000';
process.env.RATE_LIMIT_PUBLIC_SUBMIT_MAX = '1000';

// --- Now import app code ---
const { default: mongoose } = await import('mongoose');
const { createApp } = await import('../../src/app.js');

let app;

/**
 * Connect to the in-memory MongoDB before running tests in this file.
 */
export async function setupTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  app = createApp();
  return app;
}

/**
 * Drop all collections between tests so each test starts clean.
 */
export async function cleanTestDB() {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

/**
 * Disconnect from MongoDB after all tests in this file.
 */
export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

/**
 * Get the current Express app instance for Supertest.
 */
export function getApp() {
  return app;
}

/**
 * Register a user via auth service and return tokens and user details.
 * Uses real authentication logic with BCRYPT_COST=4.
 * @param {object} [userData]
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string, email: string, password: string }>}
 */
export async function createTestUser(userData = {}) {
  const { register } = await import('../../src/modules/auth/auth.service.js');
  const email = userData.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const password = userData.password || 'StrongPassword123';
  const name = userData.name || 'Test User';

  const result = await register({ email, password, name });
  return {
    ...result,
    email,
    password,
  };
}

