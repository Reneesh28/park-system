/**
 * PARKWISE - Parking Lot HTTP Controller
 * Phase 2.5: Parking-Lot Management APIs
 */

import * as parkingLotService from '../services/parkingLot.service.js';
import {
  createParkingLotSchema,
  updateParkingLotSchema,
  updateStatusSchema
} from '../validators/parkingLot.validator.js';

/**
 * Get all active parking lots (Student / General).
 * @route GET /api/v1/parking-lots
 */
export async function getParkingLots(req, res, next) {
  try {
    const lots = await parkingLotService.getAllLots(true);
    res.status(200).json({
      success: true,
      message: 'Active parking lots retrieved successfully',
      data: { lots }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single parking lot details by ID or lotCode.
 * @route GET /api/v1/parking-lots/:lotId
 */
export async function getParkingLotById(req, res, next) {
  try {
    const lot = await parkingLotService.getLotById(req.params.lotId);
    res.status(200).json({
      success: true,
      message: 'Parking lot retrieved successfully',
      data: { lot }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all parking lots including inactive (Admin).
 * @route GET /api/v1/admin/parking-lots
 */
export async function adminGetParkingLots(req, res, next) {
  try {
    const lots = await parkingLotService.getAllLots(false);
    res.status(200).json({
      success: true,
      message: 'All parking lots retrieved successfully',
      data: { lots }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new parking lot (Admin).
 * @route POST /api/v1/admin/parking-lots
 */
export async function adminCreateParkingLot(req, res, next) {
  try {
    const { error, value } = createParkingLotSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({ field: d.path.join('.'), reason: d.message }))
      });
    }

    const lot = await parkingLotService.createLot(value);
    res.status(201).json({
      success: true,
      message: 'Parking lot created successfully',
      data: { lot }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing parking lot (Admin).
 * @route PATCH /api/v1/admin/parking-lots/:lotId
 */
export async function adminUpdateParkingLot(req, res, next) {
  try {
    const { error, value } = updateParkingLotSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({ field: d.path.join('.'), reason: d.message }))
      });
    }

    const lot = await parkingLotService.updateLot(req.params.lotId, value);
    res.status(200).json({
      success: true,
      message: 'Parking lot updated successfully',
      data: { lot }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update status of a parking lot (Admin).
 * @route PATCH /api/v1/admin/parking-lots/:lotId/status
 */
export async function adminUpdateParkingLotStatus(req, res, next) {
  try {
    const { error, value } = updateStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({ field: d.path.join('.'), reason: d.message }))
      });
    }

    const lot = await parkingLotService.updateLotStatus(req.params.lotId, value.isActive);
    res.status(200).json({
      success: true,
      message: `Parking lot status set to ${value.isActive ? 'active' : 'inactive'}`,
      data: { lot }
    });
  } catch (error) {
    next(error);
  }
}
