/**
 * PARKWISE - Modal Dialog Component
 * Visual Reference: ParkSmart Modal (slate-900/50 backdrop, rounded-xl white dialog, navy title)
 */

import { icon } from '../utils/icons.js';

let activeModal = null;

/**
 * Open a standardized interactive modal dialog.
 * Supports either openModal('Title', htmlContent) or openModal({ title, content, ... }).
 */
export function openModal(titleOrOptions = '', maybeContent = '') {
  closeModal();

  let title = '';
  let content = '';
  let confirmText = '';
  let cancelText = '';
  let onConfirm = null;
  let confirmStyle = 'primary';

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title || '';
    content = titleOrOptions.content || '';
    confirmText = titleOrOptions.confirmText || '';
    cancelText = titleOrOptions.cancelText || '';
    onConfirm = titleOrOptions.onConfirm || null;
    confirmStyle = titleOrOptions.confirmStyle || 'primary';
  } else {
    title = titleOrOptions;
    content = maybeContent;
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  const confirmBtnHtml = confirmText
    ? `<button class="btn btn-${confirmStyle}" id="modal-confirm-btn">${confirmText}</button>`
    : '';

  const footerHtml = (confirmText || cancelText)
    ? `
      <div class="modal-footer flex items-center justify-end gap-2" style="margin-top: 1.25rem;">
        ${cancelText ? `<button class="btn btn-outline" id="modal-cancel-btn">${cancelText}</button>` : ''}
        ${confirmBtnHtml}
      </div>
    `
    : '';

  backdrop.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 style="color: var(--color-primary); font-size: 1.125rem; font-weight: 700; margin: 0;">${title}</h3>
        <button class="modal-close btn btn-outline btn-sm" aria-label="Close dialog" style="padding: 4px; border-radius: 6px; border: none; background: transparent; color: #64748b; cursor: pointer;">
          ${icon('x', 18)}
        </button>
      </div>
      <div class="modal-body" style="font-size: var(--font-size-sm); color: var(--color-text-main); margin-top: 0.5rem;">
        ${content}
      </div>
      ${footerHtml}
    </div>
  `;

  document.body.appendChild(backdrop);
  activeModal = backdrop;

  const closeFn = () => closeModal();

  backdrop.querySelector('.modal-close')?.addEventListener('click', closeFn);
  backdrop.querySelector('#modal-cancel-btn')?.addEventListener('click', closeFn);

  // Close on backdrop click outside dialog
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeFn();
  });

  // Confirm button handler
  if (confirmText && onConfirm) {
    const confirmBtn = backdrop.querySelector('#modal-confirm-btn');
    confirmBtn?.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processing...';
      try {
        await onConfirm();
        closeModal();
      } catch (err) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = confirmText;
      }
    });
  }

  // Escape key handler
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/**
 * Closes the currently active modal.
 */
export function closeModal() {
  if (activeModal && activeModal.parentNode) {
    activeModal.parentNode.removeChild(activeModal);
    activeModal = null;
  }
}
