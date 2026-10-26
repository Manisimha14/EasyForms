// src/config/database.js
// Connects to MongoDB using Mongoose.
// Exports connectDatabase() which must be called before the app starts listening.

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.fatal({ err }, '❌ MongoDB connection failed');
    process.exit(1);
  }
}

export async function closeDatabaseConnection() {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing MongoDB connection');
  }
}

/**
 * Returns true when Mongoose is connected and a ping succeeds.
 */
export async function isDatabaseReady() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}
