/**
 * PARKWISE - Authentication Express Routes
 * Phase 2.3: User Registration and Login API Development
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest, registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new student account
 * @access  Public
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate credentials and issue JWT access token & refresh token cookie
 * @access  Public (Rate-limited)
 */
router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rotate refresh token and issue new access token & refresh token
 * @access  Public (Rate-limited, HttpOnly Cookie)
 */
router.post('/refresh', authRateLimiter, authController.refresh);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieve profile of the currently authenticated user
 * @access  Private (Bearer JWT)
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Client-side session termination contract
 * @access  Public
 */
router.post('/logout', authController.logout);

export default router;
