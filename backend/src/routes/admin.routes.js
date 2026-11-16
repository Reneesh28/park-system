/**
 * PARKWISE - Admin Express Routes
 * Phase 2.9: Admin APIs and Analytics
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as adminController from '../controllers/admin.controller.js';
import { adminParkingLotRouter } from './parkingLot.routes.js';
import { adminRewardRouter } from './reward.routes.js';

const router = Router();

// Guard all admin routes with authentication and admin role enforcement
router.use(authenticate, authorize('admin'));

// Sub-resource routers
router.use('/parking-lots', adminParkingLotRouter);
router.use('/rewards', adminRewardRouter);

// Admin Analytics & Oversight Endpoints
router.get('/dashboard', adminController.getDashboard);
router.get('/parking-activity', adminController.getParkingActivity);
router.get('/parking-sessions', adminController.getParkingSessions);
router.get('/analytics/utilisation', adminController.getUtilisationAnalytics);
router.get('/analytics/rewards', adminController.getRewardsAnalytics);

export default router;
