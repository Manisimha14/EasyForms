// src/server.js
// Entry point. Connects to the database, starts the HTTP server,
// and registers graceful shutdown handlers.
// This is the only file that has side effects on import.

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, closeDatabaseConnection } from './config/database.js';
import { createApp } from './app.js';

const app = createApp();
let server;

async function start() {
  // Connect to the database first, then listen
  await connectDatabase();

  server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, version: env.APP_VERSION },
      `🚀 Easy Forms API listening on port ${env.PORT}`
    );
  });

  // Set server-level request timeout
  server.requestTimeout = env.REQUEST_TIMEOUT_MS;
}

/**
 * Graceful shutdown: stop accepting connections, close the server,
 * close the database connection, then exit.
 */
async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received — draining connections');

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  await closeDatabaseConnection();
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
