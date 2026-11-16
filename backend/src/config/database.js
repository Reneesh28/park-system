/**
 * PARKWISE - MongoDB Connection Management
 * Phase 2.1: Backend Initialization and Architecture
 */

import mongoose from 'mongoose';
import { env } from './environment.js';

let isConnected = false;

/**
 * Connect to MongoDB instance with retry and error reporting.
 */
export async function connectDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.isDevelopment
    });

    isConnected = true;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] Disconnected from MongoDB');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error(`[Database] Connection failed: ${error.message}`);
    throw error;
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[Database] MongoDB connection closed gracefully');
  } catch (error) {
    console.error('[Database] Error closing MongoDB connection:', error.message);
  }
}
