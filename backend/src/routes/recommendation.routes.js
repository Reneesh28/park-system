/**
 * PARKWISE - Recommendation Express Routes
 * Phase 2.7: Deterministic Recommendation Engine
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as recommendationController from '../controllers/recommendation.controller.js';

const router = Router();

// Student / general recommendation endpoint
router.get('/', authenticate, recommendationController.getRecommendations);

export default router;
