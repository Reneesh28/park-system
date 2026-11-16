/**
 * PARKWISE - Reward Management Service
 * Phase 2.8: Rewards Management
 */

import mongoose from 'mongoose';
import Reward from '../models/Reward.js';
import RewardRule from '../models/RewardRule.js';
import User from '../models/User.js';
import ParkingSession from '../models/ParkingSession.js';

/**
 * Derives student tier based on lifetime/accumulated reward points.
 * @param {number} points 
 * @returns {'Bronze'|'Silver'|'Gold'|'Platinum'}
 */
export function getTierFromPoints(points) {
  const p = Number(points) || 0;
  if (p >= 500) return 'Platinum';
  if (p >= 250) return 'Gold';
  if (p >= 100) return 'Silver';
  return 'Bronze';
}

/**
 * Get student's reward points summary, ranking, and activity metrics.
 * @param {string} userId 
 * @returns {Promise<object>}
 */
export async function getRewardSummary(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const userPoints = user.rewardPoints || 0;

  // 1. Leaderboard Rank: count active students with strictly higher points + 1
  const higherCount = await User.countDocuments({
    role: 'student',
    isActive: true,
    rewardPoints: { $gt: userPoints }
  });
  const leaderboardRank = higherCount + 1;

  // 2. Total completed parking sessions
  const sessionsParked = await ParkingSession.countDocuments({
    userId,
    status: 'completed'
  });

  // 3. Current month points
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [monthAggregation, totalEarnedAggregation] = await Promise.all([
    Reward.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]),
    Reward.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ])
  ]);

  const currentMonthPoints = monthAggregation[0]?.total || 0;
  const lifetimePointsEarned = totalEarnedAggregation[0]?.total || userPoints;

  return {
    totalPoints: userPoints,
    lifetimePointsEarned,
    currentMonthPoints,
    sessionsParked,
    tier: getTierFromPoints(userPoints),
    leaderboardRank,
    nextTierPoints: userPoints < 100 ? 100 - userPoints : userPoints < 250 ? 250 - userPoints : userPoints < 500 ? 500 - userPoints : 0
  };
}

/**
 * Get paginated reward history transactions for a student.
 * @param {string} userId 
 * @param {object} options 
 * @returns {Promise<object>}
 */
export async function getRewardHistory(userId, { page = 1, limit = 10 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = { userId };

  const [history, total] = await Promise.all([
    Reward.find(filter)
      .populate('sessionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Reward.countDocuments(filter)
  ]);

  return {
    rewards: history,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * Get reward calculation rules (Active rules for students, all for admins).
 * @param {boolean} onlyActive 
 * @returns {Promise<Array>}
 */
export async function getRewardRules(onlyActive = true) {
  const query = onlyActive ? { isActive: true } : {};
  return await RewardRule.find(query).sort({ points: -1 });
}

/**
 * Create a new reward rule (Admin).
 * @param {object} ruleData 
 * @returns {Promise<object>}
 */
export async function createRewardRule(ruleData) {
  if (ruleData.minimumAvailabilityPercentage > ruleData.maximumAvailabilityPercentage) {
    const error = new Error('Minimum availability percentage cannot exceed maximum availability percentage');
    error.status = 400;
    throw error;
  }

  const existing = await RewardRule.findOne({ ruleName: ruleData.ruleName.trim() });
  if (existing) {
    const error = new Error(`Rule with name "${ruleData.ruleName}" already exists`);
    error.status = 409;
    throw error;
  }

  const rule = new RewardRule({
    ruleName: ruleData.ruleName.trim(),
    minimumAvailabilityPercentage: ruleData.minimumAvailabilityPercentage,
    maximumAvailabilityPercentage: ruleData.maximumAvailabilityPercentage,
    points: ruleData.points,
    isActive: ruleData.isActive !== false,
    description: ruleData.description ? ruleData.description.trim() : ''
  });

  await rule.save();
  return rule;
}

/**
 * Update an existing reward rule (Admin).
 * @param {string} ruleId 
 * @param {object} updateData 
 * @returns {Promise<object>}
 */
export async function updateRewardRule(ruleId, updateData) {
  if (!mongoose.Types.ObjectId.isValid(ruleId)) {
    const error = new Error('Invalid reward rule ID format');
    error.status = 400;
    throw error;
  }

  const rule = await RewardRule.findById(ruleId);
  if (!rule) {
    const error = new Error('Reward rule not found');
    error.status = 404;
    throw error;
  }

  const min = updateData.minimumAvailabilityPercentage ?? rule.minimumAvailabilityPercentage;
  const max = updateData.maximumAvailabilityPercentage ?? rule.maximumAvailabilityPercentage;

  if (min > max) {
    const error = new Error('Minimum availability percentage cannot exceed maximum availability percentage');
    error.status = 400;
    throw error;
  }

  if (updateData.ruleName) rule.ruleName = updateData.ruleName.trim();
  if (updateData.minimumAvailabilityPercentage !== undefined) rule.minimumAvailabilityPercentage = updateData.minimumAvailabilityPercentage;
  if (updateData.maximumAvailabilityPercentage !== undefined) rule.maximumAvailabilityPercentage = updateData.maximumAvailabilityPercentage;
  if (updateData.points !== undefined) rule.points = updateData.points;
  if (updateData.isActive !== undefined) rule.isActive = updateData.isActive;
  if (updateData.description !== undefined) rule.description = updateData.description.trim();

  await rule.save();
  return rule;
}

/**
 * Delete or deactivate a reward rule (Admin).
 * @param {string} ruleId 
 * @returns {Promise<object>}
 */
export async function deleteRewardRule(ruleId) {
  if (!mongoose.Types.ObjectId.isValid(ruleId)) {
    const error = new Error('Invalid reward rule ID format');
    error.status = 400;
    throw error;
  }

  const rule = await RewardRule.findByIdAndDelete(ruleId);
  if (!rule) {
    const error = new Error('Reward rule not found');
    error.status = 404;
    throw error;
  }

  return rule;
}
