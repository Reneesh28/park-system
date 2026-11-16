/**
 * PARKWISE - Student Profile Page Controller
 */

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authApi } from '../api/auth.api.js';
import { renderNavbar, initNavbarEvents } from '../components/navbar.component.js';
import { renderStudentSidebar, renderAdminSidebar, initSidebarEvents } from '../components/sidebar.component.js';
import { showToast } from '../components/toast.component.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = authMiddleware.requireAuth({
    allowedRoles: ['student', 'admin'],
    redirectUrl: '../login.html',
    basePath: '../'
  });
  if (!currentUser) return;

  const headerContainer = document.getElementById('navbar-container');
  if (headerContainer) {
    headerContainer.innerHTML = renderNavbar({ activePage: 'profile', basePath: '../' });
    initNavbarEvents('../login.html');
  }

  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    if (currentUser.role === 'admin') {
      sidebarContainer.innerHTML = renderAdminSidebar('profile', '../');
    } else {
      sidebarContainer.innerHTML = renderStudentSidebar('profile', '../');
    }
    initSidebarEvents();
  }

  // Populate Student Profile Details
  const fullNameEl = document.getElementById('profile-full-name');
  const initialsEl = document.getElementById('profile-initials');
  const studentIdEl = document.getElementById('profile-student-id');
  const emailEl = document.getElementById('profile-email');
  const roleBadgeEl = document.getElementById('profile-role-badge');
  const balanceEl = document.getElementById('profile-wallet-balance');
  const plateEl = document.getElementById('profile-plate-number');

  if (fullNameEl) fullNameEl.textContent = currentUser.fullName || 'Student User';
  if (initialsEl && currentUser.fullName) {
    const parts = currentUser.fullName.split(' ');
    initialsEl.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
  if (studentIdEl) studentIdEl.textContent = currentUser.studentId || '2024-STU-8821';
  if (emailEl) emailEl.textContent = currentUser.email || 'student@university.edu';
  if (roleBadgeEl) roleBadgeEl.textContent = currentUser.role === 'admin' ? 'Campus Admin' : 'Student';
  if (balanceEl) balanceEl.textContent = `${currentUser.rewardPoints || 0} pts`;
  if (plateEl) plateEl.textContent = currentUser.vehicleNumber || 'PB08-AX-9941';

  // Logout Button
  document.getElementById('profile-logout-btn')?.addEventListener('click', async () => {
    await authApi.logout();
    showToast('Signed out of ParkWise', 'info');
    setTimeout(() => {
      window.location.href = '../login.html';
    }, 400);
  });
});
