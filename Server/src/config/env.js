// src/config/env.js
// Validates all environment variables at startup using Zod.
// If any required variable is missing or malformed, the process exits with a clear message.
//
// Uses a lazy-initialization pattern: the env object is created on first access,
// so test setup can set process.env values before any import triggers validation.

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).default(8080),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_COST: z.coerce.number().int().min(4).max(31).default(12),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.string().default('0'),

  APP_VERSION: z.string().default('local'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(10),

  RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_PUBLIC_READ_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_PUBLIC_SUBMIT_MAX: z.coerce.number().int().positive().default(20),

  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // Transactional Email Configuration
  EMAIL_PROVIDER: z.string().default('gmail'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().default(''),
  SMTP_APP_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default('Easy Forms <noreply@easyforms.local>'),
  EMAIL_MODE: z.enum(['mock', 'smtp']).default('mock'),

  // AI Configuration (Gemini with Groq Fallback)
  GEMINI_API_KEY: z.string().default(''),
  GROQ_API_KEY: z.string().default(''),
});

let _env = null;

/**
 * Parse and validate environment variables.
 * Caches the result so it only runs once.
 */
function getEnv() {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  _env = Object.freeze(result.data);
  return _env;
}

// Use a proxy so property access triggers lazy initialization
export const env = new Proxy({}, {
  get(_target, prop) {
    return getEnv()[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getEnv());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const e = getEnv();
    if (prop in e) {
      return { value: e[prop], writable: false, enumerable: true, configurable: true };
    }
    return undefined;
  },
});
