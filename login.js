/**
 * Personal Budget Planner - Login Page Logic
 * Pure Vanilla JavaScript Client-Side Demo Authentication
 */

(function () {
  'use strict';

  // Demo Credentials per specification
  const DEMO_CREDENTIALS = {
    username: 'admin',
    password: 'Budget@123'
  };

  const AUTH_STORAGE_KEY = 'budgetPlanner_auth';
  const USER_STORAGE_KEY = 'budgetPlanner_user';

  // DOM Elements Cache
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const errUsername = document.getElementById('err-username');
  const errPassword = document.getElementById('err-password');
  const loginAlert = document.getElementById('login-alert');
  const loginAlertText = document.getElementById('login-alert-text');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  const eyeOffIcon = document.getElementById('eye-off-icon');
  const btnAutofill = document.getElementById('btn-autofill-demo');

  /**
   * Clears all validation error messages and alert styles
   */
  function clearErrors() {
    if (loginAlert) loginAlert.classList.add('hidden');
    if (errUsername) errUsername.textContent = '';
    if (errPassword) errPassword.textContent = '';
    if (usernameInput) usernameInput.classList.remove('is-invalid');
    if (passwordInput) passwordInput.classList.remove('is-invalid');
  }

  /**
   * Displays an error alert message banner
   */
  function showErrorAlert(message) {
    if (loginAlert && loginAlertText) {
      loginAlertText.textContent = message;
      loginAlert.classList.remove('hidden');
    }
  }

  /**
   * Toggles password field between 'password' and 'text'
   */
  function togglePasswordVisibility() {
    if (!passwordInput) return;

    const isPassword = passwordInput.getAttribute('type') === 'password';
    if (isPassword) {
      passwordInput.setAttribute('type', 'text');
      btnTogglePassword.setAttribute('aria-label', 'Hide password');
      btnTogglePassword.setAttribute('title', 'Hide password');
      if (eyeIcon) eyeIcon.classList.add('hidden');
      if (eyeOffIcon) eyeOffIcon.classList.remove('hidden');
    } else {
      passwordInput.setAttribute('type', 'password');
      btnTogglePassword.setAttribute('aria-label', 'Show password');
      btnTogglePassword.setAttribute('title', 'Show password');
      if (eyeIcon) eyeIcon.classList.remove('hidden');
      if (eyeOffIcon) eyeOffIcon.classList.add('hidden');
    }
  }

  /**
   * Autofills the demo credentials for quick testing
   */
  function autofillCredentials() {
    clearErrors();
    if (usernameInput) usernameInput.value = DEMO_CREDENTIALS.username;
    if (passwordInput) passwordInput.value = DEMO_CREDENTIALS.password;
    if (passwordInput) passwordInput.focus();
  }

  /**
   * Handles login form submission and credentials verification
   */
  function handleFormSubmit(e) {
    e.preventDefault();
    clearErrors();

    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value;

    let hasError = false;

    if (!usernameVal) {
      errUsername.textContent = 'Please enter your username.';
      usernameInput.classList.add('is-invalid');
      hasError = true;
    }

    if (!passwordVal) {
      errPassword.textContent = 'Please enter your password.';
      passwordInput.classList.add('is-invalid');
      hasError = true;
    }

    if (hasError) {
      if (!usernameVal) {
        usernameInput.focus();
      } else {
        passwordInput.focus();
      }
      return;
    }

    // Verify demo credentials
    if (usernameVal === DEMO_CREDENTIALS.username && passwordVal === DEMO_CREDENTIALS.password) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        sessionStorage.setItem(USER_STORAGE_KEY, usernameVal);
      } catch (err) {
        console.warn('sessionStorage is unavailable:', err);
      }

      // Smoothly navigate to dashboard using relative path
      window.location.replace('index.html');
    } else {
      showErrorAlert('Invalid username or password. Please try again.');
      usernameInput.classList.add('is-invalid');
      passwordInput.classList.add('is-invalid');
      passwordInput.focus();
    }
  }

  // Event Listeners
  if (form) form.addEventListener('submit', handleFormSubmit);
  if (btnTogglePassword) btnTogglePassword.addEventListener('click', togglePasswordVisibility);
  if (btnAutofill) btnAutofill.addEventListener('click', autofillCredentials);

  if (usernameInput) {
    usernameInput.addEventListener('input', function () {
      errUsername.textContent = '';
      usernameInput.classList.remove('is-invalid');
      if (loginAlert) loginAlert.classList.add('hidden');
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      errPassword.textContent = '';
      passwordInput.classList.remove('is-invalid');
      if (loginAlert) loginAlert.classList.add('hidden');
    });
  }
})();
