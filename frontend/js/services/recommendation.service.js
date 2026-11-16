/**
 * PARKWISE - Deterministic Parking Recommendation Engine
 * Phase 1.6: Parking Recommendation Interface
 *
 * Implements S = 0.6*A + 0.4*D multi-factor ranking.
 * Transparent, deterministic JavaScript algorithm (Zero external AI dependencies).
 */

import { storageService } from './storage.service.js';

export const ACADEMIC_DESTINATIONS = [
  'Engineering Hall',
  'Science Complex',
  'Central Library',
  'Student Center',
  'Humanities Courtyard'
];

export const recommendationService = {
  /**
   * Helper to retrieve walking distance in meters for a lot and destination block.
   * @param {string|Object} lotOrCode
   * @param {string} destinationBlock
   * @returns {number} distance in meters
   */
  getDistance(lotOrCode, destinationBlock = 'Engineering Hall') {
    if (!lotOrCode) return 400;
    if (typeof lotOrCode === 'object' && lotOrCode.walkingDistances) {
      return lotOrCode.walkingDistances[destinationBlock] || 400;
    }
    const lots = storageService.get('lots', []);
    const lot = lots.find((l) => l.lotCode === lotOrCode || l.id === lotOrCode);
    return (lot?.walkingDistances && lot.walkingDistances[destinationBlock]) || 400;
  },

  /**
   * Evaluates all parking lots against a destination academic block.
   * @param {Array} lots - Array of parking lot objects
   * @param {string} destinationBlock - Target academic building
   * @returns {Array} Ranked parking lots with scoring breakdown
   */
  rankLots(lots, destinationBlock = 'Engineering Hall') {
    if (!Array.isArray(lots) || lots.length === 0) return [];

    // Find maximum walking distance for normalization
    let maxDistance = 100;
    lots.forEach((lot) => {
      const dist = (lot.walkingDistances && lot.walkingDistances[destinationBlock]) || 500;
      if (dist > maxDistance) maxDistance = dist;
    });

    const evaluatedLots = lots.map((lot) => {
      const totalCapacity = lot.totalCapacity || 1;
      const occupiedSpaces = lot.occupiedSpaces || 0;
      const availableSpaces = Math.max(0, totalCapacity - occupiedSpaces);
      const isAvailable = lot.isActive !== false && availableSpaces > 0;

      const distanceMeters = (lot.walkingDistances && lot.walkingDistances[destinationBlock]) || 400;
      const walkingMinutes = Math.max(1, Math.round(distanceMeters / 80)); // ~80 meters per min

      if (!isAvailable) {
        return {
          ...lot,
          availableSpaces,
          availabilityRatio: 0,
          occupancyRatio: 1,
          proximityScore: 0,
          score: 0,
          distanceMeters,
          walkingMinutes,
          isRecommended: false,
          recommendationReason: lot.isActive === false ? 'Lot temporarily closed for maintenance' : 'Lot is currently 100% full',
          potentialPoints: 0
        };
      }

      // Normalised availability score A (0.0 to 1.0)
      const availabilityRatio = availableSpaces / totalCapacity;

      // Normalised proximity score D (0.0 to 1.0, shorter distance = higher score)
      const proximityScore = Math.max(0.1, 1 - (distanceMeters / (maxDistance * 1.1)));

      // Deterministic Formula: S = 0.6*A + 0.4*D
      let score = (0.6 * availabilityRatio) + (0.4 * proximityScore);

      // Reward tier bonus: underutilized lots (>60% open) receive incentive boost
      let potentialPoints = 10;
      let reason = `Good balance of proximity (${distanceMeters}m) and open space.`;

      if (availabilityRatio >= 0.6) {
        score += 0.15; // Incentive nudge for underutilized lots
        potentialPoints = 20;
        reason = `Highly recommended: underutilized parking lot (${Math.round(availabilityRatio * 100)}% available) + 20 Bonus Reward Points!`;
      } else if (availabilityRatio < 0.3) {
        reason = `Close to destination, but parking availability is limited (${availableSpaces} spaces left).`;
        potentialPoints = 0;
      }

      return {
        ...lot,
        availableSpaces,
        availabilityRatio,
        occupancyRatio: occupiedSpaces / totalCapacity,
        proximityScore,
        score: Math.min(1.0, score),
        distanceMeters,
        walkingMinutes,
        isRecommended: false, // Set below for the top scorer
        recommendationReason: reason,
        potentialPoints
      };
    });

    // Sort descending by calculated score
    evaluatedLots.sort((a, b) => b.score - a.score);

    // Mark the top valid candidate as recommended
    const topCandidate = evaluatedLots.find((l) => l.score > 0);
    if (topCandidate) {
      topCandidate.isRecommended = true;
    }

    return evaluatedLots;
  }
};
