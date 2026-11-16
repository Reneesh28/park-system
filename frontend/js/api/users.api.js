/**
 * PARKWISE - Users & Profile API Abstraction
 * Phase 1.1: Project Initialization
 *
 * Defines interface for profile details, vehicle registrations, and admin user queries.
 */

import { apiRequest, createApiResponse } from './api.js';
import { mockUsers } from '../data/mock-data.js';

export const usersApi = {
  /**
   * Fetch user profile.
   */
  async getProfile(userId) {
    return apiRequest(`/users/${userId}`, { method: 'GET' }, () => {
      const user = mockUsers.find((u) => u.id === userId) || mockUsers[0];
      return createApiResponse(true, user, 'Profile fetched');
    });
  },

  /**
   * Update registered vehicle details.
   */
  async updateVehicle(userId, vehicleData) {
    return apiRequest(`/users/${userId}/vehicle`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    }, () => {
      return createApiResponse(true, vehicleData, 'Vehicle details updated');
    });
  },

  /**
   * Admin: Fetch list of users.
   */
  async getAllUsers() {
    return apiRequest('/admin/users', { method: 'GET' }, () => {
      return createApiResponse(true, mockUsers, 'All users fetched');
    });
  }
};
