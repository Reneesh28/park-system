/**
 * PARKWISE - Authentication Constants & Cookie Policies
 * Phase 2.4: Refresh Token Management and Session Lifecycle
 */

import { env } from '../config/environment.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

/**
 * Parses duration strings like '7d', '24h', '15m' into milliseconds.
 * Defaults to 7 days if unrecognized.
 * @param {string} durationStr 
 * @returns {number} Milliseconds
 */
export function parseDurationToMs(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') {
    return 7 * 24 * 60 * 60 * 1000; // 7 days fallback
  }

  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const count = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return count * 1000;
    case 'm': return count * 60 * 1000;
    case 'h': return count * 60 * 60 * 1000;
    case 'd': return count * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export const REFRESH_TOKEN_EXPIRY_MS = parseDurationToMs(env.jwt.refreshExpiry || '7d');

/**
 * Returns security-hardened options for setting the refresh token HttpOnly cookie.
 * @param {number} [maxAgeMs=REFRESH_TOKEN_EXPIRY_MS] 
 * @returns {import('express').CookieOptions}
 */
export function getRefreshCookieOptions(maxAgeMs = REFRESH_TOKEN_EXPIRY_MS) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs
  };
}

/**
 * Returns options for clearing the refresh token cookie upon logout or reuse.
 * @returns {import('express').CookieOptions}
 */
export function getClearRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: REFRESH_COOKIE_PATH
  };
}
