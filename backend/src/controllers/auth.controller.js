/**
 * PARKWISE - Authentication HTTP Controller
 * Phase 2.4: Refresh Token Management and Session Lifecycle
 */

import * as authService from '../services/auth.service.js';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  getClearRefreshCookieOptions
} from '../constants/auth.js';

/**
 * Handle new user registration.
 * @route POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user authentication, access token issuance, and secure refresh-token cookie.
 * @route POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    const { user, accessToken, rawRefreshToken, refreshExpiryMs } = await authService.loginUser(req.body);

    // Set secure HttpOnly cookie containing the raw refresh token
    res.cookie(
      REFRESH_COOKIE_NAME,
      rawRefreshToken,
      getRefreshCookieOptions(refreshExpiryMs)
    );

    // Never return the refresh token in the JSON response
    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        user,
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rotate refresh token and issue a fresh access token & refresh token.
 * @route POST /api/v1/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    const { user, accessToken, rawRefreshToken: newRawRefreshToken, refreshExpiryMs } =
      await authService.rotateRefreshToken(rawRefreshToken);

    // Set updated HttpOnly cookie with newly rotated refresh token
    res.cookie(
      REFRESH_COOKIE_NAME,
      newRawRefreshToken,
      getRefreshCookieOptions(refreshExpiryMs)
    );

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully.',
      data: {
        user,
        accessToken
      }
    });
  } catch (error) {
    // If the error indicates compromised, expired, or invalid token, clear the cookie
    if (error.shouldClearCookie || error.statusCode === 401) {
      res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());
    }
    next(error);
  }
}

/**
 * Retrieve authenticated user profile.
 * @route GET /api/v1/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke active refresh token session and clear HttpOnly cookie.
 * @route POST /api/v1/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await authService.logoutUser(rawRefreshToken);

    // Clear refresh token cookie using identical security options
    res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session terminated.',
      data: null
    });
  } catch (error) {
    // Ensure cookie is cleared even on unexpected failure
    res.clearCookie(REFRESH_COOKIE_NAME, getClearRefreshCookieOptions());
    next(error);
  }
}
