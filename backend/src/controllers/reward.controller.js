/**
 * PARKWISE - Reward Management HTTP Controller
 * Phase 2.8: Rewards Management
 */

import * as rewardService from '../services/reward.service.js';
import { createRewardRuleSchema, updateRewardRuleSchema } from '../validators/reward.validator.js';

/**
 * Get student's reward points summary.
 * @route GET /api/v1/rewards/summary
 */
export async function getSummary(req, res, next) {
  try {
    const summary = await rewardService.getRewardSummary(req.user.userId);
    res.status(200).json({
      success: true,
      message: 'Reward summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get student's reward transaction ledger history.
 * @route GET /api/v1/rewards/history
 */
export async function getHistory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const history = await rewardService.getRewardHistory(req.user.userId, { page, limit });

    res.status(200).json({
      success: true,
      message: 'Reward history retrieved successfully',
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active reward rules (Student / Public).
 * @route GET /api/v1/rewards/rules
 */
export async function getRules(req, res, next) {
  try {
    const rules = await rewardService.getRewardRules(true);
    res.status(200).json({
      success: true,
      message: 'Active reward rules retrieved successfully',
      data: { rules }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all reward rules including inactive (Admin).
 * @route GET /api/v1/admin/rewards/rules
 */
export async function adminGetRules(req, res, next) {
  try {
    const rules = await rewardService.getRewardRules(false);
    res.status(200).json({
      success: true,
      message: 'All reward rules retrieved successfully',
      data: { rules }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new reward rule (Admin).
 * @route POST /api/v1/admin/rewards/rules
 */
export async function adminCreateRule(req, res, next) {
  try {
    const { error, value } = createRewardRuleSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({ field: d.path.join('.'), reason: d.message }))
      });
    }

    const rule = await rewardService.createRewardRule(value);
    res.status(201).json({
      success: true,
      message: 'Reward rule created successfully',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing reward rule (Admin).
 * @route PATCH /api/v1/admin/rewards/rules/:ruleId
 */
export async function adminUpdateRule(req, res, next) {
  try {
    const { error, value } = updateRewardRuleSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({ field: d.path.join('.'), reason: d.message }))
      });
    }

    const rule = await rewardService.updateRewardRule(req.params.ruleId, value);
    res.status(200).json({
      success: true,
      message: 'Reward rule updated successfully',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a reward rule (Admin).
 * @route DELETE /api/v1/admin/rewards/rules/:ruleId
 */
export async function adminDeleteRule(req, res, next) {
  try {
    const rule = await rewardService.deleteRewardRule(req.params.ruleId);
    res.status(200).json({
      success: true,
      message: 'Reward rule deleted successfully',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
}
