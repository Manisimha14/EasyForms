// jest.config.js
// Jest configuration for ES Modules.
// Uses mongodb-memory-server via the global setup/teardown helpers.

export default {
  testEnvironment: 'node',
  transform: {},
  // Run test suites serially to prevent database collision in shared in-memory MongoDB
  maxWorkers: 1,
  // Increase timeout for database operations in CI
  testTimeout: 30000,
  // Test file patterns
  testMatch: ['**/tests/**/*.test.js'],
  // Global setup and teardown for in-memory MongoDB
  globalSetup: './tests/helpers/global-setup.js',
  globalTeardown: './tests/helpers/global-teardown.js',
  // Per-worker setup for environment variables
  setupFiles: ['./tests/helpers/env-setup.js'],
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/logger.js',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
