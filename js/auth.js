/**
 * Hybrid Roofing Forms Portal — Authentication
 *
 * Handles user login, session management, and "remember device" functionality.
 * Uses Netlify Functions for secure server-side authentication.
 */

var AuthService = (function () {
  'use strict';

  // ── Configuration ──
  var STORAGE_KEY = 'hybridRoofing_authToken';
  var REMEMBER_KEY = 'hybridRoofing_rememberDevice';

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

  function setSession(token, username, remember) {
    var sessionData = JSON.stringify({ 
      token: token,
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

  // ── Server Communication ──────────────────────────────────────
  
  /**
   * Authenticate user with Netlify Function
   */
  async function authenticate(username, password) {
    try {
      console.log('[Auth] Calling Netlify function for authentication...');
      var response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });
      
      var data = await response.json();
      console.log('[Auth] Server response:', data.success ? 'Success' : 'Failed');
      return data;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'Connection error' };
    }
  }

  /**
   * Validate session token with Netlify Function
   */
  async function validateSessionToken(token) {
    try {
      console.log('[Auth] Validating session token...');
      var response = await fetch('/.netlify/functions/validate-session?token=' + encodeURIComponent(token));
      var data = await response.json();
      console.log('[Auth] Token validation:', data.valid ? 'Valid' : 'Invalid');
      return data;
    } catch (error) {
      console.error('[Auth] Validation error:', error);
      return { valid: false };
    }
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

  function showLogin(errorMessage) {
    console.log('[Auth] Showing login screen');
    if (app) app.hidden = true;
    if (loginScreen) loginScreen.hidden = false;
    if (usernameInput) {
      usernameInput.value = '';
      usernameInput.focus();
    }
    if (passwordInput) passwordInput.value = '';
    if (rememberCheckbox) rememberCheckbox.checked = false;
    
    if (errorMessage && loginError) {
      loginError.textContent = errorMessage;
      loginError.hidden = false;
    } else if (loginError) {
      loginError.hidden = true;
    }
  }

  // ── Event: form submit ────────────────────────────────────────
  if (loginForm) {
    console.log('[Auth] Attaching submit event listener to login form');
    loginForm.addEventListener('submit', async function (e) {
      console.log('[Auth] Form submitted!');
      e.preventDefault();

      var username = usernameInput.value.trim();
      var password = passwordInput.value;
      var remember = rememberCheckbox.checked;

      // Disable form during submission
      var submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      console.log('[Auth] Authenticating user:', username, 'Remember:', remember);

      var result = await authenticate(username, password);
      
      if (result.success) {
        console.log('[Auth] Authentication successful');
        if (loginError) loginError.hidden = true;
        setSession(result.token, result.username, remember);
        showApp(result.username);
      } else {
        console.log('[Auth] Authentication failed');
        if (loginError) {
          loginError.textContent = result.error || 'Invalid username or password. Please try again.';
          loginError.hidden = false;
        }
        passwordInput.value = '';
        passwordInput.focus();
      }

      // Re-enable form
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
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
  (async function() {
    var session = getSession();
    console.log('[Auth] Checking existing session:', session ? 'Found' : 'None');
    
    if (session && session.token && session.username) {
      // Validate the token with the server
      var validation = await validateSessionToken(session.token);
      
      if (validation.valid) {
        console.log('[Auth] Session is valid, logging in automatically');
        showApp(session.username);
      } else {
        console.log('[Auth] Session is invalid or expired');
        clearSession();
        showLogin();
      }
    } else {
      showLogin();
    }
    
    console.log('[Auth] Initialization complete');
  })();
  } // End of init function

  // ── Public API (available immediately) ────────────────────────
  return {
    isAuthenticated: function() {
      var session = getSession();
      return session !== null && session.token !== null;
    },
    getSession: function() {
      return getSession();
    },
    logout: function() {
      clearSession();
    }
  };
})();
