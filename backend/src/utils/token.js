/**
 * PARKWISE - Opaque Refresh Token Utilities
 * Phase 2.4: Refresh Token Management and Session Lifecycle
 */

import crypto from 'crypto';

const REFRESH_TOKEN_BYTE_LENGTH = 32;

/**
 * Computes a SHA-256 hash of a raw token string for secure storage and indexing.
 * @param {string} rawToken 
 * @returns {string} Hex-encoded SHA-256 digest
 */
export function hashToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Token string is required for hashing');
  }
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a cryptographically secure random refresh token and its SHA-256 hash.
 * Sourced directly from Node.js crypto.randomBytes (32 bytes = 256 bits of entropy).
 * @returns {{ rawToken: string, tokenHash: string }}
 */
export function generateRefreshToken() {
  const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTE_LENGTH).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Generates a unique token family UUID for tracking rotated session lineages.
 * @returns {string} UUID v4
 */
export function generateFamilyId() {
  return crypto.randomUUID();
}
