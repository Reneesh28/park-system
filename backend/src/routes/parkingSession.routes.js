/**
 * PARKWISE - Parking Session Express Routes
 * Phase 2.6: QR Parking Sessions
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as parkingSessionController from '../controllers/parkingSession.controller.js';

const router = Router();

// All session routes require student or admin authentication
router.use(authenticate);

router.post('/scan', parkingSessionController.scanQr);
router.get('/active', parkingSessionController.getActiveSession);
router.get('/history', parkingSessionController.getSessionHistory);
router.get('/:sessionId', parkingSessionController.getSessionById);

export default router;
