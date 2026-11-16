/**
 * PARKWISE - Centralized Error Handler Middleware
 * Phase 2.3: User Registration and Login API Development
 */

import { env } from '../config/environment.js';

/**
 * Global Express error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'resource';
    message = `An account with this ${field} already exists.`;
    errors = [{ field, reason: 'Duplicate entry detected' }];
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
    errors = [{ field: err.path, reason: 'Invalid data type or ID format' }];
  }

  const responseBody = {
    success: false,
    message,
    errors
  };

  // Include stack trace only in development environment
  if (env.isDevelopment && statusCode >= 500) {
    responseBody.stack = err.stack;
  }

  // Log 5xx errors to standard error
  if (statusCode >= 500) {
    console.error(`[Error 500] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(responseBody);
}
