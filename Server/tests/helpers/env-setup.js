// tests/helpers/env-setup.js
// Runs in every Jest test worker before test files load (via setupFiles in jest.config.js).
// Populates all required test environment variables.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = join(__dirname, '.test-env.json');

if (existsSync(envFile)) {
  try {
    const testEnv = JSON.parse(readFileSync(envFile, 'utf-8'));
    process.env.MONGODB_URI = testEnv.MONGODB_URI;
  } catch {
    // If temp file cannot be parsed, fallback
  }
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/easyforms_test';
}

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
