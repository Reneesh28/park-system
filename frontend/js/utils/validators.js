/**
 * PARKWISE - Input Validation Utilities
 * Phase 1.1: Project Initialization
 */

/**
 * Validates campus email format.
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength (minimum 8 characters, at least 1 digit).
 * @param {string} password 
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8 && /\d/.test(password);
}

/**
 * Validates vehicle license plate format.
 * @param {string} plate 
 * @returns {boolean}
 */
export function isValidPlateNumber(plate) {
  if (!plate || typeof plate !== 'string') return false;
  return plate.trim().length >= 3;
}
