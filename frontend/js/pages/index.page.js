/**
 * PARKWISE - Index Landing & Portal Hub Controller
 * Phase 1.10: Portal Navigation & Evaluation Controls
 */

import { API_CONFIG } from '../api/api.js';
import { parkingApi } from '../api/parking.api.js';
import { authApi } from '../api/auth.api.js';
import { storageService } from '../services/storage.service.js';
import { showToast } from '../components/toast.component.js';
import { openModal, closeModal } from '../components/modal.component.js';

document.addEventListener('DOMContentLoaded', async () => {
  const initTimestampEl = document.getElementById('init-timestamp');
  const mockLotsCountEl = document.getElementById('mock-lots-count');
  const apiStatusEl = document.getElementById('api-status');
  const campusCapacityEl = document.getElementById('campus-capacity-status');

  if (initTimestampEl) {
    initTimestampEl.textContent = new Date().toLocaleTimeString();
  }

  if (apiStatusEl) {
    apiStatusEl.textContent = API_CONFIG.isMock ? 'Mock State (Phase 1 Complete)' : 'Live API Connected';
  }

  // Load live lots from storage
  const lotsRes = await parkingApi.getLots();
  const lots = lotsRes.data || [];
  const totalCapacity = lots.reduce((acc, l) => acc + l.totalCapacity, 0);
  const totalOccupied = lots.reduce((acc, l) => acc + l.occupiedSpaces, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);

  if (mockLotsCountEl) {
    mockLotsCountEl.textContent = `${lots.length} Campus Lots`;
  }

  if (campusCapacityEl) {
    campusCapacityEl.textContent = `${totalAvailable} / ${totalCapacity} Bays Open`;
  }

  // Quick Demo Student Login
  document.getElementById('quick-student-login-btn')?.addEventListener('click', async () => {
    const res = await authApi.login({
      email: 'alex.rivera@campus.edu',
      password: 'StudentPass123'
    });
    if (res.success) {
      showToast('Logged in as Student Alex Rivera', 'success');
      setTimeout(() => {
        window.location.href = './pages/student-dashboard.html';
      }, 400);
    }
  });

  // Quick Demo Admin Login
  document.getElementById('quick-admin-login-btn')?.addEventListener('click', async () => {
    const res = await authApi.login({
      email: 'admin@campus.edu',
      password: 'AdminPass123'
    });
    if (res.success) {
      showToast('Logged in as Campus Admin', 'success');
      setTimeout(() => {
        window.location.href = './pages/admin-dashboard.html';
      }, 400);
    }
  });

  // Reset Demo Data
  document.getElementById('portal-reset-data-btn')?.addEventListener('click', () => {
    const modalHtml = `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="text-warning font-semibold">Notice</div>
          <div>
            <h3 style="margin-bottom: var(--space-1); color: var(--color-danger);">Restore Clean Mock Data?</h3>
            <p class="text-muted" style="margin-bottom: 0; font-size: var(--font-size-sm);">
              This will restore all parking lots, active sessions, and student balances to factory mock defaults.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
          <button id="modal-portal-cancel-btn" class="btn btn-outline">Cancel</button>
          <button id="modal-portal-confirm-btn" class="btn btn-danger">Confirm Reset</button>
        </div>
      </div>
    `;

    openModal('Factory Reset Mock Data', modalHtml);

    document.getElementById('modal-portal-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-portal-confirm-btn')?.addEventListener('click', () => {
      closeModal();
      storageService.resetToFactoryDefaults();
      showToast('Restored all demo state to factory defaults!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  });

  console.log('[ParkWise] System initialized successfully. Phase 1 (1.1–1.10) active.');
});
