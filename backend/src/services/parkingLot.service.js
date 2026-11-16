/**
 * PARKWISE - Parking Lot Management Service
 * Phase 2.5: Parking-Lot Management APIs
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import ParkingLot from '../models/ParkingLot.js';

/**
 * Generates standard SHA-256 hash for QR token verification.
 * @param {string} token 
 * @returns {string}
 */
export function hashQrToken(token) {
  return crypto.createHash('sha256').update(String(token).trim().toUpperCase()).digest('hex');
}

/**
 * Computes availability status classification.
 * @param {number} available 
 * @param {number} total 
 * @returns {'available'|'limited'|'full'}
 */
export function getAvailabilityStatus(available, total) {
  if (total <= 0 || available <= 0) return 'full';
  const ratio = available / total;
  if (ratio >= 0.6) return 'available';
  if (ratio >= 0.3) return 'limited';
  return 'full';
}

/**
 * Decorates a parking lot document or object with standard client properties.
 * @param {object} lotDoc 
 * @returns {object}
 */
export function formatParkingLot(lotDoc) {
  const lot = lotDoc.toObject ? lotDoc.toObject({ virtuals: true }) : { ...lotDoc };
  const total = Number(lot.totalCapacity) || 0;
  const occupied = Number(lot.occupiedSpaces) || 0;
  const available = Math.max(0, total - occupied);
  const occupancyPercentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const availabilityPercentage = total > 0 ? Math.round((available / total) * 100) : 0;

  // Convert Mongoose Map to plain object if needed
  let walkingDistances = lot.walkingDistances;
  if (walkingDistances instanceof Map) {
    walkingDistances = Object.fromEntries(walkingDistances);
  } else if (!walkingDistances) {
    walkingDistances = {};
  }

  return {
    _id: lot._id,
    id: lot._id.toString(),
    lotName: lot.lotName,
    lotCode: lot.lotCode,
    totalCapacity: total,
    occupiedSpaces: occupied,
    availableSpaces: available,
    occupancyPercentage,
    availabilityPercentage,
    status: getAvailabilityStatus(available, total),
    location: lot.location || '',
    walkingDistances,
    isActive: lot.isActive !== false,
    createdAt: lot.createdAt,
    updatedAt: lot.updatedAt
  };
}

/**
 * Fetch all parking lots (filtered by active status for students).
 * @param {boolean} onlyActive 
 * @returns {Promise<Array>}
 */
export async function getAllLots(onlyActive = true) {
  const query = onlyActive ? { isActive: true } : {};
  const lots = await ParkingLot.find(query).sort({ lotCode: 1 });
  return lots.map(formatParkingLot);
}

/**
 * Fetch a single parking lot by ID or lotCode.
 * @param {string} lotIdOrCode 
 * @returns {Promise<object>}
 */
export async function getLotById(lotIdOrCode) {
  if (!lotIdOrCode) {
    const error = new Error('Parking lot identifier is required');
    error.status = 400;
    throw error;
  }

  let lot = null;
  if (mongoose.Types.ObjectId.isValid(lotIdOrCode)) {
    lot = await ParkingLot.findById(lotIdOrCode);
  }

  if (!lot) {
    // Attempt lookup by lotCode (case-insensitive)
    lot = await ParkingLot.findOne({
      lotCode: lotIdOrCode.trim().toUpperCase()
    });
  }

  if (!lot) {
    const error = new Error(`Parking lot "${lotIdOrCode}" not found`);
    error.status = 404;
    throw error;
  }

  return formatParkingLot(lot);
}

/**
 * Create a new parking lot (Admin).
 * @param {object} lotData 
 * @returns {Promise<object>}
 */
export async function createLot(lotData) {
  const lotCode = lotData.lotCode.trim().toUpperCase();

  // Check unique lotCode
  const existing = await ParkingLot.findOne({ lotCode });
  if (existing) {
    const error = new Error(`A parking lot with code "${lotCode}" already exists`);
    error.status = 409;
    throw error;
  }

  // Derive QR token hash
  const rawQrToken = lotData.qrToken ? lotData.qrToken.trim() : `PARKWISE-LOT-${lotCode}`;
  const qrTokenHash = hashQrToken(rawQrToken);

  const newLot = new ParkingLot({
    lotName: lotData.lotName.trim(),
    lotCode,
    totalCapacity: Number(lotData.totalCapacity),
    occupiedSpaces: 0,
    location: lotData.location ? lotData.location.trim() : '',
    walkingDistances: lotData.walkingDistances || {},
    qrTokenHash,
    isActive: true
  });

  await newLot.save();
  return formatParkingLot(newLot);
}

/**
 * Update an existing parking lot details (Admin).
 * @param {string} lotIdOrCode 
 * @param {object} updateData 
 * @returns {Promise<object>}
 */
export async function updateLot(lotIdOrCode, updateData) {
  let lot = null;
  if (mongoose.Types.ObjectId.isValid(lotIdOrCode)) {
    lot = await ParkingLot.findById(lotIdOrCode);
  }
  if (!lot) {
    lot = await ParkingLot.findOne({ lotCode: lotIdOrCode.trim().toUpperCase() });
  }

  if (!lot) {
    const error = new Error(`Parking lot "${lotIdOrCode}" not found`);
    error.status = 404;
    throw error;
  }

  if (typeof updateData.totalCapacity === 'number') {
    if (updateData.totalCapacity < lot.occupiedSpaces) {
      const error = new Error(
        `Cannot reduce total capacity to ${updateData.totalCapacity} spaces because ${lot.occupiedSpaces} spaces are currently occupied`
      );
      error.status = 400;
      throw error;
    }
    lot.totalCapacity = updateData.totalCapacity;
  }

  if (updateData.lotName) lot.lotName = updateData.lotName.trim();
  if (updateData.location !== undefined) lot.location = updateData.location.trim();
  if (updateData.walkingDistances) lot.walkingDistances = updateData.walkingDistances;
  if (typeof updateData.isActive === 'boolean') lot.isActive = updateData.isActive;

  await lot.save();
  return formatParkingLot(lot);
}

/**
 * Update the operational status of a parking lot (Admin).
 * @param {string} lotIdOrCode 
 * @param {boolean} isActive 
 * @returns {Promise<object>}
 */
export async function updateLotStatus(lotIdOrCode, isActive) {
  return updateLot(lotIdOrCode, { isActive });
}
