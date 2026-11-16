/**
 * PARKWISE - Rewards & Points API Client
 * Phase 2.10: Full Frontend-Backend Integration
 */

import { storageService } from '../services/storage.service.js';
import { apiRequest, createApiResponse, delay } from './api.js';

export const rewardsApi = {
  /**
   * Fetch user reward points balance, lifetime points, and stats.
   */
  async getSummary(userId) {
    const mockFallback = () => {
      const users = storageService.get('users', []);
      const user = users.find((u) => u.id === userId);
      const ledger = storageService.get('reward_ledger', []);
      const userLedger = ledger.filter((tx) => tx.userId === userId);
      const lifetimeEarned = userLedger
        .filter((tx) => tx.type === 'earn')
        .reduce((sum, tx) => sum + (tx.points || 0), 0);

      return createApiResponse(true, {
        currentBalance: user ? (user.walletBalance || 0) : 0,
        lifetimeEarned,
        tier: 'Silver',
        rank: 1,
        underutilizedParksCount: userLedger.length
      }, 'Reward summary retrieved');
    };

    const res = await apiRequest('/rewards/summary', { method: 'GET' }, mockFallback);
    if (res.success && res.data) {
      return createApiResponse(true, {
        currentBalance: res.data.totalPoints ?? 0,
        lifetimeEarned: res.data.lifetimePointsEarned ?? 0,
        tier: res.data.tier || 'Bronze',
        rank: res.data.leaderboardRank || 1,
        underutilizedParksCount: res.data.sessionsParked || 0,
        nextTierPoints: res.data.nextTierPoints || 0
      }, 'Reward summary retrieved');
    }

    return res;
  },

  /**
   * Fetch available reward catalog items.
   */
  async getCatalog() {
    const catalog = storageService.get('reward_catalog', []);
    return createApiResponse(true, catalog, 'Reward catalog retrieved');
  },

  /**
   * Fetch transaction ledger history for student.
   */
  async getLedger(userId) {
    const mockFallback = () => {
      const ledger = storageService.get('reward_ledger', []);
      const userLedger = ledger.filter((tx) => tx.userId === userId);
      return createApiResponse(true, userLedger, 'Reward ledger retrieved');
    };

    const res = await apiRequest('/rewards/history', { method: 'GET' }, mockFallback);
    if (res.success && res.data?.rewards) {
      const formatted = res.data.rewards.map((r) => ({
        id: r._id || r.id,
        lotName: 'Campus Parking',
        type: 'earn',
        points: r.points,
        reason: r.reason,
        timestamp: r.createdAt
      }));
      return createApiResponse(true, formatted, 'Reward ledger retrieved');
    }

    return res;
  },

  /**
   * Redeem a catalog reward perk with student points.
   */
  async redeemReward({ rewardId, userId }) {
    await delay(150);

    const users = storageService.get('users', []);
    const catalog = storageService.get('reward_catalog', []);
    const ledger = storageService.get('reward_ledger', []);

    const userIndex = users.findIndex((u) => u.id === userId);
    const item = catalog.find((r) => r.id === rewardId);

    if (!item) {
      return createApiResponse(false, null, 'Reward item not found', 404);
    }

    const currentUser = storageService.get('current_user') || {};
    const balance = currentUser.walletBalance ?? 350;

    if (balance < item.pointsRequired) {
      return createApiResponse(
        false,
        null,
        `Insufficient points. You need ${item.pointsRequired} pts, but current balance is ${balance} pts.`,
        400
      );
    }

    // Deduct points
    currentUser.walletBalance = balance - item.pointsRequired;
    currentUser.rewardPoints = currentUser.walletBalance;
    storageService.set('current_user', currentUser);

    const voucherCode = `PW-${item.id.toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    ledger.unshift({
      id: `tx_${Date.now()}`,
      userId,
      type: 'redeem',
      points: -item.pointsRequired,
      reason: `Redeemed: ${item.title} (Voucher: ${voucherCode})`,
      timestamp: new Date().toISOString()
    });
    storageService.set('reward_ledger', ledger);

    return createApiResponse(
      true,
      {
        item,
        voucherCode,
        remainingBalance: currentUser.walletBalance
      },
      `Successfully redeemed "${item.title}"! Voucher code: ${voucherCode}`
    );
  }
};
