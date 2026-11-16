/**
 * PARKWISE - Status & Availability Badge Component
 * Visual Reference: ParkSmart Availability Badges (Emerald, Amber, Red)
 */

/**
 * Returns HTML string for parking lot availability status pill.
 * @param {number} available 
 * @param {number} total 
 * @param {boolean} [concise=false]
 * @returns {string} Badge HTML
 */
export function renderAvailabilityBadge(available, total, concise = false) {
  if (total <= 0) return '<span class="badge badge-secondary">Inactive</span>';
  if (available <= 0) return '<span class="badge badge-danger">● Parking Full</span>';

  const ratio = available / total;
  const percentage = Math.round(ratio * 100);

  if (ratio >= 0.6) {
    return `<span class="badge badge-success">● ${concise ? 'Available' : 'Parking available'} (${percentage}% free)</span>`;
  }
  if (ratio >= 0.3) {
    return `<span class="badge badge-warning">● ${concise ? 'Limited' : 'Limited availability'} (${percentage}% free)</span>`;
  }
  return `<span class="badge badge-danger">● ${concise ? 'Full' : 'Parking full'} (${percentage}% free)</span>`;
}

/**
 * Returns HTML string for session status.
 * @param {'active'|'completed'} status 
 * @returns {string}
 */
export function renderSessionBadge(status) {
  if (status === 'active') {
    return '<span class="badge badge-info" style="font-weight:700;">● Active Session</span>';
  }
  return '<span class="badge badge-secondary">Completed</span>';
}
