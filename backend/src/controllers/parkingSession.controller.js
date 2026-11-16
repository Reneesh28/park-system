/**
 * PARKWISE - Parking Session HTTP Controller
 * Phase 2.6: QR Parking Sessions
 */

import * as parkingSessionService from '../services/parkingSession.service.js';
import { scanQrSchema } from '../validators/parkingSession.validator.js';

/**
 * Handle QR Code Scanning (Check-In or Check-Out).
 * @route POST /api/v1/parking-sessions/scan
 */
export async function scanQr(req, res, next) {
  try {
    const { error, value } = scanQrSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({ field: d.path.join('.'), reason: d.message }))
      });
    }

    const result = await parkingSessionService.processQrScan(
      req.user.userId,
      value.qrToken,
      value.vehicleNumber
    );

    const statusCode = result.action === 'checkin' ? 201 : 200;

    res.status(statusCode).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current active session for the authenticated student.
 * @route GET /api/v1/parking-sessions/active
 */
export async function getActiveSession(req, res, next) {
  try {
    const session = await parkingSessionService.getActiveSession(req.user.userId);
    res.status(200).json({
      success: true,
      message: session ? 'Active parking session found' : 'No active parking session found',
      data: { session }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get completed parking session history for the authenticated student.
 * @route GET /api/v1/parking-sessions/history
 */
export async function getSessionHistory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const history = await parkingSessionService.getSessionHistory(req.user.userId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Parking history retrieved successfully',
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get details of a specific parking session by ID.
 * @route GET /api/v1/parking-sessions/:sessionId
 */
export async function getSessionById(req, res, next) {
  try {
    const session = await parkingSessionService.getSessionById(
      req.params.sessionId,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Parking session details retrieved successfully',
      data: { session }
    });
  } catch (error) {
    next(error);
  }
}
