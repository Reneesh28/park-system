/**
 * PARKWISE - Student Dashboard Controller
 * Enhanced with ParkSmart Visual & Interaction Reference:
 * Interactive Campus Map, Circular Gauge, Zone Progress, and Live Session Sync
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { rewardsApi } from '../api/rewards.api.js';
import { recommendationService, ACADEMIC_DESTINATIONS } from '../services/recommendation.service.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { renderSessionBadge, renderAvailabilityBadge } from '../components/badge.component.js';
import { formatDateTime } from '../utils/formatters.js';
import { CampusMapController } from '../components/campus-map.component.js';
import { icon } from '../utils/icons.js';

let activeTimerInterval = null;
let campusMapInstance = null;
let currentLots = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard route: requires student or admin
  const user = authMiddleware.requireAuth({
    allowedRoles: ['student', 'admin'],
    redirectUrl: '../login.html',
    basePath: '../'
  });
  if (!user) return;

  // 2. Render App Shell
  const headerContainer = document.getElementById('navbar-container');
  if (headerContainer) {
    headerContainer.innerHTML = renderNavbar({ activePage: 'dashboard', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderStudentSidebar('home', '../');
    initSidebarEvents();
  }

  // 3. Welcome section
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-student-id').textContent = user.studentId;
  document.getElementById('current-date').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Set Stat icons using SVG
  const setIcon = (id, iconName) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(iconName, 18);
  };
  setIcon('stat-icon-total', 'parking');
  setIcon('stat-icon-available', 'check');
  setIcon('stat-icon-occupancy', 'grid');
  setIcon('stat-icon-reward', 'gift');

  // 4. Destination block selector setup
  const destSelect = document.getElementById('destination-select');
  if (destSelect) {
    destSelect.innerHTML = ACADEMIC_DESTINATIONS.map(
      (d) => `<option value="${d}">${d}</option>`
    ).join('');

    destSelect.addEventListener('change', () => {
      loadRecommendations(destSelect.value, currentLots);
      renderDashboardMapLotDetails(campusMapInstance?.selectedZone || 'A', destSelect.value);
    });
  }

  // 5. Initial data load
  await refreshDashboardData();
});

/**
 * Loads and refreshes all dashboard stats, sessions, map, and active timer.
 */
async function refreshDashboardData() {
  const user = authMiddleware.getUser();
  if (!user) return;

  // Fetch Lots, Active Session, and Summary in parallel
  const [lotsRes, activeRes, sessionsRes, rewardsRes] = await Promise.all([
    parkingApi.getLots(),
    parkingApi.getActiveSession(user.id),
    parkingApi.getUserSessions(user.id),
    rewardsApi.getSummary(user.id)
  ]);

  currentLots = lotsRes.data || [];
  const activeSession = activeRes.data;
  const sessions = sessionsRes.data || [];
  const rewardSummary = rewardsRes.data || {};

  // Compute Total Campus Available
  const totalCapacity = currentLots.reduce((acc, l) => acc + l.totalCapacity, 0);
  const totalOccupied = currentLots.reduce((acc, l) => acc + l.occupiedSpaces, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Update Stat Cards
  const totalCapEl = document.getElementById('stat-total-capacity');
  if (totalCapEl) totalCapEl.textContent = `${totalCapacity}`;

  document.getElementById('stat-available-spaces').textContent = `${totalAvailable}`;
  const availSub = document.getElementById('stat-available-sub');
  if (availSub) availSub.textContent = `${Math.round((totalAvailable / totalCapacity) * 100)}% available to park`;

  const occRateEl = document.getElementById('stat-occupancy-rate');
  if (occRateEl) occRateEl.textContent = `${occupancyPercent}%`;

  const rewardPointsEl = document.getElementById('stat-reward-points');
  if (rewardPointsEl) rewardPointsEl.textContent = `${rewardSummary.currentBalance ?? 0} pts`;

  // Hidden bridge fields for legacy tests
  const activeStatusBridge = document.getElementById('stat-active-session');
  if (activeStatusBridge) activeStatusBridge.textContent = activeSession ? 'Parked' : 'Not Parked';
  const totalSessBridge = document.getElementById('stat-total-sessions');
  if (totalSessBridge) totalSessBridge.textContent = `${sessions.length}`;

  // Update Circular Donut Gauge (Matching Reference)
  updateCircularGauge(occupancyPercent, totalOccupied, totalCapacity);

  // Update Zone-Wise Progress Bars (Matching Reference)
  updateZoneWiseBars(currentLots);

  // Render or Update Interactive Campus Map
  const activeLotCode = activeSession ? activeSession.lotCode : null;
  const initialZone = activeLotCode || 'A';
  const selectedDest = document.getElementById('destination-select')?.value || 'Engineering Hall';

  if (!campusMapInstance) {
    campusMapInstance = new CampusMapController({
      containerId: 'dashboard-campus-map-container',
      lots: currentLots,
      selectedZone: initialZone,
      activeLotCode,
      showRoute: !!activeSession,
      onZoneSelect: (code) => {
        renderDashboardMapLotDetails(code, document.getElementById('destination-select')?.value || 'Engineering Hall');
      }
    });
  } else {
    campusMapInstance.updateLots(currentLots, initialZone, activeLotCode);
  }

  // Populate Dashboard Map Lot Details Panel
  renderDashboardMapLotDetails(initialZone, selectedDest);

  // Render Active Parking Session Banner
  renderActiveSessionBanner(activeSession);

  // Render Recommendation Card
  loadRecommendations(selectedDest, currentLots);

  // Render Recent Activity List
  renderRecentActivity(sessions);
}

/**
 * Renders the compact Map Lot Details Card on the Dashboard
 */
function renderDashboardMapLotDetails(lotCode, destinationBlock = 'Engineering Hall') {
  const container = document.getElementById('dashboard-map-lot-details');
  if (!container || !currentLots || currentLots.length === 0) return;

  const lot = currentLots.find((l) => l.lotCode === lotCode) || currentLots[0];
  if (!lot) return;

  const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
  const availRatio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
  const occPercent = lot.totalCapacity > 0 ? Math.round((lot.occupiedSpaces / lot.totalCapacity) * 100) : 0;
  const distance = (lot.walkingDistances && lot.walkingDistances[destinationBlock]) || 350;
  const walkMinutes = Math.max(1, Math.round(distance / 80));
  const isUnderutilized = availRatio >= 0.6;

  let badgeColor = 'badge-success';
  let badgeText = 'High Availability';
  let barColor = 'bg-success';
  if (availRatio < 0.3) {
    badgeColor = 'badge-danger';
    badgeText = 'Almost Full';
    barColor = 'bg-danger';
  } else if (availRatio < 0.6) {
    badgeColor = 'badge-warning';
    badgeText = 'Moderate Occupancy';
    barColor = 'bg-warning';
  }

  container.innerHTML = `
    <div>
      <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
        <span class="badge badge-secondary font-mono" style="font-size: 11px;">Zone ${lot.lotCode}</span>
        <span class="badge ${badgeColor}" style="font-size: 11px;">${badgeText}</span>
      </div>

      <h4 style="margin-bottom: 2px; color: var(--color-primary);">${lot.lotName}</h4>
      <div class="text-muted" style="font-size: 11px; margin-bottom: var(--space-3);">
        Location: <strong>${lot.location}</strong>
      </div>

      <!-- Capacity Progress -->
      <div style="margin-bottom: var(--space-3);">
        <div class="flex justify-between items-center text-xs" style="margin-bottom: 2px;">
          <span class="text-muted">Available Bays:</span>
          <strong>${available} / ${lot.totalCapacity}</strong>
        </div>
        <div class="progress-bar-container" style="height: 6px;">
          <div class="progress-bar ${barColor}" style="width: ${occPercent}%;"></div>
        </div>
      </div>

      <div class="card" style="padding: 6px 10px; background: #f8fafc; border: 1px solid var(--color-border); margin-bottom: var(--space-3); font-size: 11px;">
        <span class="text-muted">Distance to ${destinationBlock}:</span>
        <div class="font-semibold text-navy" style="margin-top: 2px;">
          ${distance}m (~${walkMinutes} min walk)
        </div>
        ${isUnderutilized ? '<div style="color: #0F9D9A; font-weight: 600; font-size: 10px; margin-top: 2px;">+20 Bonus Points eligible</div>' : ''}
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <a href="./scan-parking.html?lotId=${lot.id}" class="btn btn-primary btn-sm w-full text-center">
        Scan QR to Park in Lot ${lot.lotCode} &rarr;
      </a>
      <a href="./campus-map.html?lot=${lot.lotCode}" class="btn btn-outline btn-sm w-full text-center" style="font-size: 11px;">
        View on Full Campus Map
      </a>
    </div>
  `;
}

/**
 * Updates Circular SVG Donut Occupancy Gauge
 */
function updateCircularGauge(percent, occupied, total) {
  const ring = document.getElementById('donut-progress-ring');
  const text = document.getElementById('donut-percent-text');
  const details = document.getElementById('donut-details-text');

  if (ring && text) {
    const circumference = 2 * Math.PI * 52; // ~326.7
    const offset = circumference * (1 - percent / 100);
    ring.style.strokeDashoffset = offset;
    text.textContent = `${percent}%`;

    // Semantic color for ring
    if (percent > 85) ring.setAttribute('stroke', '#dc2626');
    else if (percent > 65) ring.setAttribute('stroke', '#f59e0b');
    else ring.setAttribute('stroke', '#0F9D9A');
  }

  if (details) {
    details.textContent = `${occupied} of ${total} campus slots occupied`;
  }
}

/**
 * Updates Zone-Wise Progress Bars (Matching Reference)
 */
function updateZoneWiseBars(lots) {
  const container = document.getElementById('zonewise-bars-container');
  if (!container) return;

  container.innerHTML = lots.map((lot) => {
    const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
    const occPercent = Math.round((lot.occupiedSpaces / lot.totalCapacity) * 100);
    const availRatio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;

    let barColor = '#16a34a'; // Green
    if (availRatio < 0.3) barColor = '#dc2626'; // Red
    else if (availRatio < 0.6) barColor = '#f59e0b'; // Amber

    return `
      <div>
        <div class="flex items-center justify-between text-xs" style="margin-bottom: 4px;">
          <span class="font-semibold text-navy">Lot ${lot.lotCode} &ndash; ${lot.lotName}</span>
          <span class="font-mono text-muted"><strong>${available} free</strong> / ${lot.totalCapacity} bays (${occPercent}% full)</span>
        </div>
        <div style="height: 10px; width: 100%; background: #f1f5f9; border-radius: 9999px; overflow: hidden;">
          <div style="height: 100%; width: ${occPercent}%; background: ${barColor}; border-radius: 9999px; transition: width 400ms ease;"></div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Handles prominent active parking session banner with live timer.
 */
function renderActiveSessionBanner(activeSession) {
  const banner = document.getElementById('active-session-banner');
  if (!banner) return;

  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }

  if (!activeSession) {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'flex';
  banner.innerHTML = `
    <div style="flex: 1;">
      <div class="flex items-center gap-2" style="margin-bottom: 6px;">
        <span class="badge badge-info" style="font-weight: 700; font-size: 11px;">
          ● ACTIVE BIKE SESSION
        </span>
        <span class="badge badge-secondary font-mono" style="font-size: 11px;">
          Lot ${activeSession.lotCode}
        </span>
      </div>
      <h3 style="margin-bottom: 4px; color: #1e40af;">Parked in ${activeSession.lotName}</h3>
      <div style="font-size: var(--font-size-xs); color: #334155; margin-bottom: 8px;">
        Vehicle: <strong class="font-mono">${activeSession.vehicleNumber}</strong> &bull; Checked in at ${formatDateTime(activeSession.entryTime)}
      </div>
      <div class="session-timer-display" id="live-session-timer">00:00:00</div>
    </div>
    <div class="flex flex-col gap-2 shrink-0">
      <button id="checkout-banner-btn" class="btn btn-secondary btn-lg" style="box-shadow: var(--shadow-md);">
        ${icon('check', 16)}
        <span>Check Out Now</span>
      </button>
      <a href="./find-vehicle.html" class="btn btn-outline" style="text-align: center; font-size: var(--font-size-xs);">
        ${icon('search', 14)}
        <span>View Route &amp; Details</span>
      </a>
    </div>
  `;

  // Start live timer
  const startTime = new Date(activeSession.entryTime).getTime();
  const timerEl = document.getElementById('live-session-timer');

  const updateTimer = () => {
    const elapsedMs = Math.max(0, Date.now() - startTime);
    const secs = Math.floor((elapsedMs / 1000) % 60).toString().padStart(2, '0');
    const mins = Math.floor((elapsedMs / 60000) % 60).toString().padStart(2, '0');
    const hrs = Math.floor(elapsedMs / 3600000).toString().padStart(2, '0');
    if (timerEl) {
      timerEl.textContent = `${hrs}:${mins}:${secs}`;
    }
  };

  updateTimer();
  activeTimerInterval = setInterval(updateTimer, 1000);

  // Bind Checkout Action
  document.getElementById('checkout-banner-btn')?.addEventListener('click', () => {
    window.location.href = './scan-parking.html?autoCheckout=true';
  });
}

/**
 * Loads recommendation and renders the recommendation card.
 */
async function loadRecommendations(destinationBlock, cachedLots = null) {
  let lots = cachedLots;
  if (!lots || lots.length === 0) {
    const lotsRes = await parkingApi.getLots();
    lots = lotsRes.data || [];
  }

  const ranked = recommendationService.rankLots(lots, destinationBlock);
  const topLot = ranked.find((l) => l.isRecommended) || ranked[0];

  const container = document.getElementById('recommendation-card-container');
  if (!container || !topLot) return;

  const availabilityBadge = renderAvailabilityBadge(topLot.availableSpaces, topLot.totalCapacity);

  container.innerHTML = `
    <div class="card recommendation-hero-card" style="padding: var(--space-4);">
      <div class="recommendation-badge-corner">
        Top Choice
      </div>
      <div>
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
          <div class="flex items-center gap-2">
            <span class="badge badge-secondary font-mono">Lot ${topLot.lotCode}</span>
            <h3 style="margin-bottom: 0; font-size: var(--font-size-md);">${topLot.lotName}</h3>
          </div>
          ${availabilityBadge}
        </div>
        <p class="text-muted" style="margin-bottom: var(--space-3); font-size: var(--font-size-xs);">
          ${topLot.location} &bull; <strong>${topLot.distanceMeters}m</strong> to ${destinationBlock} (~${topLot.walkingMinutes} min walk)
        </p>

        <!-- Occupancy Bar -->
        <div class="progress-bar-container" style="margin-bottom: 4px;">
          <div
            class="progress-bar ${topLot.availabilityRatio >= 0.6 ? 'progress-success' : (topLot.availabilityRatio >= 0.3 ? 'progress-warning' : 'progress-danger')}"
            style="width: ${Math.round(topLot.occupancyRatio * 100)}%;"
          ></div>
        </div>
        <div class="flex items-center justify-between font-mono text-muted" style="font-size: 11px; margin-bottom: var(--space-3);">
          <span>Occupied: ${topLot.occupiedSpaces} / ${topLot.totalCapacity}</span>
          <span><strong style="color: var(--color-success);">${topLot.availableSpaces} open bays</strong></span>
        </div>

        <div class="alert alert-success" style="padding: 0.5rem 0.75rem; font-size: var(--font-size-xs); margin-bottom: var(--space-3); border-radius: var(--radius-md);">
          <span style="font-weight: 700; color: var(--color-teal);">[TIP]</span>
          <div>
            <strong>Why Recommended:</strong> ${topLot.recommendationReason}
          </div>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span class="badge" style="background: #fdfaf6; border: 1px dashed #f59e0b; color: #b45309; font-weight: 600;">
              +${topLot.potentialPoints} Points Eligible
            </span>
          </div>
          <div class="flex gap-2">
            <a href="./scan-parking.html?lotId=${topLot.id}" class="btn btn-primary btn-sm">
              Check In via QR
            </a>
            <a href="./parking-lots.html" class="btn btn-outline btn-sm">
              All Lots &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the recent parking activity table.
 */
function renderRecentActivity(sessions) {
  const container = document.getElementById('recent-activity-container');
  if (!container) return;

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">[No Lots Found]</div>
        <div class="empty-state-title">No Parking Activity Yet</div>
        <div class="empty-state-text">Your completed parking sessions and reward points will appear here.</div>
        <a href="./scan-parking.html" class="btn btn-primary btn-sm">Scan QR to Start First Session</a>
      </div>
    `;
    return;
  }

  const rowsHtml = sessions.slice(0, 5).map((sess) => {
    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <span style="color: ${sess.status === 'active' ? '#2563eb' : '#94a3b8'};">
              ${icon('bike', 16)}
            </span>
            <strong>${sess.vehicleNumber}</strong>
          </div>
        </td>
        <td>
          <strong>${sess.lotName}</strong>
          ${sess.lotCode ? `<span class="badge badge-secondary font-mono" style="margin-left: 4px; font-size: 10px;">Lot ${sess.lotCode}</span>` : ''}
        </td>
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
            <th>Vehicle Plate</th>
            <th>Parking Zone</th>
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
