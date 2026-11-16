/**
 * PARKWISE - Authentication API Service
 * Phase 2.10: Full Frontend-Backend Integration
 */

import { storageService } from '../services/storage.service.js';
import { apiRequest, createApiResponse, delay } from './api.js';

export const authApi = {
  /**
   * Log in user with credentials against backend or fallback local storage.
   * Supports either (email, password) or ({ email, password }).
   * @param {string|object} emailOrObj 
   * @param {string} [maybePassword] 
   */
  async login(emailOrObj, maybePassword) {
    let email = emailOrObj;
    let password = maybePassword;
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email;
      password = emailOrObj.password;
    }

    const payload = {
      email: (email || '').trim().toLowerCase(),
      password: password || ''
    };

    const mockFallback = () => {
      const users = storageService.get('users', []);
      const user = users.find(
        (u) => u.email.toLowerCase() === payload.email && u.password === payload.password
      );

      if (!user) {
        return createApiResponse(false, null, 'Invalid email or password. Please try again.', 401);
      }

      if (user.isActive === false) {
        return createApiResponse(false, null, 'Your account has been deactivated by administration.', 403);
      }

      const safeUser = { ...user };
      delete safeUser.password;
      storageService.set('current_user', safeUser);
      storageService.set('auth_token', `mock_token_${Date.now()}_${user.id}`);
      return createApiResponse(true, { user: safeUser, accessToken: 'mock_token' }, 'Authentication successful');
    };

    const res = await apiRequest(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      mockFallback
    );

    if (res.success && res.data) {
      const rawUser = res.data.user || {};
      const safeUser = {
        id: rawUser._id || rawUser.id || 'usr_001',
        _id: rawUser._id || rawUser.id || 'usr_001',
        name: rawUser.fullName || rawUser.name || 'Student',
        fullName: rawUser.fullName || rawUser.name || 'Student',
        email: rawUser.email,
        studentId: rawUser.studentId,
        role: rawUser.role || 'student',
        walletBalance: rawUser.rewardPoints ?? rawUser.walletBalance ?? 0,
        rewardPoints: rawUser.rewardPoints ?? rawUser.walletBalance ?? 0,
        vehicle: rawUser.vehicles?.[0] || rawUser.vehicle || {
          vehicleNumber: 'CW-4482',
          vehicleType: 'two-wheeler',
          isPrimary: true
        }
      };

      storageService.set('current_user', safeUser);
      if (res.data.accessToken) {
        storageService.set('auth_token', res.data.accessToken);
      }

      return createApiResponse(true, { user: safeUser, token: res.data.accessToken }, res.message || 'Authentication successful');
    }

    return res;
  },

  /**
   * Register a new student account.
   * @param {Object} registrationData 
   */
  async register(registrationData) {
    const payload = {
      fullName: (registrationData.fullName || registrationData.name || '').trim(),
      email: (registrationData.email || '').trim().toLowerCase(),
      studentId: (registrationData.studentId || '').trim().toUpperCase(),
      password: registrationData.password,
      confirmPassword: registrationData.confirmPassword || registrationData.password,
      vehicleNumber: registrationData.vehicleNumber || 'CW-4482',
      vehicleType: registrationData.vehicleType || 'two-wheeler'
    };

    const mockFallback = () => {
      const users = storageService.get('users', []);
      if (users.some((u) => u.email.toLowerCase() === payload.email)) {
        return createApiResponse(false, null, 'An account with this email address already exists.', 409);
      }
      const newUser = {
        id: `usr_${Date.now()}`,
        role: 'student',
        studentId: payload.studentId,
        name: payload.fullName,
        fullName: payload.fullName,
        email: payload.email,
        walletBalance: 0,
        vehicle: {
          vehicleNumber: payload.vehicleNumber.trim().toUpperCase(),
          vehicleType: payload.vehicleType || 'two-wheeler',
          isPrimary: true
        },
        isActive: true,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      storageService.set('users', users);
      storageService.set('current_user', newUser);
      storageService.set('auth_token', `mock_token_${Date.now()}`);
      return createApiResponse(true, { user: newUser }, 'Student account registered successfully', 201);
    };

    const res = await apiRequest(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      mockFallback
    );

    if (res.success && res.data?.user) {
      // Automatically log in newly registered student
      return await this.login(payload.email, payload.password);
    }

    return res;
  },

  /**
   * Retrieve currently authenticated user.
   */
  async getCurrentUser() {
    const user = storageService.get('current_user');
    if (!user) {
      return createApiResponse(false, null, 'No active session', 401);
    }
    return createApiResponse(true, user, 'Active session active');
  },

  /**
   * Sign out current user.
   */
  async logout() {
    await apiRequest('/auth/logout', { method: 'POST' }, () => createApiResponse(true, null));
    storageService.remove('current_user');
    storageService.remove('auth_token');
    return createApiResponse(true, null, 'Signed out successfully');
  }
};
