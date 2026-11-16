/**
 * PARKWISE - Admin Operations & Analytics Service
 * Phase 2.9: Admin APIs and Analytics
 */

import mongoose from 'mongoose';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSession from '../models/ParkingSession.js';
import User from '../models/User.js';
import Reward from '../models/Reward.js';
import { formatParkingLot } from './parkingLot.service.js';
import { getTierFromPoints } from './reward.service.js';

/**
 * Retrieves high-level administrative dashboard overview statistics.
 * @returns {Promise<object>}
 */
export async function getDashboardOverview() {
  const [lots, activeSessionsCount, totalStudentsCount, rewardAggregation, todaySessionsCount] =
    await Promise.all([
      ParkingLot.find().sort({ lotCode: 1 }),
      ParkingSession.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'student', isActive: true }),
      Reward.aggregate([{ $group: { _id: null, totalPoints: { $sum: '$points' } } }]),
      (() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return ParkingSession.countDocuments({ entryTime: { $gte: startOfDay } });
      })()
    ]);

  let totalCapacity = 0;
  let totalOccupied = 0;
  let activeLotsCount = 0;

  const lotSummaries = lots.map((lot) => {
    const formatted = formatParkingLot(lot);
    if (lot.isActive) {
      activeLotsCount += 1;
      totalCapacity += formatted.totalCapacity;
      totalOccupied += formatted.occupiedSpaces;
    }
    return formatted;
  });

  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
  const overallOccupancyPercentage =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const totalRewardsDistributed = rewardAggregation[0]?.totalPoints || 0;

  return {
    overview: {
      totalLots: lots.length,
      activeLots: activeLotsCount,
      totalCapacity,
      totalOccupied,
      totalAvailable,
      overallOccupancyPercentage,
      activeSessionsCount,
      totalStudentsCount,
      todaySessionsCount,
      totalRewardsDistributed
    },
    lots: lotSummaries
  };
}

/**
 * Retrieves recent live check-in and check-out activity feed.
 * @param {number} [limit=20] 
 * @returns {Promise<Array>}
 */
export async function getRecentActivity(limit = 20) {
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const sessions = await ParkingSession.find()
    .populate('userId', 'fullName studentId email')
    .populate('parkingLotId', 'lotCode lotName location')
    .sort({ updatedAt: -1 })
    .limit(limitNum);

  return sessions.map((s) => {
    const isCompleted = s.status === 'completed';
    return {
      sessionId: s._id.toString(),
      studentName: s.userId?.fullName || 'Unknown Student',
      studentId: s.userId?.studentId || 'N/A',
      email: s.userId?.email || '',
      lotCode: s.parkingLotId?.lotCode || 'N/A',
      lotName: s.parkingLotId?.lotName || 'N/A',
      vehicleNumber: s.vehicleNumber,
      action: isCompleted ? 'checkout' : 'checkin',
      status: s.status,
      timestamp: isCompleted ? s.exitTime : s.entryTime,
      entryTime: s.entryTime,
      exitTime: s.exitTime,
      pointsEarned: s.rewardPointsEarned || 0,
      durationMinutes: s.durationMinutes || 0
    };
  });
}

/**
 * Retrieves filterable, paginated administrative parking session log.
 * @param {object} filters 
 * @returns {Promise<object>}
 */
export async function getAdminSessions(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const query = {};

  if (filters.status && ['active', 'completed'].includes(filters.status)) {
    query.status = filters.status;
  }

  if (filters.lotId) {
    if (mongoose.Types.ObjectId.isValid(filters.lotId)) {
      query.parkingLotId = filters.lotId;
    } else {
      const lot = await ParkingLot.findOne({ lotCode: filters.lotId.trim().toUpperCase() });
      if (lot) query.parkingLotId = lot._id;
    }
  }

  if (filters.startDate || filters.endDate) {
    query.entryTime = {};
    if (filters.startDate) query.entryTime.$gte = new Date(filters.startDate);
    if (filters.endDate) query.entryTime.$lte = new Date(filters.endDate);
  }

  if (filters.studentId) {
    const user = await User.findOne({
      $or: [
        { studentId: filters.studentId.trim().toUpperCase() },
        { fullName: new RegExp(filters.studentId.trim(), 'i') }
      ]
    });
    if (user) {
      query.userId = user._id;
    } else {
      return { sessions: [], pagination: { total: 0, page, limit, pages: 1 } };
    }
  }

  const [sessions, total] = await Promise.all([
    ParkingSession.find(query)
      .populate('userId', 'fullName studentId email')
      .populate('parkingLotId', 'lotCode lotName location')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(limit),
    ParkingSession.countDocuments(query)
  ]);

  return {
    sessions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

/**
 * Computes deep utilization analytics across lots and peak usage hours.
 * @returns {Promise<object>}
 */
export async function getUtilisationAnalytics() {
  const [lots, hourlyAggregation, avgDurationAgg] = await Promise.all([
    ParkingLot.find({ isActive: true }).sort({ lotCode: 1 }),
    ParkingSession.aggregate([
      {
        $project: {
          hour: { $hour: { date: '$entryTime', timezone: '+00:00' } }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    ParkingSession.aggregate([
      { $match: { status: 'completed', exitTime: { $ne: null } } },
      {
        $project: {
          durationMinutes: {
            $divide: [{ $subtract: ['$exitTime', '$entryTime'] }, 60000]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$durationMinutes' },
          totalSessions: { $sum: 1 }
        }
      }
    ])
  ]);

  // Map 24-hour distribution
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
    sessionsCount: 0
  }));

  for (const item of hourlyAggregation) {
    if (item._id >= 0 && item._id < 24) {
      hourlyActivity[item._id].sessionsCount = item.count;
    }
  }

  const lotBreakdown = lots.map((l) => formatParkingLot(l));
  const avgDurationMinutes = Math.round(avgDurationAgg[0]?.avgDuration || 0);

  return {
    lotBreakdown,
    hourlyActivity,
    averageSessionDurationMinutes: avgDurationMinutes,
    totalCompletedSessionsSampled: avgDurationAgg[0]?.totalSessions || 0
  };
}

/**
 * Computes administrative reward distribution analytics and student leaderboard.
 * @returns {Promise<object>}
 */
export async function getRewardsAnalytics() {
  const [totalAggregation, reasonAggregation, topStudents] = await Promise.all([
    Reward.aggregate([
      { $group: { _id: null, totalPoints: { $sum: '$points' }, totalRewards: { $sum: 1 } } }
    ]),
    Reward.aggregate([
      {
        $group: {
          _id: '$reason',
          points: { $sum: '$points' },
          count: { $sum: 1 }
        }
      },
      { $sort: { points: -1 } }
    ]),
    User.find({ role: 'student', isActive: true })
      .select('fullName studentId email rewardPoints')
      .sort({ rewardPoints: -1 })
      .limit(10)
  ]);

  const leaderboard = topStudents.map((u, index) => ({
    rank: index + 1,
    id: u._id.toString(),
    fullName: u.fullName,
    studentId: u.studentId,
    email: u.email,
    rewardPoints: u.rewardPoints || 0,
    tier: getTierFromPoints(u.rewardPoints || 0)
  }));

  return {
    totalPointsDistributed: totalAggregation[0]?.totalPoints || 0,
    totalRewardTransactions: totalAggregation[0]?.totalRewards || 0,
    breakdownByReason: reasonAggregation,
    leaderboard
  };
}
