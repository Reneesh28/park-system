/**
 * PARKWISE - JWT Utility Functions
 * Phase 2.3: User Registration and Login API Development
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

const JWT_ISSUER = 'parkwise-api';
const JWT_AUDIENCE = 'parkwise-client';

/**
 * Generate a short-lived JWT access token for an authenticated user.
 * Payload contains only essential identification data: userId and role.
 * Sensitive data (passwords, internal hashes) are never included.
 * 
 * @param {Object} user - User document or payload object
 * @param {string} user.id or user._id - User's unique identifier
 * @param {string} user.role - User's role ('student' | 'admin')
 * @returns {string} Signed JWT access token
 */
export function generateAccessToken(user) {
  const userId = user._id ? user._id.toString() : user.id || user.userId;

  if (!userId) {
    throw new Error('User ID is required to generate access token');
  }

  const payload = {
    userId,
    role: user.role || 'student'
  };

  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry || '15m',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}

/**
 * Verify and decode an incoming JWT access token.
 * 
 * @param {string} token - Bearer JWT token string
 * @returns {Object} Decoded payload { userId, role, iat, exp, ... }
 * @throws {Error} If token is expired, invalid, or malformed
 */
export function verifyAccessToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Access token is required for verification');
  }

  return jwt.verify(token, env.jwt.accessSecret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}
