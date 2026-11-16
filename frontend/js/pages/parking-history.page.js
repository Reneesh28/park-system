/**
 * PARKWISE - Parking History Controller
 * Visual Reference: ParkSmart Parking History Table (Clean Slate Table, Icons, and Badges)
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { renderSessionBadge } from '../components/badge.component.js';
import { formatDateTime } from '../utils/formatters.js';
import { icon } from '../utils/icons.js';

let currentUser = null;
let allUserSessions = [];
let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = authMiddleware.requireAuth({
    allowedRoles: ['student', 'admin'],
    redirectUrl: '../login.html',
    basePath: '../'
  });
  if (!currentUser) return;

  // Render Shell
  const headerContainer = document.getElementById('navbar-container');
  if (headerContainer) {
    headerContainer.innerHTML = renderNavbar({ activePage: 'parking-history', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderStudentSidebar('history', '../');
    initSidebarEvents();
  }

  // Bind Filter Buttons
  document.querySelectorAll('.history-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.history-filter-btn').forEach((b) => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-outline');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-outline');
      activeFilter = btn.dataset.filter;
      renderHistoryTable();
    });
  });

  // Load Sessions
  await loadHistory();
});

async function loadHistory() {
  const res = await parkingApi.getUserSessions(currentUser.id);
  allUserSessions = res.data || [];

  renderSummaryStats();
  renderHistoryTable();
}

function renderSummaryStats() {
  const totalTrips = allUserSessions.length;
  const completedTrips = allUserSessions.filter((s) => s.status === 'completed').length;
  const activeTrips = allUserSessions.filter((s) => s.status === 'active').length;
  const totalPoints = allUserSessions.reduce((acc, s) => acc + (s.pointsEarned || 0), 0);

  document.getElementById('stat-history-total').textContent = `${totalTrips}`;
  document.getElementById('stat-history-completed').textContent = `${completedTrips}`;
  document.getElementById('stat-history-active').textContent = `${activeTrips}`;
  document.getElementById('stat-history-points').textContent = `${totalPoints} pts`;
}

function renderHistoryTable() {
  const container = document.getElementById('parking-history-table-container');
  if (!container) return;

  let filtered = allUserSessions;
  if (activeFilter === 'completed') {
    filtered = allUserSessions.filter((s) => s.status === 'completed');
  } else if (activeFilter === 'active') {
    filtered = allUserSessions.filter((s) => s.status === 'active');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">[No History Records]</div>
        <div class="empty-state-title">No Parking Records Found</div>
        <div class="empty-state-text">No parking sessions match the current filter selection.</div>
      </div>
    `;
    return;
  }

  const rowsHtml = filtered.map((sess) => {
    let durationDisplay = 'Ongoing';
    if (sess.exitTime) {
      const start = new Date(sess.entryTime).getTime();
      const end = new Date(sess.exitTime).getTime();
      const mins = Math.max(1, Math.round((end - start) / 60000));
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      durationDisplay = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
    }

    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <span style="color: ${sess.status === 'active' ? '#2563eb' : '#94a3b8'};">
              ${icon('bike', 15)}
            </span>
            <strong class="font-mono text-navy">${sess.vehicleNumber}</strong>
          </div>
        </td>
        <td>
          <strong>${sess.lotName}</strong>
          ${sess.lotCode ? `<span class="badge badge-secondary font-mono" style="margin-left: 4px; font-size: 10px;">Lot ${sess.lotCode}</span>` : ''}
        </td>
        <td class="font-mono text-muted" style="font-size: 11px;">${formatDateTime(sess.entryTime)}</td>
        <td class="font-mono text-muted" style="font-size: 11px;">${sess.exitTime ? formatDateTime(sess.exitTime) : '<span class="text-teal font-semibold">Active</span>'}</td>
        <td class="font-mono text-muted" style="font-size: 11px;">${durationDisplay}</td>
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
            <th>Vehicle Plate</th>
            <th>Parking Zone</th>
            <th>Parked At</th>
            <th>Collected At</th>
            <th>Duration</th>
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
