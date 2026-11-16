/**
 * PARKWISE - Login Page Controller
 * Phase 1.3: Authentication Interface
 */

import { authApi } from '../api/auth.api.js';
import { showToast } from '../components/toast.component.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to appropriate portal
  if (authMiddleware.isAuthenticated()) {
    const user = authMiddleware.getUser();
    if (user.role === 'admin') {
      window.location.href = './pages/admin-dashboard.html';
    } else {
      window.location.href = './pages/student-dashboard.html';
    }
    return;
  }

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');
  const passwordToggle = document.getElementById('toggle-password');
  const errorContainer = document.getElementById('error-container');

  // Password visibility toggle
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      passwordToggle.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  // Quick Demo Login Buttons
  const demoStudentBtn = document.getElementById('demo-student-btn');
  const demoAdminBtn = document.getElementById('demo-admin-btn');

  if (demoStudentBtn) {
    demoStudentBtn.addEventListener('click', () => {
      emailInput.value = 'alex.rivera@campus.edu';
      passwordInput.value = 'StudentPass123';
      form.requestSubmit();
    });
  }

  if (demoAdminBtn) {
    demoAdminBtn.addEventListener('click', () => {
      emailInput.value = 'admin@campus.edu';
      passwordInput.value = 'AdminPass123';
      form.requestSubmit();
    });
  }

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.style.display = 'none';
    errorContainer.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorContainer.textContent = 'Please provide both email and password.';
      errorContainer.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    const res = await authApi.login(email, password);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';

    if (!res.success) {
      errorContainer.textContent = res.message;
      errorContainer.style.display = 'block';
      showToast(res.message, 'error');
      return;
    }

    showToast(`Welcome back, ${res.data.user.name}!`, 'success');

    setTimeout(() => {
      if (res.data.user.role === 'admin') {
        window.location.href = './pages/admin-dashboard.html';
      } else {
        window.location.href = './pages/student-dashboard.html';
      }
    }, 400);
  });
});
