/**
 * PARKWISE - Parking Lots Directory Controller
 * Adaptive controller supporting both Student Portal and Admin Console.
 * When viewed by Admin: Keeps Admin Sidebar, Admin Navigation, and exposes zone capacity controls.
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { recommendationService, ACADEMIC_DESTINATIONS } from '../services/recommendation.service.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, renderAdminSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { renderAvailabilityBadge } from '../components/badge.component.js';
import { openModal, closeModal } from '../components/modal.component.js';
import { showToast } from '../components/toast.component.js';
import { CampusMapController } from '../components/campus-map.component.js';
import { icon } from '../utils/icons.js';

let currentUser = null;
let isAdmin = false;
let allLots = [];
let currentFilter = 'all';
let currentSort = 'available-desc';
let currentSearch = '';
let currentDestination = 'Engineering Hall';
let mapController = null;
let selectedZoneCode = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = authMiddleware.requireAuth({
    allowedRoles: ['student', 'admin'],
    redirectUrl: '../login.html',
    basePath: '../'
  });
  if (!currentUser) return;
  isAdmin = currentUser.role === 'admin';

  // Render Shell
  const headerContainer = document.getElementById('navbar-container');
  if (headerContainer) {
    headerContainer.innerHTML = renderNavbar({
      activePage: isAdmin ? 'admin' : 'parking-lots',
      basePath: '../'
    });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = isAdmin
      ? renderAdminSidebar('parking-lots', '../')
      : renderStudentSidebar('find-parking', '../');
    initSidebarEvents();
  }

  // Adjust header text for Admin mode
  if (isAdmin) {
    const titleEl = document.querySelector('.dashboard-header h2');
    if (titleEl) {
      titleEl.innerHTML = `Campus Lots Directory <span class="badge badge-warning" style="font-size: 10px; margin-left: 6px;">Admin Console</span>`;
    }
    const subtitleEl = document.querySelector('.dashboard-header p');
    if (subtitleEl) {
      subtitleEl.textContent = 'Live university zone occupancy, capacity controls, and operational status management.';
    }
  }

  // Populate Destination Selector
  const destSelect = document.getElementById('lots-destination-select');
  if (destSelect) {
    destSelect.innerHTML = ACADEMIC_DESTINATIONS.map(
      (d) => `<option value="${d}">${d}</option>`
    ).join('');
    destSelect.value = currentDestination;
    destSelect.addEventListener('change', (e) => {
      currentDestination = e.target.value;
      renderLotsGrid();
    });
  }

  // Bind Search Input
  const searchInput = document.getElementById('lot-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderLotsGrid();
    });
  }

  // Bind Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active', 'btn-primary'));
      filterBtns.forEach((b) => b.classList.add('btn-outline'));
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-outline');
      currentFilter = btn.dataset.filter;
      renderLotsGrid();
    });
  });

  // Bind Sort Select
  const sortSelect = document.getElementById('lot-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderLotsGrid();
    });
  }

  // Load Data
  await loadLots();
});

async function loadLots() {
  const res = await parkingApi.getLots();
  allLots = res.data || [];

  // Initialize Campus Map
  if (!mapController) {
    mapController = new CampusMapController({
      containerId: 'lots-campus-map-container',
      lots: allLots,
      selectedZone: selectedZoneCode || 'A',
      onZoneSelect: (code) => {
        selectedZoneCode = code;
        renderLotsGrid();
        // Smooth scroll to lot card if present
        const card = document.getElementById(`lot-card-${code}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          card.style.borderColor = '#0F9D9A';
          setTimeout(() => { card.style.borderColor = ''; }, 1500);
        }
      }
    });
  } else {
    mapController.updateLots(allLots, selectedZoneCode);
  }

  renderLotsGrid();
}

function renderLotsGrid() {
  const container = document.getElementById('parking-lots-grid');
  if (!container) return;

  // Filter lots
  let filtered = allLots.filter((lot) => {
    const matchesSearch =
      lot.lotName.toLowerCase().includes(currentSearch) ||
      lot.lotCode.toLowerCase().includes(currentSearch) ||
      lot.location.toLowerCase().includes(currentSearch);

    if (!matchesSearch) return false;

    const availRatio = lot.totalCapacity > 0 ? (lot.totalCapacity - lot.occupiedSpaces) / lot.totalCapacity : 0;

    if (currentFilter === 'underutilized') {
      return availRatio >= 0.6;
    } else if (currentFilter === 'moderate') {
      return availRatio >= 0.3 && availRatio < 0.6;
    } else if (currentFilter === 'full') {
      return availRatio < 0.3;
    }
    return true;
  });

  // Sort lots
  filtered.sort((a, b) => {
    const availA = a.totalCapacity - a.occupiedSpaces;
    const availB = b.totalCapacity - b.occupiedSpaces;
    const distA = recommendationService.getDistance(a.lotCode, currentDestination);
    const distB = recommendationService.getDistance(b.lotCode, currentDestination);

    if (currentSort === 'available-desc') return availB - availA;
    if (currentSort === 'available-asc') return availA - availB;
    if (currentSort === 'distance-asc') return distA - distB;
    if (currentSort === 'capacity-desc') return b.totalCapacity - a.totalCapacity;
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">[No Lots Found]</div>
        <div class="empty-state-title">No Parking Lots Found</div>
        <div class="empty-state-text">No lots match the chosen search keyword or availability filter.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((lot) => {
    const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
    const availRatio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
    const occPercent = Math.round((lot.occupiedSpaces / lot.totalCapacity) * 100);
    const dist = recommendationService.getDistance(lot.lotCode, currentDestination);
    const walkMin = Math.round(dist / 80);
    const badgeHtml = renderAvailabilityBadge(available, lot.totalCapacity);
    const isUnderutilized = availRatio >= 0.6;
    const isSelected = selectedZoneCode === lot.lotCode;

    let progressBarClass = 'progress-success';
    if (availRatio < 0.3) progressBarClass = 'progress-danger';
    else if (availRatio < 0.6) progressBarClass = 'progress-warning';

    const adminActionsHtml = `
      <div class="flex items-center gap-2">
        <button class="btn btn-primary btn-sm admin-edit-capacity-btn" data-lot-id="${lot.id}" style="font-size: 11px; padding: 4px 10px;">
          ${icon('sliders', 14)}
          <span>Edit Capacity</span>
        </button>
        <button class="btn btn-outline btn-sm admin-toggle-status-btn" data-lot-id="${lot.id}" style="font-size: 11px; padding: 4px 8px; border-color: ${lot.isActive !== false ? 'var(--color-danger)' : 'var(--color-success)'}; color: ${lot.isActive !== false ? 'var(--color-danger)' : 'var(--color-success)'};">
          ${lot.isActive !== false ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    `;

    const studentActionHtml = `
      <a href="./scan-parking.html?lotId=${lot.id}" class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 10px;">
        ${icon('qr', 14)}
        <span>Check In Here</span>
      </a>
    `;

    return `
      <div id="lot-card-${lot.lotCode}" class="card lot-card flex flex-col justify-between" style="border: 1px solid ${isSelected ? 'var(--color-secondary)' : 'var(--color-border)'};">
        <div class="card-body" style="padding: var(--space-4);">
          <!-- Top Row -->
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
            <div>
              <span class="badge badge-secondary font-mono" style="margin-bottom: 2px;">
                Lot ${lot.lotCode}
              </span>
              <h3 style="margin-bottom: 0; font-size: var(--font-size-md);">${lot.lotName}</h3>
            </div>
            ${badgeHtml}
          </div>

          <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--space-3);">
            ${lot.location}
          </p>

          <!-- 4-Cell Metric Box -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; margin-bottom: var(--space-3);">
            <div style="background: #f8fafc; border-radius: var(--radius-sm); padding: 6px;">
              <div class="font-bold text-navy" style="font-size: var(--font-size-md);">${lot.totalCapacity}</div>
              <div class="text-muted" style="font-size: 10px;">Total</div>
            </div>
            <div style="background: #ecfdf5; border-radius: var(--radius-sm); padding: 6px;">
              <div class="font-bold text-success" style="font-size: var(--font-size-md);">${available}</div>
              <div class="text-muted" style="font-size: 10px;">Free</div>
            </div>
            <div style="background: #f8fafc; border-radius: var(--radius-sm); padding: 6px;">
              <div class="font-bold text-navy" style="font-size: var(--font-size-md);">${lot.occupiedSpaces}</div>
              <div class="text-muted" style="font-size: 10px;">Taken</div>
            </div>
            <div style="background: #f0fdfc; border-radius: var(--radius-sm); padding: 6px;">
              <div class="font-bold text-teal" style="font-size: var(--font-size-md);">${occPercent}%</div>
              <div class="text-muted" style="font-size: 10px;">Full</div>
            </div>
          </div>

          <!-- Capacity Bar -->
          <div class="progress-bar-container" style="margin-bottom: 4px;">
            <div class="progress-bar ${progressBarClass}" style="width: ${occPercent}%;"></div>
          </div>

          <!-- Context Row -->
          ${isAdmin ? `
            <div style="background: var(--color-bg-alt); padding: 5px 8px; border-radius: var(--radius-sm); margin-top: 6px; font-size: 11px;" class="flex items-center justify-between">
              <span>Status: <strong>${lot.isActive !== false ? 'Active' : 'Closed'}</strong></span>
              <span>QR Code: <strong class="font-mono">PARKWISE-LOT-${lot.lotCode}</strong></span>
            </div>
          ` : `
            <div style="background: var(--color-bg-alt); padding: 4px 8px; border-radius: var(--radius-sm); margin-top: 6px; margin-bottom: var(--space-3); font-size: 11px;">
              Walking Distance: <strong>${dist}m</strong> to ${currentDestination} (~${walkMin} min walk)
            </div>
            ${isUnderutilized ? `
              <div class="alert alert-success" style="padding: 4px 8px; font-size: 11px; margin-bottom: 0;">
                <strong>Underutilised Zone:</strong> Earn +20 bonus reward points!
              </div>
            ` : `
              <div class="alert alert-info" style="padding: 4px 8px; font-size: 11px; margin-bottom: 0;">
                Standard check-in zone (+10 points).
              </div>
            `}
          `}
        </div>

        <div class="card-footer flex items-center justify-between gap-2" style="background: transparent; border-top: 1px solid var(--color-border); padding: var(--space-2) var(--space-3);">
          <button class="btn btn-outline btn-sm view-details-btn" data-lot-id="${lot.id}" style="font-size: 11px; padding: 4px 8px;">
            ${icon('parking', 14)}
            <span>View Details &amp; QR</span>
          </button>
          ${isAdmin ? adminActionsHtml : studentActionHtml}
        </div>
      </div>
    `;
  }).join('');

  // Attach modal click handlers
  container.querySelectorAll('.view-details-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lotId = btn.dataset.lotId;
      const lot = allLots.find((l) => l.id === lotId);
      if (lot) showLotDetailsModal(lot);
    });
  });

  if (isAdmin) {
    container.querySelectorAll('.admin-edit-capacity-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lotId = btn.dataset.lotId;
        const lot = allLots.find((l) => l.id === lotId);
        if (lot) showAdminEditLotModal(lot);
      });
    });

    container.querySelectorAll('.admin-toggle-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lotId = btn.dataset.lotId;
        const lot = allLots.find((l) => l.id === lotId);
        if (!lot) return;
        const newStatus = lot.isActive === false;
        btn.disabled = true;
        const res = await parkingApi.updateLot(lot.id, { isActive: newStatus });
        btn.disabled = false;
        if (res.success) {
          showToast(`Lot ${lot.lotCode} set to ${newStatus ? 'Active' : 'Closed'}`, 'success');
          await loadLots();
        } else {
          showToast(res.message || 'Failed to update status', 'error');
        }
      });
    });
  }
}

function showAdminEditLotModal(lot) {
  const modalHtml = `
    <form id="admin-edit-lot-modal-form" class="flex flex-col gap-3">
      <div class="form-group">
        <label for="modal-edit-lot-name" class="form-label">Parking Lot Name</label>
        <input
          type="text"
          id="modal-edit-lot-name"
          class="form-input"
          value="${lot.lotName}"
          required
        >
      </div>

      <div class="form-group">
        <label for="modal-edit-lot-capacity" class="form-label">Total Parking Capacity (Bays)</label>
        <input
          type="number"
          id="modal-edit-lot-capacity"
          class="form-input"
          value="${lot.totalCapacity}"
          min="${lot.occupiedSpaces}"
          required
        >
        <div class="form-help text-muted" style="font-size: 11px;">
          Must be >= current occupied count (${lot.occupiedSpaces} taken).
        </div>
      </div>

      <div class="form-group">
        <label for="modal-edit-lot-location" class="form-label">Location Description</label>
        <input
          type="text"
          id="modal-edit-lot-location"
          class="form-input"
          value="${lot.location || ''}"
        >
      </div>

      <div class="flex justify-end gap-2" style="margin-top: 8px;">
        <button type="button" id="modal-cancel-edit-btn" class="btn btn-outline btn-sm">Cancel</button>
        <button type="submit" id="modal-save-edit-btn" class="btn btn-primary btn-sm">Save Changes</button>
      </div>
    </form>
  `;

  openModal(`Edit Lot ${lot.lotCode} — ${lot.lotName}`, modalHtml);

  document.getElementById('modal-cancel-edit-btn')?.addEventListener('click', closeModal);

  document.getElementById('admin-edit-lot-modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('modal-edit-lot-name').value.trim();
    const newCap = parseInt(document.getElementById('modal-edit-lot-capacity').value, 10);
    const newLoc = document.getElementById('modal-edit-lot-location').value.trim();

    if (newCap < lot.occupiedSpaces) {
      showToast(`Cannot reduce capacity below currently occupied count (${lot.occupiedSpaces})`, 'error');
      return;
    }

    const saveBtn = document.getElementById('modal-save-edit-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    const res = await parkingApi.updateLot(lot.id, {
      lotName: newName,
      totalCapacity: newCap,
      location: newLoc
    });

    closeModal();

    if (res.success) {
      showToast(`Lot ${lot.lotCode} updated successfully!`, 'success');
      await loadLots();
    } else {
      showToast(res.message || 'Failed to update parking lot', 'error');
    }
  });
}

function showLotDetailsModal(lot) {
  const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
  const qrCodeDisplay = `PARKWISE-LOT-${lot.lotCode}`;

  // Distances to all blocks
  const distancesHtml = ACADEMIC_DESTINATIONS.map((dest) => {
    const dist = recommendationService.getDistance(lot.lotCode, dest);
    const walkMin = Math.round(dist / 80);
    return `
      <tr>
        <td>${dest}</td>
        <td class="font-mono">${dist} meters</td>
        <td>~${walkMin} mins</td>
      </tr>
    `;
  }).join('');

  const modalHtml = `
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div>
          <span class="badge badge-secondary font-mono">Lot ${lot.lotCode}</span>
          <h3 style="margin-top: 2px; margin-bottom: 0; font-size: var(--font-size-md);">${lot.lotName}</h3>
          <p class="text-muted" style="margin-bottom: 0; font-size: 11px;">${lot.location}</p>
        </div>
        ${renderAvailabilityBadge(available, lot.totalCapacity)}
      </div>

      <!-- QR Code Display -->
      <div style="background: #ffffff; border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); text-align: center;">
        <div style="display: inline-block; background: #000000; color: #ffffff; padding: var(--space-3); border-radius: var(--radius-md); font-family: monospace;">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="background:#fff; padding:4px; border-radius:4px;">
            <rect width="100" height="100" fill="white"/>
            <rect x="5" y="5" width="30" height="30" fill="black"/>
            <rect x="10" y="10" width="20" height="20" fill="white"/>
            <rect x="15" y="15" width="10" height="10" fill="black"/>
            <rect x="65" y="5" width="30" height="30" fill="black"/>
            <rect x="70" y="10" width="20" height="20" fill="white"/>
            <rect x="75" y="15" width="10" height="10" fill="black"/>
            <rect x="5" y="65" width="30" height="30" fill="black"/>
            <rect x="10" y="70" width="20" height="20" fill="white"/>
            <rect x="15" y="75" width="10" height="10" fill="black"/>
            <rect x="42" y="10" width="16" height="8" fill="black"/>
            <rect x="45" y="25" width="10" height="15" fill="black"/>
            <rect x="15" y="42" width="20" height="10" fill="black"/>
            <rect x="65" y="45" width="25" height="10" fill="black"/>
            <rect x="42" y="65" width="15" height="20" fill="black"/>
            <rect x="65" y="65" width="10" height="10" fill="black"/>
            <rect x="80" y="80" width="10" height="10" fill="black"/>
          </svg>
          <div style="margin-top: 4px; font-size: 11px; color: #000000; font-weight: bold;">
            SCAN CODE: ${qrCodeDisplay}
          </div>
        </div>
        <p class="text-muted" style="font-size: 11px; margin-top: 4px; margin-bottom: 0;">
          Permanent zone entrance barcode.
        </p>
      </div>

      <!-- Capacity Info -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center;">
        <div style="background: var(--color-bg-alt); padding: 6px; border-radius: var(--radius-sm);">
          <div class="text-muted" style="font-size: 10px;">Capacity</div>
          <div class="font-bold text-navy" style="font-size: var(--font-size-md);">${lot.totalCapacity}</div>
        </div>
        <div style="background: var(--color-bg-alt); padding: 6px; border-radius: var(--radius-sm);">
          <div class="text-muted" style="font-size: 10px;">Occupied</div>
          <div class="font-bold text-navy" style="font-size: var(--font-size-md);">${lot.occupiedSpaces}</div>
        </div>
        <div style="background: #ecfdf5; padding: 6px; border-radius: var(--radius-sm);">
          <div class="text-muted" style="font-size: 10px;">Available</div>
          <div class="font-bold text-success" style="font-size: var(--font-size-md);">${available}</div>
        </div>
      </div>

      <!-- Distance Table -->
      <div>
        <h4 style="margin-bottom: 4px; font-size: var(--font-size-xs);">Walking Distances to Academic Blocks</h4>
        <div class="table-responsive">
          <table class="table" style="font-size: 11px;">
            <thead>
              <tr>
                <th>Campus Destination</th>
                <th>Distance</th>
                <th>Est. Walk</th>
              </tr>
            </thead>
            <tbody>
              ${distancesHtml}
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end gap-2" style="margin-top: 4px;">
        <button id="modal-close-action-btn" class="btn btn-outline btn-sm">Close</button>
        ${isAdmin ? `
          <button id="modal-edit-from-details-btn" class="btn btn-primary btn-sm">
            Edit Capacity
          </button>
        ` : `
          <a href="./scan-parking.html?lotId=${lot.id}" class="btn btn-primary btn-sm">
            Check In at Lot ${lot.lotCode}
          </a>
        `}
      </div>
    </div>
  `;

  openModal(`Parking Lot Details — Lot ${lot.lotCode}`, modalHtml);

  document.getElementById('modal-close-action-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-edit-from-details-btn')?.addEventListener('click', () => {
    closeModal();
    showAdminEditLotModal(lot);
  });
}
