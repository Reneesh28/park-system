/**
 * PARKWISE - Admin Operations HTTP Controller
 * Phase 2.9: Admin APIs and Analytics
 */

import * as adminService from '../services/admin.service.js';

/**
 * Get high-level admin dashboard metrics and lot overview.
 * @route GET /api/v1/admin/dashboard
 */
export async function getDashboard(req, res, next) {
  try {
    const data = await adminService.getDashboardOverview();
    res.status(200).json({
      success: true,
      message: 'Admin dashboard overview retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get live recent parking activity feed.
 * @route GET /api/v1/admin/parking-activity
 */
export async function getParkingActivity(req, res, next) {
  try {
    const { limit } = req.query;
    const activity = await adminService.getRecentActivity(limit);
    res.status(200).json({
      success: true,
      message: 'Recent parking activity retrieved successfully',
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get filtered, paginated administrative parking sessions.
 * @route GET /api/v1/admin/parking-sessions
 */
export async function getParkingSessions(req, res, next) {
  try {
    const { status, lotId, studentId, startDate, endDate, page, limit } = req.query;
    const result = await adminService.getAdminSessions({
      status,
      lotId,
      studentId,
      startDate,
      endDate,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      message: 'Admin parking sessions retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get lot utilization and peak hour analytics.
 * @route GET /api/v1/admin/analytics/utilisation
 */
export async function getUtilisationAnalytics(req, res, next) {
  try {
    const data = await adminService.getUtilisationAnalytics();
    res.status(200).json({
      success: true,
      message: 'Utilisation analytics retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get reward points distribution and student leaderboard.
 * @route GET /api/v1/admin/analytics/rewards
 */
export async function getRewardsAnalytics(req, res, next) {
  try {
    const data = await adminService.getRewardsAnalytics();
    res.status(200).json({
      success: true,
      message: 'Rewards analytics retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}
