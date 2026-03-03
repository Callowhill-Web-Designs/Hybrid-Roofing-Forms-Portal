/**
 * Hybrid Roofing Forms Portal — Authentication
 *
 * Handles user login, session management, and "remember device" functionality.
 * Credentials are stored in config.js (not committed to version control).
 */

var AuthService = (function () {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('[Auth] Initializing auth system...');
    
    // ── DOM references ──
    var loginScreen   = document.getElementById('login-screen');
    var app           = document.getElementById('app');
    var loginForm     = document.getElementById('login-form');
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var rememberCheckbox = document.getElementById('remember-device');
    var togglePwdBtn  = document.getElementById('toggle-password');
    var loginError    = document.getElementById('login-error');
    var userDisplay   = document.getElementById('user-display');
    var logoutBtn     = document.getElementById('logout-btn');

    console.log('[Auth] DOM Elements:', {
      loginScreen: !!loginScreen,
      app: !!app,
      loginForm: !!loginForm,
      usernameInput: !!usernameInput,
      passwordInput: !!passwordInput
    });

    // Check if config is loaded
    if (typeof AppConfig === 'undefined') {
      console.error('AppConfig not found. Make sure config.js is loaded before auth.js');
      return;
    }
    
    console.log('[Auth] AppConfig loaded successfully');

    // ── Session storage keys (from config) ──
    var STORAGE_KEY = AppConfig.session.storageKey;
    var REMEMBER_KEY = AppConfig.session.rememberKey;

  // ── Session helpers ───────────────────────────────────────────
  function getSession() {
    try {
      // Check localStorage first (for remembered devices)
      var remembered = localStorage.getItem(REMEMBER_KEY);
      if (remembered) {
        return JSON.parse(remembered);
      }
      // Then check sessionStorage (for current session only)
      var session = sessionStorage.getItem(STORAGE_KEY);
      if (session) {
        return JSON.parse(session);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function setSession(username, remember) {
    var sessionData = JSON.stringify({ 
      username: username, 
      ts: Date.now() 
    });
    
    if (remember) {
      // Store in localStorage for persistent login
      localStorage.setItem(REMEMBER_KEY, sessionData);
    } else {
      // Store in sessionStorage for single session only
      sessionStorage.setItem(STORAGE_KEY, sessionData);
    }
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }

  function isAuthenticated() {
    return getSession() !== null;
  }

  // ── UI toggles ────────────────────────────────────────────────
  function showApp(username) {
    console.log('[Auth] Showing app for user:', username);
    if (loginScreen) loginScreen.hidden = true;
    if (app) app.hidden = false;
    if (userDisplay) userDisplay.textContent = 'Welcome, ' + username;
    
    // Trigger custom event that dashboard can listen to
    window.dispatchEvent(new CustomEvent('auth-success', { detail: { username: username } }));
  }

  function showLogin() {
    console.log('[Auth] Showing login screen');
    if (app) app.hidden = true;
    if (loginScreen) loginScreen.hidden = false;
    if (usernameInput) {
      usernameInput.value = '';
      usernameInput.focus();
    }
    if (passwordInput) passwordInput.value = '';
    if (rememberCheckbox) rememberCheckbox.checked = false;
    if (loginError) loginError.hidden = true;
  }

  // ── Validate credentials ──────────────────────────────────────
  function authenticate(username, password) {
    return username === AppConfig.credentials.username && 
           password === AppConfig.credentials.password;
  }

  // ── Event: form submit ────────────────────────────────────────
  if (loginForm) {
    console.log('[Auth] Attaching submit event listener to login form');
    loginForm.addEventListener('submit', function (e) {
      console.log('[Auth] Form submitted!');
      e.preventDefault();

      var username = usernameInput.value.trim();
      var password = passwordInput.value;
      var remember = rememberCheckbox.checked;

      console.log('[Auth] Authenticating user:', username, 'Remember:', remember);

      if (authenticate(username, password)) {
        console.log('[Auth] Authentication successful');
        loginError.hidden = true;
        setSession(username, remember);
        showApp(username);
      } else {
        console.log('[Auth] Authentication failed');
        loginError.hidden = false;
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
  } else {
    console.error('[Auth] Login form not found!');
  }

  // ── Event: toggle password visibility ─────────────────────────
  if (togglePwdBtn) {
    togglePwdBtn.addEventListener('click', function () {
      var isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      this.setAttribute(
        'aria-label',
        isPassword ? 'Hide password' : 'Show password'
      );
    });
  }

  // ── Event: logout ─────────────────────────────────────────────
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      clearSession();
      showLogin();
      
      // Trigger logout event for dashboard cleanup
      window.dispatchEvent(new Event('auth-logout'));
    });
  }

  // ── Init: check existing session ──────────────────────────────
    var session = getSession();
    console.log('[Auth] Checking existing session:', session);
    if (session && session.username) {
      showApp(session.username);
    } else {
      showLogin();
    }
    
    console.log('[Auth] Initialization complete');
  } // End of init function

  // ── Public API (available immediately) ────────────────────────
  return {
    isAuthenticated: function() {
      try {
        var remembered = localStorage.getItem(AppConfig.session.rememberKey);
        if (remembered) return true;
        var session = sessionStorage.getItem(AppConfig.session.storageKey);
        return session !== null;
      } catch (e) {
        return false;
      }
    },
    getSession: function() {
      try {
        var remembered = localStorage.getItem(AppConfig.session.rememberKey);
        if (remembered) return JSON.parse(remembered);
        var session = sessionStorage.getItem(AppConfig.session.storageKey);
        if (session) return JSON.parse(session);
        return null;
      } catch (e) {
        return null;
      }
    },
    logout: function() {
      sessionStorage.removeItem(AppConfig.session.storageKey);
      localStorage.removeItem(AppConfig.session.rememberKey);
    }
  };
})();
