/**
 * PARKWISE - Formatting Utilities
 * Phase 1.1: Project Initialization
 */

/**
 * Format ISO date string into readable local timestamp.
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format minutes or seconds into friendly duration string.
 * @param {number} totalMinutes 
 * @returns {string}
 */
export function formatDuration(totalMinutes) {
  if (typeof totalMinutes !== 'number' || totalMinutes < 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

/**
 * Format parking occupancy percentage.
 * @param {number} occupied 
 * @param {number} capacity 
 * @returns {string}
 */
export function formatOccupancyRate(occupied, capacity) {
  if (!capacity || capacity <= 0) return '0%';
  const rate = Math.round((occupied / capacity) * 100);
  return `${rate}%`;
}
