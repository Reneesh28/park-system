/**
 * PARKWISE - Health Check Routes
 * Phase 2.1: Backend Initialization and Architecture
 */

import { Router } from 'express';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    System health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ParkWise API is running',
    data: {
      status: 'healthy'
    }
  });
});

export default router;
