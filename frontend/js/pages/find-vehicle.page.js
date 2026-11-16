/**
 * PARKWISE - Find Vehicle Controller
 * Visual Reference: ParkSmart "Find My Bike" & "Locate" Page
 * Displays "BIKE FOUND!" banner, live timer, SVG campus walking route, and checkout trigger.
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { storageService } from '../services/storage.service.js';
import { recommendationService, ACADEMIC_DESTINATIONS } from '../services/recommendation.service.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { formatDateTime } from '../utils/formatters.js';
import { CampusMapController } from '../components/campus-map.component.js';
import { showToast } from '../components/toast.component.js';
import { icon } from '../utils/icons.js';

let currentUser = null;
let liveTimerInterval = null;
let allLots = [];
let locatorMapInstance = null;

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
    headerContainer.innerHTML = renderNavbar({ activePage: 'find-vehicle', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderStudentSidebar('my-parking', '../');
    initSidebarEvents();
  }

  // Fetch Lots
  const lotsRes = await parkingApi.getLots();
  allLots = lotsRes.data || [];

  // Bind Search Form
  const searchForm = document.getElementById('vehicle-search-form');
  const searchInput = document.getElementById('vehicle-search-input');
  const clearBtn = document.getElementById('vehicle-search-clear-btn');
  const errorEl = document.getElementById('vehicle-search-error');

  const performSearch = (plate) => {
    const query = (plate || '').trim().toUpperCase();
    if (!query) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a vehicle registration number to search.';
        errorEl.style.display = 'block';
      }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    // Search active sessions across storage
    const sessions = storageService.get('sessions', []);
    const match = sessions.find(
      (s) => s.status === 'active' && s.vehicleNumber.replace(/[\s-]/g, '').toUpperCase() === query.replace(/[\s-]/g, '').toUpperCase()
    );

    if (match) {
      renderFoundVehicle(match);
      showToast(`Vehicle ${match.vehicleNumber} located in Lot ${match.lotCode}!`, 'success');
    } else {
      renderNotFound(query);
    }
  };

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch(searchInput.value);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      if (errorEl) errorEl.style.display = 'none';
      loadDefaultUserVehicle();
    });
  }

  // Check URL query param 'q'
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  if (qParam) {
    searchInput.value = qParam;
    performSearch(qParam);
  } else {
    // Default: load current user's active session
    await loadDefaultUserVehicle();
  }
});

async function loadDefaultUserVehicle() {
  const res = await parkingApi.getActiveSession(currentUser.id);
  const activeSession = res.data;

  if (activeSession) {
    const searchInput = document.getElementById('vehicle-search-input');
    if (searchInput) searchInput.value = activeSession.vehicleNumber;
    renderFoundVehicle(activeSession);
  } else {
    renderNoActiveSession();
  }
}

function renderFoundVehicle(session) {
  const container = document.getElementById('vehicle-locator-container');
  if (!container) return;

  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }

  const lot = allLots.find((l) => l.id === session.lotId || l.lotCode === session.lotCode) || {
    lotCode: session.lotCode || 'A',
    lotName: session.lotName || 'Campus Lot',
    location: 'University Campus'
  };

  const distancesHtml = ACADEMIC_DESTINATIONS.map((dest) => {
    const dist = recommendationService.getDistance(lot.lotCode, dest);
    const walkMin = Math.round(dist / 80);
    return `
      <div style="background: #ffffff; border: 1px solid var(--color-border); padding: 8px; border-radius: var(--radius-sm); text-align: center;">
        <div class="text-muted" style="font-size: 10px; margin-bottom: 2px;">${dest}</div>
        <div class="font-mono text-navy font-bold" style="font-size: 13px;">${dist}m</div>
        <div class="text-muted" style="font-size: 10px;">~${walkMin} min walk</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div>
      <!-- BIKE FOUND! Banner (Matching Reference Visual) -->
      <div class="mb-4 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 shadow-sm" style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2" style="font-size: 1.5rem; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px;">
              ${icon('check', 24)}
              <span>BIKE FOUND!</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 10px; font-size: var(--font-size-xs);">
              <div>
                <span class="text-muted" style="display: block; font-size: 11px;">Vehicle Number</span>
                <strong class="font-mono text-navy" style="font-size: 14px;">${session.vehicleNumber}</strong>
              </div>
              <div>
                <span class="text-muted" style="display: block; font-size: 11px;">Parking Zone</span>
                <strong class="text-navy" style="font-size: 14px;">Lot ${session.lotCode} &ndash; ${session.lotName}</strong>
              </div>
              <div>
                <span class="text-muted" style="display: block; font-size: 11px;">Status</span>
                <span class="badge badge-success" style="font-size: 10px;">● Parked</span>
              </div>
              <div>
                <span class="text-muted" style="display: block; font-size: 11px;">Parked Duration</span>
                <strong id="live-locator-timer" class="font-mono text-primary" style="font-size: 14px;">00:00:00</strong>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 shrink-0">
            <button id="locator-checkout-btn" class="btn btn-secondary btn-sm" style="padding: 6px 12px;">
              ${icon('check', 14)}
              <span>I've Collected My Bike</span>
            </button>
            <a href="./scan-parking.html?autoCheckout=true" class="btn btn-outline btn-sm" style="padding: 6px 10px;">
              ${icon('qr', 14)}
              <span>Scan Out</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Campus Map Route & Destination Guide -->
      <div class="grid grid-cols-2 gap-4" style="margin-bottom: var(--space-4);">
        <!-- Map Card -->
        <div class="card" style="padding: var(--space-3);">
          <div class="font-semibold text-navy flex items-center justify-between" style="font-size: var(--font-size-xs); margin-bottom: 6px;">
            <span>Illustrative Walking Route</span>
            <span class="badge badge-info" style="font-size: 10px;">Dashed line to Lot ${lot.lotCode}</span>
          </div>
          <div id="locator-campus-map-container">
            <!-- Injected by campus-map.component.js -->
          </div>
        </div>

        <!-- Walking Distances Card -->
        <div class="card" style="padding: var(--space-3); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="font-semibold text-navy" style="font-size: var(--font-size-xs); margin-bottom: 4px;">
              Walking Distance from Lot ${lot.lotCode} to Campus Buildings
            </div>
            <p class="text-muted" style="font-size: 11px; margin-bottom: var(--space-3);">
              Estimated pedestrian transit times calculated at ~80m/min.
            </p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
              ${distancesHtml}
            </div>
          </div>

          <div class="alert alert-info" style="margin-top: 12px; margin-bottom: 0; padding: 6px 10px; font-size: 11px;">
            Lot Location: <strong>${lot.location}</strong>. When you leave campus, scan any QR sign or click &ldquo;I've Collected My Bike&rdquo; to collect reward points.
          </div>
        </div>
      </div>
    </div>
  `;

  // Start live timer
  const startTime = new Date(session.entryTime).getTime();
  const timerEl = document.getElementById('live-locator-timer');

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
  liveTimerInterval = setInterval(updateTimer, 1000);

  // Initialize Map with active session route
  locatorMapInstance = new CampusMapController({
    containerId: 'locator-campus-map-container',
    lots: allLots,
    selectedZone: lot.lotCode,
    activeLotCode: lot.lotCode,
    showRoute: true
  });

  // Bind "I've Collected My Bike" checkout button
  document.getElementById('locator-checkout-btn')?.addEventListener('click', () => {
    window.location.href = './scan-parking.html?autoCheckout=true';
  });
}

function renderNoActiveSession() {
  const container = document.getElementById('vehicle-locator-container');
  if (!container) return;

  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }

  container.innerHTML = `
    <div class="card" style="padding: var(--space-8); text-align: center;">
      <div class="empty-state-icon">[No Active Session]</div>
      <h3 style="color: var(--color-primary); margin-bottom: var(--space-1);">No Vehicle Currently Parked</h3>
      <p class="text-muted" style="max-width: 440px; margin: 0 auto var(--space-4); font-size: var(--font-size-xs);">
        You do not have an active parking session recorded on campus right now. Check into any two-wheeler lot via QR code to track your location and live duration.
      </p>
      <div class="flex justify-center gap-2">
        <a href="./scan-parking.html" class="btn btn-primary btn-sm">
          Scan QR to Park
        </a>
        <a href="./parking-lots.html" class="btn btn-outline btn-sm">
          View Campus Lots
        </a>
      </div>
    </div>
  `;
}

function renderNotFound(plate) {
  const container = document.getElementById('vehicle-locator-container');
  if (!container) return;

  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }

  container.innerHTML = `
    <div class="card" style="padding: var(--space-6); text-align: center;">
      <div class="empty-state-icon">[Search Vehicle]</div>
      <h3 style="color: var(--color-danger); margin-bottom: var(--space-1);">Vehicle Not Found</h3>
      <p class="text-muted" style="max-width: 420px; margin: 0 auto var(--space-3); font-size: var(--font-size-xs);">
        No active parking session was found matching vehicle plate <strong>"${plate}"</strong>. The vehicle may have already checked out or has not checked in yet today.
      </p>
      <button id="retry-search-btn" class="btn btn-outline btn-sm">
        Back to Active Session
      </button>
    </div>
  `;

  document.getElementById('retry-search-btn')?.addEventListener('click', loadDefaultUserVehicle);
}
