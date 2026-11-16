/**
 * PARKWISE - Toast Notification System
 * Visual Reference: ParkSmart Top-Right Floating Pill Toast
 */

import { icon } from '../utils/icons.js';

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
}

/**
 * Surface a lightweight toast message to the user.
 * @param {string} message - Text notification
 * @param {'success'|'danger'|'error'|'warning'|'info'} [type='info']
 * @param {number} [durationMs=3500]
 */
export function showToast(message, type = 'info', durationMs = 3500) {
  ensureToastContainer();

  const toast = document.createElement('div');
  const normalizedType = type === 'error' ? 'danger' : type;
  toast.className = `toast toast-${normalizedType === 'danger' ? 'error' : normalizedType}`;
  toast.setAttribute('role', 'status');

  const isError = normalizedType === 'danger';
  const isWarning = normalizedType === 'warning';
  const iconName = isError || isWarning ? 'alert' : 'check';

  toast.innerHTML = `
    <span style="display:flex; align-items:center; flex-shrink:0;">
      ${icon(iconName, 16)}
    </span>
    <span style="flex: 1; font-size: var(--font-size-sm);">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }, durationMs);
}
