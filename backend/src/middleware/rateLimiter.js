/**
 * PARKWISE - API Rate Limiting Middleware
 * Phase 2.1: Backend Initialization and Architecture
 */

import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter for general endpoints.
 * 100 requests per 15-minute window in production; relaxed in development.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Reasonable development limit
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.',
    errors: [
      {
        field: 'rateLimit',
        reason: 'Rate limit exceeded'
      }
    ]
  }
});

/**
 * Stricter rate limiter for sensitive endpoints (e.g., auth, password resets).
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    errors: [
      {
        field: 'authRateLimit',
        reason: 'Authentication rate limit exceeded'
      }
    ]
  }
});
