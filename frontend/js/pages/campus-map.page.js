/**
 * PARKWISE - Dedicated Interactive Campus Map Page Controller
 * Prominent visual navigation and detailed zone inspection
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { CampusMapController } from '../components/campus-map.component.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, renderAdminSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { ACADEMIC_DESTINATIONS } from '../services/recommendation.service.js';
import { showToast } from '../components/toast.component.js';
import { openModal, closeModal } from '../components/modal.component.js';
import { icon } from '../utils/icons.js';

let currentUser = null;
let allLots = [];
let activeSession = null;
let currentDestination = 'Engineering Hall';
let selectedLotCode = 'A';
let mapController = null;

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
    headerContainer.innerHTML = renderNavbar({ activePage: 'campus-map', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    if (currentUser.role === 'admin') {
      sidebarContainer.innerHTML = renderAdminSidebar('campus-map', '../');
    } else {
      sidebarContainer.innerHTML = renderStudentSidebar('campus-map', '../');
    }
    initSidebarEvents();
  }

  // Populate Destination Selector
  const destSelect = document.getElementById('map-destination-select');
  if (destSelect) {
    destSelect.innerHTML = ACADEMIC_DESTINATIONS.map((d) => `
      <option value="${d}" ${d === currentDestination ? 'selected' : ''}>${d}</option>
    `).join('');

    destSelect.addEventListener('change', (e) => {
      currentDestination = e.target.value;
      renderLotDetails();
      renderSummaryTable();
    });
  }

  // Fetch initial data
  const [lotsRes, activeRes] = await Promise.all([
    parkingApi.getLots(),
    parkingApi.getActiveSession(currentUser.id)
  ]);

  allLots = lotsRes.data || [];
  activeSession = activeRes.data;

  // Check URL params for preselected lot
  const urlParams = new URLSearchParams(window.location.search);
  const paramLotCode = urlParams.get('lot');
  if (paramLotCode && ['A', 'B', 'C'].includes(paramLotCode.toUpperCase())) {
    selectedLotCode = paramLotCode.toUpperCase();
  }

  // Initialize Interactive Map Controller
  mapController = new CampusMapController({
    containerId: 'full-campus-map-container',
    lots: allLots,
    selectedZone: selectedLotCode,
    activeLotCode: activeSession ? activeSession.lotCode : null,
    onZoneSelect: (zoneCode) => {
      selectedLotCode = zoneCode;
      renderLotDetails();
      renderSummaryTable();
    }
  });

  renderLotDetails();
  renderSummaryTable();
});

function renderLotDetails() {
  const panel = document.getElementById('map-lot-details-card');
  if (!panel) return;

  const lot = allLots.find((l) => l.lotCode === selectedLotCode) || allLots[0];
  if (!lot) return;

  const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
  const availRatio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
  const occPercent = lot.totalCapacity > 0 ? Math.round((lot.occupiedSpaces / lot.totalCapacity) * 100) : 0;
  const distance = (lot.walkingDistances && lot.walkingDistances[currentDestination]) || 350;
  const walkMinutes = Math.max(1, Math.round(distance / 80));
  const isUnderutilized = availRatio >= 0.6;
  const bonusPoints = isUnderutilized ? 20 : 10;
  const isParkedHere = activeSession && activeSession.lotId === lot.id;

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

  panel.innerHTML = `
    <div>
      <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
        <span class="badge badge-secondary font-mono" style="font-size: 11px;">Zone ${lot.lotCode}</span>
        <span class="badge ${badgeColor}" style="font-size: 11px;">${badgeText}</span>
      </div>

      <h3 style="color: var(--color-primary); margin-bottom: 2px;">${lot.lotName}</h3>
      <div class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--space-4);">
        Campus Location: <strong>${lot.location}</strong>
      </div>

      <!-- Capacity Progress -->
      <div style="margin-bottom: var(--space-4);">
        <div class="flex justify-between items-center text-xs" style="margin-bottom: 4px;">
          <span class="text-muted">Available Bays:</span>
          <strong>${available} of ${lot.totalCapacity} open</strong>
        </div>
        <div class="progress-bar-container" style="height: 8px;">
          <div class="progress-bar ${barColor}" style="width: ${occPercent}%;"></div>
        </div>
        <div class="flex justify-between text-xs text-muted" style="margin-top: 4px; font-size: 10px;">
          <span>0 (Empty)</span>
          <span>${occPercent}% Occupied</span>
          <span>${lot.totalCapacity} (Full)</span>
        </div>
      </div>

      <!-- Walking Distance Stat -->
      <div class="card" style="padding: var(--space-3); background: #f8fafc; border: 1px solid var(--color-border); margin-bottom: var(--space-4);">
        <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: 2px;">
          Distance to ${currentDestination}:
        </div>
        <div class="font-semibold text-navy" style="font-size: var(--font-size-sm);">
          ${distance} meters &bull; ~${walkMinutes} min walk
        </div>
        <div style="font-size: 10px; color: #0F9D9A; margin-top: 2px;">
          ${isUnderutilized ? 'Underutilised Zone: +20 Bonus Points eligible' : 'Standard Check-In: +10 Points eligible'}
        </div>
      </div>

      <!-- Permanent QR Identifier -->
      <div class="flex items-center justify-between" style="font-size: 11px; padding: 6px 10px; background: #f1f5f9; border-radius: var(--radius-md); margin-bottom: var(--space-4);">
        <span class="text-muted font-mono">QR Sign ID:</span>
        <strong class="font-mono text-primary">${lot.qrCode}</strong>
      </div>
    </div>

    <div class="flex flex-col gap-2" style="margin-top: var(--space-4);">
      ${isParkedHere
        ? `
          <a href="./scan-parking.html" class="btn btn-accent w-full text-center">
            Scan QR to Check Out
          </a>
        `
        : `
          <a href="./scan-parking.html?lotId=${lot.id}" class="btn btn-primary w-full text-center">
            Proceed to Park (Scan QR) &rarr;
          </a>
        `
      }
      <button type="button" id="view-lot-qr-modal-btn" class="btn btn-outline btn-sm w-full text-center">
        View Parking Lot QR Sign
      </button>
    </div>
  `;

  document.getElementById('view-lot-qr-modal-btn')?.addEventListener('click', () => {
    showLotQrModal(lot);
  });
}

function showLotQrModal(lot) {
  const modalHtml = `
    <div class="flex flex-col items-center text-center gap-4">
      <div>
        <span class="badge badge-secondary font-mono">Lot ${lot.lotCode}</span>
        <h3 style="margin-top: 4px; margin-bottom: 2px;">${lot.lotName}</h3>
        <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: 0;">
          Permanent physical campus entrance sign.
        </p>
      </div>

      <!-- Simulated QR Code Display Box -->
      <div style="width: 200px; height: 200px; background: #ffffff; border: 2px solid var(--color-primary); border-radius: var(--radius-lg); padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
        <div style="width: 140px; height: 140px; border: 8px solid #0B2447; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
          <div style="width: 30px; height: 30px; background: #0B2447; position: absolute; top: 6px; left: 6px;"></div>
          <div style="width: 30px; height: 30px; background: #0B2447; position: absolute; top: 6px; right: 6px;"></div>
          <div style="width: 30px; height: 30px; background: #0B2447; position: absolute; bottom: 6px; left: 6px;"></div>
          <span style="font-size: 28px; font-weight: 800; color: #0F9D9A;">${lot.lotCode}</span>
        </div>
      </div>

      <div class="font-mono text-xs font-semibold text-primary" style="letter-spacing: 1px;">
        ${lot.qrCode}
      </div>

      <div class="flex gap-2 w-full" style="margin-top: var(--space-2);">
        <a href="./scan-parking.html?lotId=${lot.id}" class="btn btn-primary flex-1">
          Open QR Scanner &rarr;
        </a>
        <button type="button" id="modal-close-lot-qr-btn" class="btn btn-outline">
          Close
        </button>
      </div>
    </div>
  `;

  openModal(`Permanent QR Sign - Lot ${lot.lotCode}`, modalHtml);
  document.getElementById('modal-close-lot-qr-btn')?.addEventListener('click', closeModal);
}

function renderSummaryTable() {
  const container = document.getElementById('map-lots-summary-table');
  if (!container) return;

  const rowsHtml = allLots.map((l) => {
    const available = Math.max(0, l.totalCapacity - l.occupiedSpaces);
    const occPercent = l.totalCapacity > 0 ? Math.round((l.occupiedSpaces / l.totalCapacity) * 100) : 0;
    const distance = (l.walkingDistances && l.walkingDistances[currentDestination]) || 350;
    const isSelected = l.lotCode === selectedLotCode;

    return `
      <tr style="${isSelected ? 'background-color: #f0fdfa;' : ''}; cursor: pointer;" data-lot-code="${l.lotCode}">
        <td><strong class="font-mono">Lot ${l.lotCode}</strong></td>
        <td>
          <strong>${l.lotName}</strong>
          <div class="text-muted" style="font-size: 11px;">${l.location}</div>
        </td>
        <td>${l.totalCapacity}</td>
        <td>${l.occupiedSpaces}</td>
        <td><strong class="text-success">${available}</strong></td>
        <td class="font-mono">${occPercent}%</td>
        <td>${distance}m</td>
        <td>
          <button class="btn ${isSelected ? 'btn-secondary' : 'btn-outline'} btn-sm select-table-lot-btn" data-lot-code="${l.lotCode}" style="padding: 3px 12px; font-size: 11px; font-weight: 600;">
            ${isSelected ? 'Selected' : 'Select'}
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
            <th>Zone</th>
            <th>Parking Lot</th>
            <th>Capacity</th>
            <th>Occupied</th>
            <th>Available</th>
            <th>Occupancy</th>
            <th>Walk Dist</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  // Attach button and row click handlers
  container.querySelectorAll('.select-table-lot-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.dataset.lotCode;
      if (code) {
        selectedLotCode = code;
        mapController?.setSelectedZone(code, true);
        renderLotDetails();
        renderSummaryTable();
      }
    });
  });

  container.querySelectorAll('tbody tr').forEach((row) => {
    row.addEventListener('click', () => {
      const code = row.dataset.lotCode;
      if (code && code !== selectedLotCode) {
        selectedLotCode = code;
        mapController?.setSelectedZone(code, true);
        renderLotDetails();
        renderSummaryTable();
      }
    });
  });
}
