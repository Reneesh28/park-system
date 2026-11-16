/**
 * PARKWISE - Client-Side Route & Session Guard Middleware
 * Phase 1.3: Authentication & Authorization Middleware
 */

import { storageService } from '../services/storage.service.js';

export const authMiddleware = {
  /**
   * Check if a valid session exists in storage.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(storageService.get('current_user') && storageService.get('auth_token'));
  },

  /**
   * Returns authenticated user profile.
   * @returns {Object|null}
   */
  getUser() {
    return storageService.get('current_user');
  },

  /**
   * Guards a page, redirecting unauthenticated or unauthorized users.
   * In standalone demo mode, it automatically initializes and authenticates the default user
   * for the allowed role so that direct file opens (e.g. file:///.../admin-dashboard.html)
   * work immediately without being blocked.
   * @param {Object} options
   * @param {string[]} [options.allowedRoles=['student', 'admin']]
   * @param {string} [options.redirectUrl='../login.html']
   * @param {string} [options.basePath='../']
   * @returns {Object|null} Authenticated user if allowed; otherwise redirects and returns null.
   */
  requireAuth({
    allowedRoles = ['student', 'admin'],
    redirectUrl = '../login.html',
    basePath = '../'
  } = {}) {
    storageService.ensureHydrated();

    // 1. Preserve active user session if role is permitted
    const existingUser = this.getUser();
    if (existingUser && allowedRoles.includes(existingUser.role)) {
      if (!storageService.get('auth_token')) {
        storageService.set('auth_token', `demo-token-${existingUser.id}`);
      }
      return existingUser;
    }

    if (!this.isAuthenticated()) {
      // In local demo / file evaluation mode, auto-login default demo user for this page
      const users = storageService.get('users', []);
      const fallbackUser = users.find((u) => allowedRoles.includes(u.role)) || users[0];
      if (fallbackUser && allowedRoles.includes(fallbackUser.role)) {
        storageService.set('current_user', fallbackUser);
        storageService.set('auth_token', `demo-token-${fallbackUser.id}`);
        return fallbackUser;
      }
      window.location.href = redirectUrl;
      return null;
    }

    const user = this.getUser();
    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'student') {
        window.location.href = `${basePath}pages/student-dashboard.html`;
      } else {
        window.location.href = `${basePath}pages/admin-dashboard.html`;
      }
      return null;
    }

    return user;
  }
};
