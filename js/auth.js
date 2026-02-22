/**
 * Hybrid Roofing Forms Portal — Authentication
 *
 * Demo credentials (replace with real auth in production):
 *   Username: admin
 *   Password: hybrid2026
 */

(function () {
  'use strict';

  // ── Demo credentials (swap for API-based auth in production) ──
  const VALID_USERS = [
    { username: 'admin', password: 'hybrid2026' }
  ];

  // ── DOM references ──
  const loginScreen   = document.getElementById('login-screen');
  const app           = document.getElementById('app');
  const loginForm     = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePwdBtn  = document.getElementById('toggle-password');
  const loginError    = document.getElementById('login-error');
  const userDisplay   = document.getElementById('user-display');
  const logoutBtn     = document.getElementById('logout-btn');

  // ── Session helpers ───────────────────────────────────────────
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem('hybridAuth'));
    } catch {
      return null;
    }
  }

  function setSession(username) {
    sessionStorage.setItem(
      'hybridAuth',
      JSON.stringify({ username, ts: Date.now() })
    );
  }

  function clearSession() {
    sessionStorage.removeItem('hybridAuth');
  }

  // ── UI toggles ────────────────────────────────────────────────
  function showApp(username) {
    loginScreen.hidden = true;
    app.hidden = false;
    userDisplay.textContent = username;
  }

  function showLogin() {
    app.hidden = true;
    loginScreen.hidden = false;
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.hidden = true;
    usernameInput.focus();
  }

  // ── Validate credentials ──────────────────────────────────────
  function authenticate(username, password) {
    return VALID_USERS.some(
      (u) => u.username === username && u.password === password
    );
  }

  // ── Event: form submit ────────────────────────────────────────
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (authenticate(username, password)) {
      loginError.hidden = true;
      setSession(username);
      showApp(username);
    } else {
      loginError.hidden = false;
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  // ── Event: toggle password visibility ─────────────────────────
  togglePwdBtn.addEventListener('click', function () {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    this.setAttribute(
      'aria-label',
      isPassword ? 'Hide password' : 'Show password'
    );
  });

  // ── Event: logout ─────────────────────────────────────────────
  logoutBtn.addEventListener('click', function () {
    clearSession();
    showLogin();
  });

  // ── Init: check existing session ──────────────────────────────
  const session = getSession();
  if (session && session.username) {
    showApp(session.username);
  } else {
    showLogin();
  }
})();
