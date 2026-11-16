/**
 * PARKWISE - Student Rewards Controller
 * Phase 1.8: Rewards Interface & Points Ledger
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { rewardsApi } from '../api/rewards.api.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { openModal, closeModal } from '../components/modal.component.js';
import { showToast } from '../components/toast.component.js';
import { formatDateTime } from '../utils/formatters.js';

let currentUser = null;
let currentBalance = 0;
let catalogItems = [];

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
    headerContainer.innerHTML = renderNavbar({ activePage: 'rewards', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderStudentSidebar('rewards', '../');
    initSidebarEvents();
  }

  // Load All Rewards Data
  await refreshRewardsData();
});

async function refreshRewardsData() {
  const [summaryRes, catalogRes, ledgerRes] = await Promise.all([
    rewardsApi.getSummary(currentUser.id),
    rewardsApi.getCatalog(),
    rewardsApi.getLedger(currentUser.id)
  ]);

  const summary = summaryRes.data || { currentBalance: 0, lifetimeEarned: 0, underutilizedParksCount: 0 };
  currentBalance = summary.currentBalance;
  catalogItems = catalogRes.data || [];
  const ledger = ledgerRes.data || [];

  // Update Summary Cards
  document.getElementById('reward-balance-display').textContent = `${summary.currentBalance} pts`;
  document.getElementById('reward-lifetime-display').textContent = `${summary.lifetimeEarned} pts`;
  document.getElementById('reward-underutilized-count').textContent = `${summary.underutilizedParksCount} times`;

  // Render Catalog
  renderCatalog();

  // Render Ledger
  renderLedger(ledger);
}

function renderCatalog() {
  const container = document.getElementById('rewards-catalog-grid');
  if (!container) return;

  if (catalogItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">[No Rewards Found]</div>
        <div class="empty-state-title">No Rewards in Catalog</div>
        <div class="empty-state-text">Check back soon for new campus vouchers and discounts.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = catalogItems.map((item) => {
    const canAfford = currentBalance >= item.pointsRequired;
    const diff = item.pointsRequired - currentBalance;

    return `
      <div class="card flex flex-col justify-between" style="border: 1px solid var(--color-border);">
        <div class="card-body">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-3);">
            <div class="badge badge-secondary font-mono" style="font-size: 12px; margin-bottom: 8px;">PERK</div>
            <span class="badge ${canAfford ? 'badge-accent' : 'badge-secondary'}" style="font-size: var(--font-size-sm); font-weight: bold;">
              ${item.pointsRequired} pts
            </span>
          </div>

          <h3 style="margin-bottom: var(--space-1);">${item.title}</h3>
          <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: var(--space-3);">
            ${item.description}
          </p>
          <div class="font-mono text-muted" style="font-size: var(--font-size-xs);">
            Valid at: ${item.vendor || 'Campus Partners'}
          </div>
        </div>

        <div class="card-footer" style="background: transparent; border-top: 1px solid var(--color-border); padding: var(--space-3) var(--space-4);">
          ${canAfford ? `
            <button class="btn btn-primary w-full redeem-btn" data-reward-id="${item.id}">
              Redeem Voucher (${item.pointsRequired} pts)
            </button>
          ` : `
            <button class="btn btn-outline w-full" disabled style="opacity: 0.6; cursor: not-allowed;">
              Need ${diff} more pts
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Attach redeem handlers
  container.querySelectorAll('.redeem-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rewardId = btn.dataset.rewardId;
      const item = catalogItems.find((r) => r.id === rewardId);
      if (item) confirmRedeem(item);
    });
  });
}

function confirmRedeem(item) {
  const modalHtml = `
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="badge badge-secondary font-mono" style="font-size: 14px; margin-bottom: 8px;">PERK VOUCHER</div>
        <div>
          <h3 style="margin-bottom: var(--space-1);">${item.title}</h3>
          <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: 0;">${item.description}</p>
        </div>
      </div>

      <div class="card" style="padding: var(--space-3); background: var(--color-bg-alt); border: none;">
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Cost:</span>
          <strong class="text-accent">${item.pointsRequired} Points</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Current Balance:</span>
          <span>${currentBalance} Points</span>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); border-top: 1px solid var(--color-border); padding-top: var(--space-2);">
          <span class="text-muted">Remaining Balance After:</span>
          <strong>${currentBalance - item.pointsRequired} Points</strong>
        </div>
      </div>

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button id="modal-cancel-redeem-btn" class="btn btn-outline">Cancel</button>
        <button id="modal-confirm-redeem-btn" class="btn btn-primary">
          Confirm Redemption
        </button>
      </div>
    </div>
  `;

  openModal('Redeem Reward Perk', modalHtml);

  document.getElementById('modal-cancel-redeem-btn')?.addEventListener('click', closeModal);

  document.getElementById('modal-confirm-redeem-btn')?.addEventListener('click', async () => {
    closeModal();
    const res = await rewardsApi.redeemReward({
      rewardId: item.id,
      userId: currentUser.id
    });

    if (res.success) {
      showToast(`Redeemed ${item.title}!`, 'success');
      showVoucherCodeModal(res.data);
      await refreshRewardsData();
    } else {
      showToast(res.message || 'Redemption failed.', 'danger');
    }
  });
}

function showVoucherCodeModal(data) {
  const { item, voucherCode, remainingBalance } = data;

  const modalHtml = `
    <div class="flex flex-col gap-4 text-center">
      <div class="badge badge-accent font-mono" style="font-size: 16px; margin-bottom: 8px;">VOUCHER CODE</div>
      <div>
        <h3 style="margin-bottom: var(--space-1); color: var(--color-success);">Voucher Claimed!</h3>
        <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: 0;">
          Present this code at <strong>${item.vendor || 'the checkout counter'}</strong>.
        </p>
      </div>

      <div style="background: var(--color-bg-alt); border: 2px dashed var(--color-primary); border-radius: var(--radius-md); padding: var(--space-4);">
        <div class="text-muted font-mono" style="font-size: var(--font-size-xs); margin-bottom: var(--space-1);">PROMO VOUCHER CODE</div>
        <div id="voucher-code-display" class="font-mono" style="font-size: var(--font-size-xl); font-weight: bold; letter-spacing: 2px; color: var(--color-primary);">
          ${voucherCode}
        </div>
        <button id="copy-voucher-btn" class="btn btn-outline btn-sm" style="margin-top: var(--space-3);">
          Copy Code
        </button>
      </div>

      <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: 0;">
        Updated wallet balance: <strong>${remainingBalance} pts</strong>. A record has been added to your ledger.
      </p>

      <div class="flex justify-center" style="margin-top: var(--space-2);">
        <button id="voucher-done-btn" class="btn btn-primary">Done</button>
      </div>
    </div>
  `;

  openModal('Your Reward Voucher', modalHtml);

  document.getElementById('copy-voucher-btn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(voucherCode);
    showToast('Voucher code copied to clipboard!', 'info');
  });

  document.getElementById('voucher-done-btn')?.addEventListener('click', closeModal);
}

function renderLedger(ledger) {
  const container = document.getElementById('reward-ledger-container');
  if (!container) return;

  if (ledger.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">[No Ledger Records]</div>
        <div class="empty-state-title">No Transactions Yet</div>
        <div class="empty-state-text">Complete parking check-ins or use underutilised lots to begin accumulating reward points.</div>
      </div>
    `;
    return;
  }

  const rowsHtml = ledger.map((tx) => {
    const isEarn = tx.type === 'earn';
    const badgeClass = isEarn ? 'badge-success' : 'badge-warning';
    const pointsFormatted = isEarn ? `+${tx.points}` : `${tx.points}`;

    return `
      <tr>
        <td class="text-muted font-mono" style="font-size: var(--font-size-xs);">${formatDateTime(tx.timestamp)}</td>
        <td><strong>${tx.reason}</strong></td>
        <td>
          <span class="badge ${badgeClass}">${isEarn ? 'Points Earned' : 'Redemption'}</span>
        </td>
        <td class="font-mono ${isEarn ? 'text-success' : 'text-danger'}" style="font-weight: bold;">
          ${pointsFormatted} pts
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Activity Description</th>
            <th>Type</th>
            <th>Points Delta</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}
