/**
 * PARKWISE - Main Navigation Header Component
 * Visual Reference: ParkSmart Top Bar (Navy brand badge, quick vehicle search, demo mode pill, user state)
 */

import { storageService } from '../services/storage.service.js';
import { icon } from '../utils/icons.js';

const PAGE_TITLES = {
  dashboard: 'Dashboard Overview',
  'parking-lots': 'Campus Parking Lots & Map',
  'scan-parking': 'QR Check-In / Check-Out',
  'find-vehicle': 'Locate My Vehicle',
  rewards: 'Rewards & Campus Perks',
  'parking-history': 'Parking Session History',
  admin: 'Campus Parking Administration'
};

/**
 * Render standard navigation header markup.
 * @param {Object} options
 * @param {string} [options.activePage='']
 * @param {string} [options.basePath='./']
 * @returns {string} HTML string
 */
export function renderNavbar({ activePage = '', basePath = './' } = {}) {
  const currentUser = storageService.get('current_user');
  const pageTitle = PAGE_TITLES[activePage] || 'Smart Parking Assistant';

  const userControlsHtml = currentUser
    ? `
      <div class="flex items-center gap-2">
        <!-- Quick Vehicle Search Input (Reference Feature) -->
        <div class="header-search-box" style="position: relative; display: inline-flex; align-items: center;">
          <span style="position: absolute; left: 10px; color: var(--color-text-subtle); pointer-events: none;">
            ${icon('search', 14)}
          </span>
          <input
            type="text"
            id="nav-quick-search-input"
            class="form-input"
            placeholder="Search bike number"
            style="width: 170px; height: 32px; padding-left: 30px; font-size: var(--font-size-xs); text-transform: uppercase; border-radius: var(--radius-md); background: #f8fafc;"
            aria-label="Search bike registration"
          >
        </div>

        <!-- Demo Mode Badge (from Reference) -->
        <span class="badge" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 11px; padding: 3px 8px;">
          Demo mode
        </span>

        <!-- User Role Avatar Pill -->
        <div class="user-pill flex items-center gap-2" style="background: var(--color-bg-alt); padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs);">
          <span style="color: var(--color-primary);">${icon('user', 14)}</span>
          <span class="hidden sm:inline"><strong>${currentUser.name.split(' ')[0]}</strong></span>
        </div>

        <button id="nav-logout-btn" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;">
          Sign Out
        </button>
      </div>
    `
    : `
      <div class="flex items-center gap-2">
        <a href="${basePath}login.html" class="btn btn-outline btn-sm">Sign In</a>
        <a href="${basePath}register.html" class="btn btn-primary btn-sm">Register</a>
      </div>
    `;

  return `
    <header class="app-header">
      <div class="container-fluid flex items-center justify-between w-full">
        <!-- Brand & Active Page Title -->
        <div class="flex items-center gap-3">
          <a href="${basePath}index.html" class="navbar-brand">
            <span class="brand-icon-badge">
              ${icon('parking', 18)}
            </span>
            <div style="line-height: 1.15;">
              <div style="font-weight: 700; color: var(--color-primary);">ParkWise</div>
              <div class="hidden sm:block" style="font-size: 10px; color: var(--color-text-muted); font-weight: normal;">
                Smart Campus Mobility
              </div>
            </div>
          </a>

          <div class="hidden md:block" style="border-left: 1px solid var(--color-border); padding-left: 12px; margin-left: 4px; font-size: var(--font-size-sm); font-weight: 600; color: #334155;">
            ${pageTitle}
          </div>
        </div>

        <!-- User Controls / Search / Demo Pill -->
        ${userControlsHtml}
      </div>
    </header>
  `;
}

/**
 * Binds logout event listener and quick vehicle search.
 * @param {string} [redirectPath='../login.html'] 
 */
export function initNavbarEvents(redirectPath = '../login.html') {
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      storageService.remove('current_user');
      storageService.remove('auth_token');
      window.location.href = redirectPath;
    });
  }

  const quickSearchInput = document.getElementById('nav-quick-search-input');
  if (quickSearchInput) {
    quickSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = quickSearchInput.value.trim().toUpperCase();
        if (val) {
          // If on find-vehicle page, dispatch search, else navigate
          if (window.location.pathname.includes('find-vehicle.html')) {
            const pageInput = document.getElementById('vehicle-search-input');
            if (pageInput) {
              pageInput.value = val;
              document.getElementById('vehicle-search-form')?.requestSubmit();
            }
          } else {
            const prefix = window.location.pathname.includes('/pages/') ? './' : './pages/';
            window.location.href = `${prefix}find-vehicle.html?q=${encodeURIComponent(val)}`;
          }
        }
      }
    });
  }
}
