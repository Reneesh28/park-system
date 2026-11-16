/**
 * PARKWISE - Deterministic Recommendation Engine Service
 * Phase 2.7: Deterministic Recommendation Engine
 *
 * Implements mathematical scoring: S = 0.6 * A + 0.4 * D
 * Strictly algorithmic, reproducible, with zero external AI/ML dependencies.
 */

import ParkingLot from '../models/ParkingLot.js';
import RewardRule from '../models/RewardRule.js';
import { calculateRewardPoints } from './parkingSession.service.js';

/**
 * Normalizes destination string for flexible matching across keys.
 * @param {string} dest 
 * @returns {string}
 */
function normalizeKey(dest) {
  if (!dest) return '';
  return dest.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Retrieves walking distance in meters from lot's walkingDistances map.
 * @param {object} lot 
 * @param {string} destination 
 * @returns {number} distance in meters
 */
function getDistanceForDestination(lot, destination) {
  const normDest = normalizeKey(destination);
  let distances = lot.walkingDistances;

  if (distances instanceof Map) {
    distances = Object.fromEntries(distances);
  } else if (!distances) {
    distances = {};
  }

  // 1. Exact match
  if (distances[destination] !== undefined) {
    return Number(distances[destination]);
  }

  // 2. Normalized key match
  for (const [key, val] of Object.entries(distances)) {
    if (normalizeKey(key) === normDest) {
      return Number(val);
    }
  }

  // 3. Substring match
  for (const [key, val] of Object.entries(distances)) {
    const normKey = normalizeKey(key);
    if (normKey.includes(normDest) || normDest.includes(normKey)) {
      return Number(val);
    }
  }

  // 4. Default fallback distance
  return 300;
}

/**
 * Computes deterministic parking recommendations for a given destination block.
 * @param {string} [destination='Academic Block'] 
 * @returns {Promise<object>}
 */
export async function getRecommendations(destination = 'Academic Block A') {
  const targetDestination = destination && destination.trim() ? destination.trim() : 'Academic Block A';

  // 1. Fetch all active parking lots
  const activeLots = await ParkingLot.find({ isActive: true });
  if (activeLots.length === 0) {
    return {
      destination: targetDestination,
      recommendations: []
    };
  }

  // 2. Fetch active reward rules for point estimation
  const rewardRules = await RewardRule.find({ isActive: true }).sort({ points: -1 });

  // 3. Extract distances and compute min/max for min-max normalization
  const lotMetrics = activeLots.map((lot) => {
    const total = Number(lot.totalCapacity) || 1;
    const occupied = Number(lot.occupiedSpaces) || 0;
    const available = Math.max(0, total - occupied);
    const availabilityPercentage = Math.round((available / total) * 100);
    const occupancyPercentage = Math.round((occupied / total) * 100);
    const distanceMeters = getDistanceForDestination(lot, targetDestination);

    return {
      lot,
      total,
      occupied,
      available,
      availabilityPercentage,
      occupancyPercentage,
      distanceMeters
    };
  });

  const distances = lotMetrics.map((m) => m.distanceMeters);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  // 4. Compute composite scores
  const scoredLots = lotMetrics.map((metric) => {
    const { lot, total, occupied, available, availabilityPercentage, occupancyPercentage, distanceMeters } = metric;

    // Availability factor A in [0, 1]
    const A = total > 0 ? available / total : 0;

    // Normalized Distance factor D in [0, 1] (closer distance = higher score)
    let D = 1.0;
    if (maxDistance > minDistance) {
      D = 1.0 - (distanceMeters - minDistance) / (maxDistance - minDistance);
    }

    // Formula: S = 0.6 * A + 0.4 * D
    // Full lots (available === 0) receive a severe penalty so they aren't recommended
    let compositeScoreRaw = available > 0 ? (0.6 * A + 0.4 * D) : 0;
    const compositeScore = Math.round(compositeScoreRaw * 100);

    // Estimate reward points
    let estimatedRewardPoints = 0;
    for (const rule of rewardRules) {
      if (
        availabilityPercentage >= rule.minimumAvailabilityPercentage &&
        availabilityPercentage <= rule.maximumAvailabilityPercentage
      ) {
        estimatedRewardPoints = rule.points;
        break;
      }
    }

    return {
      lotId: lot._id.toString(),
      lotCode: lot.lotCode,
      lotName: lot.lotName,
      location: lot.location || '',
      totalCapacity: total,
      occupiedSpaces: occupied,
      availableSpaces: available,
      occupancyPercentage,
      availabilityPercentage,
      distanceMeters,
      availabilityFactor: Math.round(A * 100) / 100,
      distanceFactor: Math.round(D * 100) / 100,
      compositeScore,
      estimatedRewardPoints,
      isAvailable: available > 0
    };
  });

  // 5. Sort descending by compositeScore
  scoredLots.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    // Tie-breaker 1: greater availability
    if (b.availableSpaces !== a.availableSpaces) {
      return b.availableSpaces - a.availableSpaces;
    }
    // Tie-breaker 2: shorter distance
    return a.distanceMeters - b.distanceMeters;
  });

  // 6. Assign badges: highest scoring lot with available spaces is "Recommended"
  let recommendedAssigned = false;
  const recommendations = scoredLots.map((item) => {
    let badge = 'Alternative';
    let isRecommended = false;

    if (!item.isAvailable) {
      badge = 'Full';
    } else if (!recommendedAssigned) {
      badge = 'Recommended';
      isRecommended = true;
      recommendedAssigned = true;
    }

    return {
      ...item,
      isRecommended,
      badge
    };
  });

  return {
    destination: targetDestination,
    formula: 'Score = 0.6 * (Available/Total) + 0.4 * (1 - (Dist - MinDist)/(MaxDist - MinDist))',
    recommendations
  };
}
