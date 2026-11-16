/**
 * PARKWISE - HTTP Server Entry Point & Lifecycle Management
 * Phase 2.1: Backend Initialization and Architecture
 */

import http from 'http';
import app from './app.js';
import { env } from './src/config/environment.js';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';

let server;

/**
 * Initializes database connection and starts HTTP listener.
 */
async function startServer() {
  try {
    // Attempt database connection
    try {
      await connectDatabase();
    } catch (dbErr) {
      console.warn(`[Server] Database connection error: ${dbErr.message}. Starting HTTP server in degraded mode.`);
    }

    server = http.createServer(app);

    server.listen(env.port, () => {
      console.log(`[Server] ParkWise API running in ${env.nodeEnv} mode on port ${env.port}`);
      console.log(`[Server] Health check: http://localhost:${env.port}/api/v1/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${env.port} is already in use.`);
      } else {
        console.error('[Server Error] Unexpected server error:', err);
      }
      process.exit(1);
    });

  } catch (startupError) {
    console.error('[Server Startup Error]', startupError);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the server and database connections.
 */
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      console.log('[Server] Process terminating cleanly.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

// Process signal listeners
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Start the server
startServer();
