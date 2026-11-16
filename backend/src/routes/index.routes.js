/**
 * PARKWISE - Central Routing Index
 * Complete Routing Engine: Phases 2.1 - 2.10
 */

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import parkingLotRoutes from './parkingLot.routes.js';
import parkingSessionRoutes from './parkingSession.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import rewardRoutes from './reward.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Health Check
router.use('/health', healthRoutes);

// Authentication & Session Lifecycle (Phases 2.3 & 2.4)
router.use('/auth', authRoutes);

// Parking Lot Operations (Phase 2.5)
router.use('/parking-lots', parkingLotRoutes);

// QR Parking Sessions (Phase 2.6)
router.use('/parking-sessions', parkingSessionRoutes);

// Recommendation Engine (Phase 2.7)
router.use('/recommendations', recommendationRoutes);

// Rewards & Incentives (Phase 2.8)
router.use('/rewards', rewardRoutes);

// Admin Portal & Analytics (Phase 2.9)
router.use('/admin', adminRoutes);

export default router;
