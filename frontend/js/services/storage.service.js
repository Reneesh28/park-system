/**
 * PARKWISE - Persistent Browser Storage & Mock State Service
 * Phase 1.2 & 1.10: State Hydration and Persistence
 */

import {
  INITIAL_USERS,
  INITIAL_PARKING_LOTS,
  INITIAL_REWARD_RULES,
  INITIAL_REWARD_CATALOG,
  INITIAL_SESSIONS,
  INITIAL_REWARD_LEDGER
} from '../data/mock-data.js';

const PREFIX = 'parkwise_';

export const storageService = {
  /**
   * Write serialized item to localStorage.
   */
  set(key, value) {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage Error] Could not write to localStorage:', e);
      return false;
    }
  },

  /**
   * Read item from localStorage with fallback.
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`${PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('[Storage Error] Could not read from localStorage:', e);
      return defaultValue;
    }
  },

  /**
   * Remove item from localStorage.
   */
  remove(key) {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
      return true;
    } catch (e) {
      console.warn('[Storage Error] Could not remove key:', e);
      return false;
    }
  },

  /**
   * Resets all demo data in localStorage back to original clean seed values.
   */
  resetToFactoryDefaults() {
    this.set('users', INITIAL_USERS);
    this.set('lots', INITIAL_PARKING_LOTS);
    this.set('reward_rules', INITIAL_REWARD_RULES);
    this.set('reward_catalog', INITIAL_REWARD_CATALOG);
    this.set('sessions', INITIAL_SESSIONS);
    this.set('reward_ledger', INITIAL_REWARD_LEDGER);
    console.log('[Storage] Initialized/Reset demo data state.');
  },

  /**
   * Ensures mock data collections are present; seeds if empty.
   */
  ensureHydrated() {
    if (!this.get('users')) this.set('users', INITIAL_USERS);
    if (!this.get('lots')) this.set('lots', INITIAL_PARKING_LOTS);
    if (!this.get('reward_rules')) this.set('reward_rules', INITIAL_REWARD_RULES);
    if (!this.get('reward_catalog')) this.set('reward_catalog', INITIAL_REWARD_CATALOG);
    if (!this.get('sessions')) this.set('sessions', INITIAL_SESSIONS);
    if (!this.get('reward_ledger')) this.set('reward_ledger', INITIAL_REWARD_LEDGER);
  }
};

// Automatically ensure localStorage is populated when module is imported
storageService.ensureHydrated();
