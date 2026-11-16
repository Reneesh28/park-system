/**
 * PARKWISE - QR Scanning & Parking Session Controller
 * Phase 1.7: QR Scanning & Session Lifecycle
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { parkingApi } from '../api/parking.api.js';
import { rewardsApi } from '../api/rewards.api.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { openModal, closeModal } from '../components/modal.component.js';
import { showToast } from '../components/toast.component.js';
import { formatDateTime } from '../utils/formatters.js';

let currentUser = null;
let activeSession = null;
let allLots = [];
let mediaStream = null;

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
    headerContainer.innerHTML = renderNavbar({ activePage: 'scan-parking', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderStudentSidebar('scan-qr', '../');
    initSidebarEvents();
  }

  // Fetch initial data
  await refreshScannerState();

  // Handle URL Query Params
  const urlParams = new URLSearchParams(window.location.search);
  const paramLotId = urlParams.get('lotId');
  const paramAutoCheckout = urlParams.get('autoCheckout');

  if (paramAutoCheckout === 'true' && activeSession) {
    triggerCheckoutFlow();
  } else if (paramLotId) {
    const matchedLot = allLots.find((l) => l.id === paramLotId || l.lotCode === paramLotId);
    if (matchedLot) {
      if (activeSession) {
        showToast(`You already have an active session in ${activeSession.lotName}. Please check out first.`, 'warning');
      } else {
        triggerCheckInFlow(matchedLot);
      }
    }
  }

  // Bind Demo QR Buttons
  document.querySelectorAll('.demo-scan-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lotCode = btn.dataset.lotCode;
      processScannedCode(`PARKWISE-LOT-${lotCode}`);
    });
  });

  // Bind Manual Code Form
  const manualForm = document.getElementById('manual-qr-form');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const codeInput = document.getElementById('manual-qr-input');
      const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
      if (!code) {
        showToast('Please enter a valid QR code string', 'warning');
        return;
      }
      processScannedCode(code);
    });
  }

  // Bind Camera Access Toggle
  const cameraToggleBtn = document.getElementById('camera-toggle-btn');
  if (cameraToggleBtn) {
    cameraToggleBtn.addEventListener('click', toggleCameraScanner);
  }
});

async function refreshScannerState() {
  const [lotsRes, activeRes] = await Promise.all([
    parkingApi.getLots(),
    parkingApi.getActiveSession(currentUser.id)
  ]);

  allLots = lotsRes.data || [];
  activeSession = activeRes.data;

  updateStatusDisplay();
}

function updateStatusDisplay() {
  const bannerContainer = document.getElementById('scanner-mode-banner');
  const quickCheckoutBtn = document.getElementById('quick-checkout-action-btn');

  if (activeSession) {
    if (bannerContainer) {
      bannerContainer.className = 'alert alert-warning';
      bannerContainer.innerHTML = `
        <div class="flex items-center justify-between flex-wrap gap-2 w-full">
          <div>
            <strong>Active Parking Session Detected:</strong> Currently parked in <strong>${activeSession.lotName}</strong> (${activeSession.vehicleNumber}).
            <div style="font-size: var(--font-size-xs); margin-top: var(--space-1);">
              Scanning any campus QR code now will finalize your session, log your trip, and award reward points.
            </div>
          </div>
          <button id="banner-checkout-btn" class="btn btn-accent btn-sm">
            Check Out Now
          </button>
        </div>
      `;
      document.getElementById('banner-checkout-btn')?.addEventListener('click', triggerCheckoutFlow);
    }
    if (quickCheckoutBtn) {
      quickCheckoutBtn.style.display = 'inline-flex';
      quickCheckoutBtn.onclick = triggerCheckoutFlow;
    }
  } else {
    if (bannerContainer) {
      bannerContainer.className = 'alert alert-info';
      bannerContainer.innerHTML = `
        <div>
          <strong>Ready for Check-In:</strong> Scan the QR code posted at your parking bay entrance or use one of the quick test buttons below.
        </div>
      `;
    }
    if (quickCheckoutBtn) {
      quickCheckoutBtn.style.display = 'none';
    }
  }
}

/**
 * Parses scanned QR code string and routes to check-in or check-out.
 */
function processScannedCode(rawCode) {
  // Normalize code
  const code = rawCode.trim().toUpperCase();

  // Find lot matching code
  const lot = allLots.find(
    (l) => l.qrCode.toUpperCase() === code || `PARKWISE-LOT-${l.lotCode}`.toUpperCase() === code || l.lotCode.toUpperCase() === code
  );

  if (!lot) {
    showToast(`Unrecognized QR Code: "${rawCode}". Valid format: PARKWISE-LOT-A`, 'danger');
    return;
  }

  if (activeSession) {
    // If user is parked, check out!
    triggerCheckoutFlow();
  } else {
    // If user is not parked, check in!
    triggerCheckInFlow(lot);
  }
}

/**
 * Check-In Confirmation Flow
 */
function triggerCheckInFlow(lot) {
  const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
  const isFull = lot.occupiedSpaces >= lot.totalCapacity;
  const isUnderutilized = lot.totalCapacity > 0 && available / lot.totalCapacity >= 0.6;
  const potentialPoints = isUnderutilized ? 20 : 10;
  const vehicleNumber = currentUser.vehicleNumber || 'CW-4482';

  if (isFull) {
    showToast(`${lot.lotName} is completely full! Please navigate to an alternate lot.`, 'danger');
    return;
  }

  const modalHtml = `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="badge badge-secondary font-mono">Lot ${lot.lotCode}</span>
          <h3 style="margin-top: var(--space-1); margin-bottom: 0;">${lot.lotName}</h3>
        </div>
        <span class="badge ${available > 10 ? 'badge-success' : 'badge-warning'}">
          ${available} bays open
        </span>
      </div>

      <div class="card" style="padding: var(--space-3); background: var(--color-bg-alt); border: none;">
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Registered Vehicle:</span>
          <strong>${vehicleNumber}</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Campus Location:</span>
          <span>${lot.location}</span>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm);">
          <span class="text-muted">Reward Eligibility:</span>
          <span class="badge badge-accent">+${potentialPoints} Reward Points</span>
        </div>
      </div>

      ${isUnderutilized ? `
        <div class="alert alert-success" style="font-size: var(--font-size-xs);">
          <strong>Bonus Reward Active:</strong> This lot is underutilised (&gt;60% available spaces). You will earn double points upon checkout!
        </div>
      ` : ''}

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button id="modal-cancel-checkin-btn" class="btn btn-outline">Cancel</button>
        <button id="modal-confirm-checkin-btn" class="btn btn-primary">
          Confirm & Check In
        </button>
      </div>
    </div>
  `;

  openModal('Confirm Parking Check-In', modalHtml);

  document.getElementById('modal-cancel-checkin-btn')?.addEventListener('click', closeModal);

  document.getElementById('modal-confirm-checkin-btn')?.addEventListener('click', async () => {
    closeModal();
    const res = await parkingApi.checkIn({
      userId: currentUser.id,
      lotId: lot.id,
      vehicleNumber
    });

    if (res.success) {
      showToast(`Checked in successfully to ${lot.lotName}!`, 'success');
      await refreshScannerState();
      // Redirect to student dashboard to view live session banner
      setTimeout(() => {
        window.location.href = './student-dashboard.html';
      }, 700);
    } else {
      showToast(res.message || 'Check-in failed.', 'danger');
    }
  });
}

/**
 * Check-Out Confirmation & Reward Receipt Flow
 */
async function triggerCheckoutFlow() {
  if (!activeSession) {
    showToast('No active parking session found to check out.', 'warning');
    return;
  }

  // Pre-calculate session duration
  const entryTime = new Date(activeSession.entryTime);
  const now = new Date();
  const elapsedMs = Math.max(0, now - entryTime);
  const mins = Math.max(1, Math.round(elapsedMs / 60000));
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  const durationText = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins} minutes`;

  const modalHtml = `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="badge badge-warning">Session Ending</span>
          <h3 style="margin-top: var(--space-1); margin-bottom: 0;">Check Out & Collect Points</h3>
        </div>
        <div class="badge badge-accent font-semibold">BONUS REWARD</div>
      </div>

      <div class="card" style="padding: var(--space-4); background: var(--color-bg-alt); border: none;">
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Parking Lot:</span>
          <strong>${activeSession.lotName} (Lot ${activeSession.lotCode})</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Vehicle Number:</span>
          <strong class="font-mono">${activeSession.vehicleNumber}</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Entry Time:</span>
          <span>${formatDateTime(activeSession.entryTime)}</span>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Total Parked Duration:</span>
          <span class="font-mono"><strong>${durationText}</strong></span>
        </div>
      </div>

      <div class="alert alert-success" style="font-size: var(--font-size-sm);">
        Checking out will immediately credit your ParkWise wallet with reward points.
      </div>

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button id="modal-cancel-checkout-btn" class="btn btn-outline">Cancel</button>
        <button id="modal-confirm-checkout-btn" class="btn btn-accent btn-lg">
          Complete Check Out &rarr;
        </button>
      </div>
    </div>
  `;

  openModal('Conclude Parking Session', modalHtml);

  document.getElementById('modal-cancel-checkout-btn')?.addEventListener('click', closeModal);

  document.getElementById('modal-confirm-checkout-btn')?.addEventListener('click', async () => {
    closeModal();
    const res = await parkingApi.checkOut({
      sessionId: activeSession.id,
      userId: currentUser.id
    });

    if (res.success) {
      showCheckoutReceipt(res.data);
      await refreshScannerState();
    } else {
      showToast(res.message || 'Check-out failed.', 'danger');
    }
  });
}

/**
 * Displays rich reward points receipt upon completion.
 */
function showCheckoutReceipt(checkoutData) {
  const { session, pointsEarned, updatedBalance } = checkoutData;

  const receiptHtml = `
    <div class="flex flex-col gap-4 text-center">
      <div class="badge badge-success font-semibold" style="font-size: 1.25rem;">CHECKOUT COMPLETE</div>
      <div>
        <h3 style="margin-bottom: var(--space-1); color: var(--color-success);">Check Out Successful!</h3>
        <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: 0;">
          Your parking bay at ${session.lotName} has been released.
        </p>
      </div>

      <div class="card" style="padding: var(--space-4); background: #fdfaf6; border: 2px dashed var(--color-accent); text-align: left;">
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">
          <span class="text-muted font-mono" style="font-size: var(--font-size-xs);">SESSION ID: ${session.id}</span>
          <span class="badge badge-success">Completed</span>
        </div>

        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Reward Earned:</span>
          <strong class="text-accent" style="font-size: var(--font-size-lg);">+${pointsEarned} Points</strong>
        </div>

        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">New Total Balance:</span>
          <strong>${updatedBalance} Points</strong>
        </div>

        <div class="flex justify-between" style="font-size: var(--font-size-sm);">
          <span class="text-muted">Exit Timestamp:</span>
          <span>${formatDateTime(session.exitTime)}</span>
        </div>
      </div>

      <div class="flex justify-center gap-3" style="margin-top: var(--space-2);">
        <a href="./student-dashboard.html" class="btn btn-primary">
          Back to Dashboard
        </a>
        <a href="./rewards.html" class="btn btn-outline">
          View Wallet & Redeem
        </a>
      </div>
    </div>
  `;

  openModal('Parking Session Receipt', receiptHtml);
}

/**
 * Real camera toggle with permission handling and fallback.
 */
async function toggleCameraScanner() {
  const videoEl = document.getElementById('camera-stream');
  const overlayEl = document.getElementById('camera-placeholder');
  const toggleBtn = document.getElementById('camera-toggle-btn');

  if (mediaStream) {
    // Stop camera
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    if (videoEl) videoEl.style.display = 'none';
    if (overlayEl) overlayEl.style.display = 'flex';
    if (toggleBtn) toggleBtn.textContent = 'Start Live Camera';
    showToast('Camera stopped.', 'info');
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera API is not supported in this browser environment. Please use demo buttons or manual code entry.', 'warning');
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    if (videoEl) {
      videoEl.srcObject = mediaStream;
      videoEl.style.display = 'block';
      await videoEl.play();
    }
    if (overlayEl) overlayEl.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = 'Stop Camera';

    showToast('Camera active. Align QR code within the target frame.', 'success');
  } catch (err) {
    console.warn('Camera access denied or unavailable:', err);
    showToast('Camera access was not granted or no webcam was detected. Using demo scanning interface.', 'warning');
  }
}
