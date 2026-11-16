/**
 * PARKWISE - Student Registration Page Controller
 * Phase 1.3: Authentication Interface & Validation
 */

import { authApi } from '../api/auth.api.js';
import { showToast } from '../components/toast.component.js';
import { isValidEmail, isValidPassword, isValidPlateNumber } from '../utils/validators.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorContainer = document.getElementById('error-container');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.style.display = 'none';
    errorContainer.innerHTML = '';

    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const studentId = document.getElementById('student-id').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const vehicleNumber = document.getElementById('vehicle-number').value.trim();
    const vehicleType = document.getElementById('vehicle-type').value;

    const errors = [];

    if (!fullName || fullName.length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }

    if (!isValidEmail(email)) {
      errors.push('Please provide a valid institutional campus email.');
    }

    if (!studentId || studentId.length < 3) {
      errors.push('Student ID must be at least 3 characters long.');
    }

    if (!isValidPassword(password)) {
      errors.push('Password must be at least 8 characters long and contain at least one digit and one letter.');
    }

    if (password !== confirmPassword) {
      errors.push('Passwords do not match.');
    }

    if (!isValidPlateNumber(vehicleNumber)) {
      errors.push('Please enter a valid vehicle license plate number.');
    }

    if (errors.length > 0) {
      errorContainer.innerHTML = `<ul style="margin: 0; padding-left: var(--space-4);">${errors.map((err) => `<li>${err}</li>`).join('')}</ul>`;
      errorContainer.style.display = 'block';
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering Student Account...';

    const res = await authApi.register({
      fullName,
      email,
      studentId,
      password,
      vehicleNumber,
      vehicleType
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Complete Registration';

    if (!res.success) {
      errorContainer.textContent = res.message;
      errorContainer.style.display = 'block';
      showToast(res.message, 'error');
      return;
    }

    showToast('Registration successful! Redirecting to student dashboard...', 'success');

    setTimeout(() => {
      window.location.href = './pages/student-dashboard.html';
    }, 500);
  });
});
