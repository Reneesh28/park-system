/**
 * PARKWISE - Authentication Middleware
 * Phase 2.3: User Registration and Login API Development
 */

import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Middleware that verifies the Bearer JWT access token from the Authorization header.
 * Attaches verified { userId, role } to req.user.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is missing. Access token required.',
      errors: [
        {
          field: 'authorization',
          reason: 'Bearer token must be provided in Authorization header'
        }
      ]
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1].trim()) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format must be "Bearer <token>".',
      errors: [
        {
          field: 'authorization',
          reason: 'Token format malformed'
        }
      ]
    });
  }

  const token = parts[1].trim();

  try {
    const decoded = verifyAccessToken(token);

    // Securely attach authenticated user payload
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please log in again.',
        errors: [
          {
            field: 'token',
            reason: 'Token expired at ' + error.expiredAt
          }
        ]
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token.',
        errors: [
          {
            field: 'token',
            reason: error.message
          }
        ]
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      errors: [
        {
          field: 'token',
          reason: error.message || 'Token verification failed'
        }
      ]
    });
  }
}
