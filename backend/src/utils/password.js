/**
 * PARKWISE - Password Utility Functions
 * Phase 2.3: User Registration and Login API Development
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 * @param {string} plaintext - Plaintext password to hash
 * @returns {Promise<string>} - The resulting bcrypt hash
 */
export async function hashPassword(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a stored bcrypt hash.
 * @param {string} plaintext - Plaintext password input
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} - True if matching, false otherwise
 */
export async function comparePassword(plaintext, hash) {
  if (!plaintext || !hash) {
    return false;
  }
  return bcrypt.compare(plaintext, hash);
}
