/**
 * PARKWISE - Recommendation HTTP Controller
 * Phase 2.7: Deterministic Recommendation Engine
 */

import * as recommendationService from '../services/recommendation.service.js';

/**
 * Get deterministic parking lot recommendations based on destination block.
 * @route GET /api/v1/recommendations
 */
export async function getRecommendations(req, res, next) {
  try {
    const destination = req.query.destination || req.query.block || 'Academic Block A';
    const result = await recommendationService.getRecommendations(destination);

    res.status(200).json({
      success: true,
      message: 'Recommendations computed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
