/**
 * PARKWISE - Sidebar & Mobile Navigation Component
 * Correct navigation structure:
 * 1. Home
 * 2. Find Parking
 * 3. Campus Map
 * 4. Scan QR
 * 5. My Parking
 * 6. Rewards
 * 7. Profile
 */

import { icon } from '../utils/icons.js';

/**
 * Render standard student navigation sidebar + responsive mobile bottom bar.
 * @param {string} activePage - Identifier of current page
 * @param {string} [basePath='./']
 * @returns {string} HTML markup
 */
export function renderStudentSidebar(activePage = '', basePath = './') {
  const items = [
    { id: 'home', label: 'Home', icon: 'grid', href: `${basePath}pages/student-dashboard.html` },
    { id: 'find-parking', label: 'Find Parking', icon: 'parking', href: `${basePath}pages/parking-lots.html` },
    { id: 'campus-map', label: 'Campus Map', icon: 'map', href: `${basePath}pages/campus-map.html` },
    { id: 'scan-qr', label: 'Scan QR', icon: 'qr', href: `${basePath}pages/scan-parking.html` },
    { id: 'my-parking', label: 'My Parking', icon: 'bike', href: `${basePath}pages/find-vehicle.html` },
    { id: 'rewards', label: 'Rewards', icon: 'gift', href: `${basePath}pages/rewards.html` },
    { id: 'profile', label: 'Profile', icon: 'user', href: `${basePath}pages/profile.html` }
  ];

  // Desktop Menu
  const desktopMenuHtml = items
    .map((item) => {
      const isActive = activePage === item.id || activePage === item.label.toLowerCase() ? 'active' : '';
      return `
        <li class="sidebar-item ${isActive}">
          <a href="${item.href}">
            ${icon(item.icon, 18)}
            <span>${item.label}</span>
          </a>
        </li>
      `;
    })
    .join('');

  // Mobile Bottom Navigation Bar (Primary actions: Home, Find Parking, Scan QR (elevated), Campus Map, More)
  const isHomeActive = activePage === 'home' || activePage === 'dashboard';
  const isLotsActive = activePage === 'find-parking' || activePage === 'parking-lots';
  const isScanActive = activePage === 'scan-qr' || activePage === 'scan-parking';
  const isMapActive = activePage === 'campus-map';
  const isMoreActive = ['my-parking', 'rewards', 'profile', 'history', 'parking-history'].includes(activePage);

  return `
    <!-- Mobile Bottom Navigation Bar (Fixed at bottom on screens < 768px) -->
    <nav class="mobile-subnav" aria-label="Mobile Bottom Navigation">
      <a href="${basePath}pages/student-dashboard.html" class="mobile-subnav-link ${isHomeActive ? 'active' : ''}">
        ${icon('grid', 18)}
        <span>Home</span>
      </a>
      <a href="${basePath}pages/parking-lots.html" class="mobile-subnav-link ${isLotsActive ? 'active' : ''}">
        ${icon('parking', 18)}
        <span>Find</span>
      </a>
      <a href="${basePath}pages/scan-parking.html" class="mobile-subnav-link mobile-scan-pill ${isScanActive ? 'active' : ''}">
        <span class="mobile-scan-icon-wrap">
          ${icon('qr', 20)}
        </span>
        <span>Scan QR</span>
      </a>
      <a href="${basePath}pages/campus-map.html" class="mobile-subnav-link ${isMapActive ? 'active' : ''}">
        ${icon('map', 18)}
        <span>Map</span>
      </a>
      <button type="button" id="mobile-more-menu-btn" class="mobile-subnav-link ${isMoreActive ? 'active' : ''}" style="background: none; border: none; font-family: inherit;">
        ${icon('sliders', 18)}
        <span>More</span>
      </button>
    </nav>

    <!-- Mobile More Menu Bottom Sheet / Modal Overlay -->
    <div id="mobile-more-drawer" class="mobile-more-drawer" style="display: none;">
      <div class="mobile-more-backdrop" id="mobile-more-backdrop"></div>
      <div class="mobile-more-content">
        <div class="mobile-more-header flex items-center justify-between">
          <span class="font-semibold text-navy">More Options</span>
          <button id="mobile-more-close-btn" class="btn btn-outline btn-sm" style="padding: 2px 8px;">Close</button>
        </div>
        <div class="mobile-more-grid">
          <a href="${basePath}pages/find-vehicle.html" class="mobile-more-item ${activePage === 'my-parking' ? 'active' : ''}">
            ${icon('bike', 20)}
            <span>My Parking</span>
          </a>
          <a href="${basePath}pages/rewards.html" class="mobile-more-item ${activePage === 'rewards' ? 'active' : ''}">
            ${icon('gift', 20)}
            <span>Rewards</span>
          </a>
          <a href="${basePath}pages/parking-history.html" class="mobile-more-item ${activePage === 'history' || activePage === 'parking-history' ? 'active' : ''}">
            ${icon('history', 20)}
            <span>History</span>
          </a>
          <a href="${basePath}pages/profile.html" class="mobile-more-item ${activePage === 'profile' ? 'active' : ''}">
            ${icon('user', 20)}
            <span>Profile</span>
          </a>
          <a href="${basePath}pages/admin-dashboard.html" class="mobile-more-item">
            ${icon('sliders', 20)}
            <span>Admin Console</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Desktop Sidebar (Visible on desktop screens >= 768px) -->
    <aside class="dashboard-sidebar">
      <div>
        <div style="font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.75rem; padding-left: 0.5rem; letter-spacing: 0.5px;">
          Navigation
        </div>
        <ul class="sidebar-menu">
          ${desktopMenuHtml}
        </ul>
      </div>

      <div class="sidebar-footer-note">
        <div class="flex items-center justify-between" style="margin-bottom: 6px;">
          <span style="font-weight: 600; color: #ffffff; font-size: 11px;">Admin Console</span>
          <a href="${basePath}pages/admin-dashboard.html" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 10px; border-radius: 4px;">
            Open &rarr;
          </a>
        </div>
        ParkWise Campus Mobility. Lot-level smart parking and QR check-in.
      </div>
    </aside>
  `;
}

/**
 * Render admin navigation sidebar.
 * @param {string} activePage 
 * @param {string} [basePath='../']
 * @returns {string} HTML markup
 */
export function renderAdminSidebar(activePage = '', basePath = '../') {
  const items = [
    { id: 'admin-dashboard', label: 'Admin Analytics', icon: 'sliders', href: `${basePath}pages/admin-dashboard.html` },
    { id: 'parking-lots', label: 'Campus Lots', icon: 'parking', href: `${basePath}pages/parking-lots.html` },
    { id: 'campus-map', label: 'Campus Map', icon: 'map', href: `${basePath}pages/campus-map.html` },
    { id: 'parking-history', label: 'Session Records', icon: 'history', href: `${basePath}pages/parking-history.html` }
  ];

  const desktopMenuHtml = items
    .map((item) => {
      const isActive = activePage === item.id ? 'active' : '';
      return `
        <li class="sidebar-item ${isActive}">
          <a href="${item.href}">
            ${icon(item.icon, 18)}
            <span>${item.label}</span>
          </a>
        </li>
      `;
    })
    .join('');

  return `
    <nav class="mobile-subnav" aria-label="Mobile Admin Navigation">
      <a href="${basePath}pages/admin-dashboard.html" class="mobile-subnav-link ${activePage === 'admin-dashboard' ? 'active' : ''}">
        ${icon('sliders', 18)}
        <span>Analytics</span>
      </a>
      <a href="${basePath}pages/parking-lots.html" class="mobile-subnav-link ${activePage === 'parking-lots' ? 'active' : ''}">
        ${icon('parking', 18)}
        <span>Lots</span>
      </a>
      <a href="${basePath}pages/campus-map.html" class="mobile-subnav-link ${activePage === 'campus-map' ? 'active' : ''}">
        ${icon('map', 18)}
        <span>Map</span>
      </a>
      <a href="${basePath}pages/student-dashboard.html" class="mobile-subnav-link">
        ${icon('user', 18)}
        <span>Student</span>
      </a>
    </nav>

    <aside class="dashboard-sidebar">
      <div>
        <div style="font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: #f59e0b; margin-bottom: 0.75rem; padding-left: 0.5rem; letter-spacing: 0.5px;">
          Admin Console
        </div>
        <ul class="sidebar-menu">
          ${desktopMenuHtml}
        </ul>
      </div>

      <div class="sidebar-footer-note">
        <div class="flex items-center justify-between" style="margin-bottom: 6px;">
          <span style="font-weight: 600; color: #ffffff; font-size: 11px;">Student Portal</span>
          <a href="${basePath}pages/student-dashboard.html" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 10px; border-radius: 4px;">
            Student View &rarr;
          </a>
        </div>
        Campus Transport Authority. Full capacity control &amp; live session monitoring.
      </div>
    </aside>
  `;
}

/**
 * Initializes mobile more menu drawer interaction.
 */
export function initSidebarEvents() {
  const moreBtn = document.getElementById('mobile-more-menu-btn');
  const drawer = document.getElementById('mobile-more-drawer');
  const backdrop = document.getElementById('mobile-more-backdrop');
  const closeBtn = document.getElementById('mobile-more-close-btn');

  if (moreBtn && drawer) {
    moreBtn.addEventListener('click', () => {
      drawer.style.display = 'block';
    });
  }

  const closeDrawer = () => {
    if (drawer) drawer.style.display = 'none';
  };

  backdrop?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
}
