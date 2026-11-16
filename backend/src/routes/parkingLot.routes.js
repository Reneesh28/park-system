/**
 * PARKWISE - Parking Lot Express Routes
 * Phase 2.5: Parking-Lot Management APIs
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as parkingLotController from '../controllers/parkingLot.controller.js';

export const parkingLotRouter = Router();
export const adminParkingLotRouter = Router();

// Student / General Parking Lot Endpoints
parkingLotRouter.get('/', authenticate, parkingLotController.getParkingLots);
parkingLotRouter.get('/:lotId', authenticate, parkingLotController.getParkingLotById);

// Admin Parking Lot Management Endpoints
adminParkingLotRouter.use(authenticate, authorize('admin'));
adminParkingLotRouter.get('/', parkingLotController.adminGetParkingLots);
adminParkingLotRouter.post('/', parkingLotController.adminCreateParkingLot);
adminParkingLotRouter.patch('/:lotId', parkingLotController.adminUpdateParkingLot);
adminParkingLotRouter.patch('/:lotId/status', parkingLotController.adminUpdateParkingLotStatus);

export default parkingLotRouter;
