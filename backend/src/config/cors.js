/**
 * PARKWISE - CORS Configuration
 * Phase 2.1: Backend Initialization and Architecture
 */

import { env } from './environment.js';

const allowedOrigins = [
  env.frontendUrl,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

/**
 * Dynamic CORS options delegate.
 * Dynamically adapts credentials and allowed origin headers:
 * - For direct file:/// browser executions (Origin: 'null'), permits origin with wildcard.
 * - For HTTP origins (localhost:3000, 5500, etc.), permits origin with credentials for HttpOnly cookies.
 */
export const corsOptions = (req, callback) => {
  const origin = req.headers.origin;

  // 1. Direct file:/// execution or tools without origin header (curl, mobile, test harness)
  if (!origin || origin === 'null') {
    return callback(null, {
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400
    });
  }

  // 2. HTTP origin verification (allowed list or any local development origin)
  const isAllowed =
    allowedOrigins.includes(origin) ||
    (env.isDevelopment && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));

  if (isAllowed) {
    return callback(null, {
      origin: true, // Echo request origin
      credentials: true, // Allow cookies
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400
    });
  }

  // 3. Gracefully disallow unsupported origins without raising 500 exceptions
  return callback(null, { origin: false });
};
