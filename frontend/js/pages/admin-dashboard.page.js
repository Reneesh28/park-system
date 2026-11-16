/**
 * PARKWISE - Admin Dashboard Controller
 * Enhanced with ParkSmart Visual & Interaction Reference:
 * Real-Time Campus Map, Simulation Controls (Enter/Exit), Capacity Management, and Live Feeds
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { storageService } from '../services/storage.service.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderAdminSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { renderAvailabilityBadge, renderSessionBadge } from '../components/badge.component.js';
import { openModal, closeModal } from '../components/modal.component.js';
import { showToast } from '../components/toast.component.js';
import { formatDateTime } from '../utils/formatters.js';
import { CampusMapController } from '../components/campus-map.component.js';

let allLots = [];
let allSessions = [];
let allUsers = [];
let allLedger = [];
let adminMapController = null;
let sessionFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard route: Admin role required
  const adminUser = authMiddleware.requireAuth({
    allowedRoles: ['admin'],
    redirectUrl: '../login.html',
    basePath: '../'
  });
  if (!adminUser) return;

  // 2. Render Shell
  const headerContainer = document.getElementById('navbar-container');
  if (headerContainer) {
    headerContainer.innerHTML = renderNavbar({ activePage: 'admin', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderAdminSidebar('admin-dashboard', '../');
    initSidebarEvents();
  }

  // 3. Bind Actions
  document.getElementById('reset-demo-data-btn')?.addEventListener('click', confirmResetDemoData);
  document.getElementById('sim-enter-btn')?.addEventListener('click', simulateBikeEntering);
  document.getElementById('sim-exit-btn')?.addEventListener('click', simulateBikeLeaving);

  // Bind Session Search
  const sessionSearchInput = document.getElementById('admin-session-search-input');
  if (sessionSearchInput) {
    sessionSearchInput.addEventListener('input', (e) => {
      sessionFilter = e.target.value.trim().toLowerCase();
      renderLiveSessionsTable();
    });
  }

  // 4. Initial Load
  await refreshAdminData();
});

async function refreshAdminData() {
  const lotsRes = await parkingApi.getLots();
  allLots = lotsRes.data || [];
  allSessions = storageService.get('sessions', []);
  allUsers = storageService.get('users', []);
  allLedger = storageService.get('reward_ledger', []);

  renderOverviewStats();
  renderLotsTable();
  renderLiveSessionsTable();

  // Initialize or update Admin Campus Map
  if (!adminMapController) {
    adminMapController = new CampusMapController({
      containerId: 'admin-campus-map-container',
      lots: allLots,
      selectedZone: 'A',
      onZoneSelect: (code) => {
        showToast(`Inspecting Lot ${code} capacity & utilization`, 'info');
      }
    });
  } else {
    adminMapController.updateLots(allLots);
  }
}

function renderOverviewStats() {
  const totalCapacity = allLots.reduce((acc, l) => acc + l.totalCapacity, 0);
  const totalOccupied = allLots.reduce((acc, l) => acc + l.occupiedSpaces, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
  const utilPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const activeSessionsCount = allSessions.filter((s) => s.status === 'active').length;
  const totalPointsDistributed = allLedger
    .filter((tx) => tx.type === 'earn')
    .reduce((sum, tx) => sum + (tx.points || 0), 0);

  document.getElementById('stat-admin-capacity').textContent = `${totalCapacity}`;
  document.getElementById('stat-admin-occupied').textContent = `${totalOccupied}`;
  document.getElementById('stat-admin-available').textContent = `${totalAvailable}`;

  const utilEl = document.getElementById('stat-admin-utilization');
  if (utilEl) {
    utilEl.textContent = `${utilPercent}%`;
  }

  document.getElementById('stat-admin-active-sessions').textContent = `${activeSessionsCount}`;
  document.getElementById('stat-admin-points-distributed').textContent = `${totalPointsDistributed} pts`;
}

function renderLotsTable() {
  const container = document.getElementById('admin-lots-table-container');
  if (!container) return;

  const rowsHtml = allLots.map((lot) => {
    const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
    const occPercent = Math.round((lot.occupiedSpaces / lot.totalCapacity) * 100);
    const availBadge = renderAvailabilityBadge(available, lot.totalCapacity, true);
    const statusBadge = lot.isActive !== false ? `<span class="badge badge-success">Active</span>` : `<span class="badge badge-secondary">Closed</span>`;

    let progressClass = 'progress-success';
    if (occPercent > 70) progressClass = 'progress-danger';
    else if (occPercent > 40) progressClass = 'progress-warning';

    return `
      <tr>
        <td>
          <span class="badge badge-secondary font-mono">Lot ${lot.lotCode}</span>
        </td>
        <td>
          <strong>${lot.lotName}</strong>
          <div class="text-muted" style="font-size: 11px;">${lot.location}</div>
        </td>
        <td>${statusBadge}</td>
        <td class="font-mono"><strong>${lot.totalCapacity}</strong></td>
        <td class="font-mono">${lot.occupiedSpaces}</td>
        <td class="font-mono text-success"><strong>${available}</strong></td>
        <td>
          <div style="min-width: 120px;">
            <div class="progress-bar-container" style="margin-bottom: 2px;">
              <div class="progress-bar ${progressClass}" style="width: ${occPercent}%;"></div>
            </div>
            <div class="text-muted font-mono" style="font-size: 10px; text-align: right;">${occPercent}%</div>
          </div>
        </td>
        <td>${availBadge}</td>
        <td>
          <button class="btn btn-outline btn-sm edit-lot-btn" data-lot-id="${lot.id}" style="font-size: 11px; padding: 3px 8px;">
            Edit Lot
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Code</th>
            <th>Lot Details</th>
            <th>Status</th>
            <th>Capacity</th>
            <th>Occupied</th>
            <th>Available</th>
            <th>Occupancy Rate</th>
            <th>Availability Pill</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  // Attach Edit handlers
  container.querySelectorAll('.edit-lot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lotId = btn.dataset.lotId;
      const lot = allLots.find((l) => l.id === lotId);
      if (lot) showEditLotModal(lot);
    });
  });
}

function showEditLotModal(lot) {
  const modalHtml = `
    <form id="edit-lot-form" class="flex flex-col gap-3">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" for="edit-lot-name">Parking Lot Name</label>
        <input type="text" id="edit-lot-name" class="form-input" value="${lot.lotName}" required>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" for="edit-lot-location">Campus Location</label>
        <input type="text" id="edit-lot-location" class="form-input" value="${lot.location}" required>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" for="edit-lot-capacity">
          Total Two-Wheeler Capacity (Min: ${lot.occupiedSpaces})
        </label>
        <input
          type="number"
          id="edit-lot-capacity"
          class="form-input font-mono"
          min="${lot.occupiedSpaces}"
          value="${lot.totalCapacity}"
          required
        >
        <div class="form-hint">
          Cannot set capacity below currently parked vehicles (${lot.occupiedSpaces} bikes parked).
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Operational Status</label>
        <label class="flex items-center gap-2" style="cursor: pointer; font-size: var(--font-size-sm);">
          <input type="checkbox" id="edit-lot-active" ${lot.isActive !== false ? 'checked' : ''}>
          <span>Lot is open for campus parking</span>
        </label>
      </div>

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button type="button" id="modal-cancel-edit-btn" class="btn btn-outline btn-sm">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save Changes</button>
      </div>
    </form>
  `;

  openModal(`Edit Parking Lot: ${lot.lotName}`, modalHtml);

  document.getElementById('modal-cancel-edit-btn')?.addEventListener('click', closeModal);

  document.getElementById('edit-lot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('edit-lot-name').value.trim();
    const location = document.getElementById('edit-lot-location').value.trim();
    const capacity = parseInt(document.getElementById('edit-lot-capacity').value, 10);
    const isActive = document.getElementById('edit-lot-active').checked;

    if (capacity < lot.occupiedSpaces) {
      showToast(`Capacity cannot be lower than current occupied count (${lot.occupiedSpaces})`, 'danger');
      return;
    }

    const res = await parkingApi.updateLot(lot.id, {
      lotName: name,
      location,
      totalCapacity: capacity,
      isActive
    });

    if (res.success) {
      closeModal();
      showToast(`Updated ${name} successfully!`, 'success');
      await refreshAdminData();
    } else {
      showToast(res.message || 'Update failed', 'danger');
    }
  });
}

function renderLiveSessionsTable() {
  const container = document.getElementById('admin-sessions-feed-container');
  if (!container) return;

  let filtered = allSessions;
  if (sessionFilter) {
    filtered = allSessions.filter((s) => {
      return (
        s.vehicleNumber.toLowerCase().includes(sessionFilter) ||
        s.lotName.toLowerCase().includes(sessionFilter) ||
        (s.lotCode && s.lotCode.toLowerCase().includes(sessionFilter))
      );
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">[Empty]</div>
        <div class="empty-state-title">No Campus Sessions Match</div>
        <div class="empty-state-text">No parking sessions match the current search filter.</div>
      </div>
    `;
    return;
  }

  const rowsHtml = filtered.slice(0, 12).map((sess) => {
    const user = allUsers.find((u) => u.id === sess.userId);
    const userName = user ? user.name : 'Student';
    const studentId = user ? user.studentId : '--';

    return `
      <tr>
        <td>
          <strong>${userName}</strong>
          <div class="text-muted font-mono" style="font-size: 10px;">${studentId}</div>
        </td>
        <td>
          <strong>${sess.lotName}</strong>
          ${sess.lotCode ? `<span class="badge badge-secondary font-mono" style="margin-left: 4px; font-size: 10px;">Lot ${sess.lotCode}</span>` : ''}
        </td>
        <td class="font-mono text-muted">${sess.vehicleNumber}</td>
        <td class="font-mono text-muted" style="font-size: 11px;">${formatDateTime(sess.entryTime)}</td>
        <td class="font-mono text-muted" style="font-size: 11px;">${sess.exitTime ? formatDateTime(sess.exitTime) : '<span class="text-teal font-semibold">Active</span>'}</td>
        <td>${renderSessionBadge(sess.status)}</td>
        <td>
          <span class="badge ${sess.pointsEarned > 0 ? 'badge-accent' : 'badge-secondary'}" style="font-size: 11px;">
            +${sess.pointsEarned} pts
          </span>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Student</th>
            <th>Parking Lot</th>
            <th>Vehicle Plate</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Status</th>
            <th>Reward</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Reference Feature: Simulation Triggers (Enter / Exit)
 */
async function simulateBikeEntering() {
  const lots = storageService.get('lots', []);
  const availableLots = lots.filter((l) => l.occupiedSpaces < l.totalCapacity && l.isActive !== false);

  if (availableLots.length === 0) {
    showToast('All campus parking lots are currently at 100% capacity!', 'warning');
    return;
  }

  // Pick a lot with lowest occupancy or random available
  const targetLot = availableLots[Math.floor(Math.random() * availableLots.length)];
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const randomPlate = `PB08${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}${Math.floor(1000 + Math.random() * 9000)}`;

  // Increment occupancy
  targetLot.occupiedSpaces += 1;
  const lotIdx = lots.findIndex((l) => l.id === targetLot.id);
  lots[lotIdx] = targetLot;
  storageService.set('lots', lots);

  // Add active session
  const sessions = storageService.get('sessions', []);
  const simSession = {
    id: `sess_sim_${Date.now()}`,
    userId: 'usr_sim',
    lotId: targetLot.id,
    lotName: targetLot.lotName,
    lotCode: targetLot.lotCode,
    vehicleNumber: randomPlate,
    entryTime: new Date().toISOString(),
    exitTime: null,
    status: 'active',
    pointsEarned: 0
  };
  sessions.unshift(simSession);
  storageService.set('sessions', sessions);

  showToast(`Simulated Entry: ${randomPlate} checked in to Lot ${targetLot.lotCode}.`, 'success');
  await refreshAdminData();
}

async function simulateBikeLeaving() {
  const sessions = storageService.get('sessions', []);
  const activeSessions = sessions.filter((s) => s.status === 'active');

  if (activeSessions.length === 0) {
    showToast('No active campus parking sessions to simulate exit for.', 'warning');
    return;
  }

  const sessionToExit = activeSessions[0];
  const lots = storageService.get('lots', []);
  const lot = lots.find((l) => l.id === sessionToExit.lotId);

  if (lot && lot.occupiedSpaces > 0) {
    lot.occupiedSpaces -= 1;
    storageService.set('lots', lots);
  }

  sessionToExit.status = 'completed';
  sessionToExit.exitTime = new Date().toISOString();
  sessionToExit.pointsEarned = 10;
  storageService.set('sessions', sessions);

  showToast(`Simulated Exit: ${sessionToExit.vehicleNumber} checked out from Lot ${sessionToExit.lotCode}.`, 'info');
  await refreshAdminData();
}

function confirmResetDemoData() {
  const modalHtml = `
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div class="text-warning font-semibold">Warning</div>
        <div>
          <h3 style="margin-bottom: 2px; color: var(--color-danger); font-size: 1.125rem;">Reset Demo State?</h3>
          <p class="text-muted" style="margin-bottom: 0; font-size: var(--font-size-xs);">
            This will restore all 3 campus lots (A: 100, B: 150, C: 80), reset vehicle occupancies, clear test sessions, and restore student balances to factory defaults.
          </p>
        </div>
      </div>

      <div class="alert alert-warning" style="font-size: 11px; margin-bottom: 0;">
        All test sessions and newly created vouchers in browser localStorage will be cleared.
      </div>

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button id="modal-cancel-reset-btn" class="btn btn-outline btn-sm">Cancel</button>
        <button id="modal-confirm-reset-btn" class="btn btn-danger btn-sm">
          Yes, Reset All Demo Data
        </button>
      </div>
    </div>
  `;

  openModal('Factory Reset Mock Data', modalHtml);

  document.getElementById('modal-cancel-reset-btn')?.addEventListener('click', closeModal);

  document.getElementById('modal-confirm-reset-btn')?.addEventListener('click', () => {
    closeModal();
    storageService.resetToFactoryDefaults();
    showToast('All demo data restored to factory defaults!', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  });
}
