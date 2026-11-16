/**
 * PARKWISE - QR Parking Session Management Service
 * Phase 2.6: QR Parking Sessions
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSession from '../models/ParkingSession.js';
import Reward from '../models/Reward.js';
import RewardRule from '../models/RewardRule.js';
import User from '../models/User.js';
import { hashQrToken, formatParkingLot } from './parkingLot.service.js';

/**
 * Resolves a scanned QR token string to a ParkingLot record.
 * Handles hashed tokens, raw seed hashes, and normalized lot identifiers.
 * @param {string} rawToken 
 * @returns {Promise<object>}
 */
export async function resolveLotFromQrToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    const error = new Error('Invalid QR code format');
    error.status = 400;
    throw error;
  }

  const token = rawToken.trim().toUpperCase();
  const tokenHash = hashQrToken(token);

  // 1. Direct hash match
  let lot = await ParkingLot.findOne({ qrTokenHash: tokenHash }).select('+qrTokenHash');

  // 2. Seed token format match: 'parkwise_seed_qr_secret_<code/token>'
  if (!lot) {
    const seedHash = crypto.createHash('sha256').update(`parkwise_seed_qr_secret_${token}`).digest('hex');
    lot = await ParkingLot.findOne({ qrTokenHash: seedHash }).select('+qrTokenHash');
  }

  // 3. Fallback: Parse common patterns like 'PARKWISE-LOT-A', 'LOT-A', 'QR-NG-A-01' -> 'A'
  if (!lot) {
    let candidateCode = null;
    if (token.startsWith('PARKWISE-LOT-')) {
      candidateCode = token.replace('PARKWISE-LOT-', '');
    } else if (token.startsWith('LOT-')) {
      candidateCode = token.replace('LOT-', '');
    } else if (token.length <= 3) {
      candidateCode = token;
    } else if (token === 'QR-NG-A-01') {
      candidateCode = 'A';
    } else if (token === 'QR-EW-B-02') {
      candidateCode = 'B';
    } else if (token === 'QR-CAB-C-03') {
      candidateCode = 'C';
    }

    if (candidateCode) {
      lot = await ParkingLot.findOne({ lotCode: candidateCode }).select('+qrTokenHash');
    }
  }

  if (!lot) {
    const error = new Error(`Unrecognized or invalid parking lot QR code: "${rawToken}"`);
    error.status = 404;
    throw error;
  }

  return lot;
}

/**
 * Computes reward points for check-out based on availability percentage and active reward rules.
 * @param {number} availabilityPercentage 
 * @returns {Promise<{ points: number, reason: string, ruleName: string }>}
 */
export async function calculateRewardPoints(availabilityPercentage) {
  const rules = await RewardRule.find({ isActive: true }).sort({ points: -1 });

  for (const rule of rules) {
    if (
      availabilityPercentage >= rule.minimumAvailabilityPercentage &&
      availabilityPercentage <= rule.maximumAvailabilityPercentage
    ) {
      return {
        points: rule.points,
        reason: rule.description || `Incentive points for lot availability (${availabilityPercentage}%)`,
        ruleName: rule.ruleName
      };
    }
  }

  // Default fallback: 0 points for congested lots
  return {
    points: 0,
    reason: 'Standard peak-period check-out (no incentive applicable)',
    ruleName: 'Standard Parking'
  };
}

/**
 * Primary QR Scan Handler: Performs Check-In or Check-Out atomically.
 * @param {string} userId 
 * @param {string} qrToken 
 * @param {string} [providedVehicleNumber] 
 * @returns {Promise<object>}
 */
export async function processQrScan(userId, qrToken, providedVehicleNumber) {
  const targetLot = await resolveLotFromQrToken(qrToken);

  // Check if student currently has an active session
  const activeSession = await ParkingSession.findOne({ userId, status: 'active' }).populate('parkingLotId');

  if (activeSession) {
    const currentLotId = (activeSession.parkingLotId?._id || activeSession.parkingLotId).toString();
    const scannedLotId = targetLot._id.toString();

    if (currentLotId === scannedLotId) {
      // User is in the SAME lot -> Perform CHECK-OUT
      return await checkoutSession(activeSession, targetLot);
    } else {
      // User is scanning a DIFFERENT lot while having an active session
      const currentLotName = activeSession.parkingLotId?.lotName || 'another parking zone';
      const error = new Error(
        `Active session conflict: You are currently parked in ${currentLotName}. You must check out from ${currentLotName} before parking in ${targetLot.lotName}.`
      );
      error.status = 409;
      throw error;
    }
  } else {
    // User does NOT have an active session -> Perform CHECK-IN
    return await checkinSession(userId, targetLot, providedVehicleNumber);
  }
}

/**
 * Executes check-in workflow.
 * @param {string} userId 
 * @param {object} lot 
 * @param {string} [providedVehicleNumber] 
 * @returns {Promise<object>}
 */
async function checkinSession(userId, lot, providedVehicleNumber) {
  if (!lot.isActive) {
    const error = new Error(`${lot.lotName} is currently inactive or closed for maintenance`);
    error.status = 400;
    throw error;
  }

  // Determine vehicle registration number
  let vehicleNumber = providedVehicleNumber ? providedVehicleNumber.trim().toUpperCase() : null;
  if (!vehicleNumber) {
    const user = await User.findById(userId);
    if (user && user.vehicles && user.vehicles.length > 0) {
      const primary = user.vehicles.find((v) => v.isPrimary) || user.vehicles[0];
      vehicleNumber = primary.vehicleNumber;
    }
  }
  if (!vehicleNumber) {
    vehicleNumber = 'CAMPUS-VEHICLE';
  }

  // Atomically increment occupiedSpaces if spaces are available
  const updatedLot = await ParkingLot.findOneAndUpdate(
    {
      _id: lot._id,
      isActive: true,
      $expr: { $lt: ['$occupiedSpaces', '$totalCapacity'] }
    },
    { $inc: { occupiedSpaces: 1 } },
    { new: true }
  );

  if (!updatedLot) {
    const error = new Error(`${lot.lotName} has reached full capacity. No parking spaces available.`);
    error.status = 400;
    throw error;
  }

  try {
    const newSession = new ParkingSession({
      userId,
      parkingLotId: lot._id,
      vehicleNumber,
      entryTime: new Date(),
      status: 'active',
      rewardPointsEarned: 0
    });

    await newSession.save();

    // Populate for response
    await newSession.populate('parkingLotId');

    return {
      action: 'checkin',
      session: newSession,
      lot: formatParkingLot(updatedLot),
      message: `Successfully checked into ${updatedLot.lotName}`
    };
  } catch (error) {
    // In case of concurrency conflict (partial unique index on { userId: 1, status: 'active' })
    // Roll back the atomic increment
    await ParkingLot.findByIdAndUpdate(lot._id, { $inc: { occupiedSpaces: -1 } });

    if (error.code === 11000) {
      const conflictError = new Error('User already has an active parking session');
      conflictError.status = 409;
      throw conflictError;
    }

    throw error;
  }
}

/**
 * Executes check-out workflow.
 * @param {object} session 
 * @param {object} lot 
 * @returns {Promise<object>}
 */
async function checkoutSession(session, lot) {
  // 1. Atomically decrement occupiedSpaces in parking lot (safely bounded at >= 0)
  const updatedLot = await ParkingLot.findOneAndUpdate(
    {
      _id: lot._id,
      occupiedSpaces: { $gt: 0 }
    },
    { $inc: { occupiedSpaces: -1 } },
    { new: true }
  );

  const exitTime = new Date();
  session.status = 'completed';
  session.exitTime = exitTime;

  // 2. Compute availability percentage at check-out
  const availableSpaces = updatedLot
    ? Math.max(0, updatedLot.totalCapacity - updatedLot.occupiedSpaces)
    : Math.max(0, lot.totalCapacity - Math.max(0, lot.occupiedSpaces - 1));
  const totalCap = updatedLot?.totalCapacity || lot.totalCapacity || 1;
  const availabilityPercentage = Math.round((availableSpaces / totalCap) * 100);

  // 3. Compute reward points
  const { points, reason } = await calculateRewardPoints(availabilityPercentage);
  session.rewardPointsEarned = points;

  await session.save();

  // 4. Award reward points if applicable (idempotent write)
  if (points > 0) {
    try {
      const rewardRecord = new Reward({
        userId: session.userId,
        sessionId: session._id,
        points,
        reason,
        rewardType: 'underutilized_parking'
      });
      await rewardRecord.save();

      // Credit user reward balance
      await User.findByIdAndUpdate(session.userId, { $inc: { rewardPoints: points } });
    } catch (rewardErr) {
      // Ignore E11000 duplicate key error for idempotency
      if (rewardErr.code !== 11000) {
        console.error('[Reward] Failed to log reward record:', rewardErr);
      }
    }
  }

  await session.populate('parkingLotId');

  return {
    action: 'checkout',
    session,
    lot: formatParkingLot(updatedLot || lot),
    pointsEarned: points,
    message: `Successfully checked out from ${lot.lotName}. You earned ${points} reward points.`
  };
}

/**
 * Get active session for a specific user.
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
export async function getActiveSession(userId) {
  const session = await ParkingSession.findOne({ userId, status: 'active' }).populate('parkingLotId');
  return session;
}

/**
 * Get paginated session history for a specific user.
 * @param {string} userId 
 * @param {object} options 
 * @returns {Promise<object>}
 */
export async function getSessionHistory(userId, { page = 1, limit = 10 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = { userId, status: 'completed' };

  const [sessions, total] = await Promise.all([
    ParkingSession.find(filter)
      .populate('parkingLotId')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(limitNum),
    ParkingSession.countDocuments(filter)
  ]);

  return {
    sessions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Get a single session by its ID.
 * @param {string} sessionId 
 * @param {string} userId 
 * @param {string} userRole 
 * @returns {Promise<object>}
 */
export async function getSessionById(sessionId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID format');
    error.status = 400;
    throw error;
  }

  const session = await ParkingSession.findById(sessionId).populate('parkingLotId');
  if (!session) {
    const error = new Error('Parking session not found');
    error.status = 404;
    throw error;
  }

  // Authorization check: User can only access their own session unless admin
  if (userRole !== 'admin' && session.userId.toString() !== userId.toString()) {
    const error = new Error('Forbidden: You do not have permission to view this session');
    error.status = 403;
    throw error;
  }

  return session;
}
