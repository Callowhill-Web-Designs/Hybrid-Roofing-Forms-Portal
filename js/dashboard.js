/**
 * Hybrid Roofing Forms Portal — Dashboard
 *
 * Handles sidebar tab switching, data rendering, and refresh.
 */

(function () {
  'use strict';

  // ── Keep a reference to the current data for action handlers ──
  var currentData = { pending: [], success: [], spam: [], all: [] };

  // ── Track sort order for each tab (default: newest) ──
  var sortOrder = { pending: 'newest', success: 'newest', spam: 'newest', all: 'newest' };

  // ── Sidebar tab switching ─────────────────────────────────────
  var tabs   = document.querySelectorAll('.sidebar__tab');
  var panels = document.querySelectorAll('.tab-panel');

  function activateTab(tabName) {
    tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    panels.forEach(function (panel) {
      panel.classList.toggle('active', panel.dataset.panel === tabName);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(this.dataset.tab);
    });
  });

  // ── Summary columns shown on each card ────────────────────
  var SUMMARY_COLS = ['Time', 'Name', 'Address', 'Status'];
  // ── Detail columns shown when expanded ─────────────────────
  var DETAIL_COLS  = ['Email', 'Phone', 'City', 'State', 'ZIP', 'Message'];

  // ── Build accordion cards from an array of row objects ─────
  function buildCards(rows, tabName) {
    if (!rows || rows.length === 0) {
      return '<div class="empty-state">No submissions found.</div>';
    }

    var html = '';
    rows.forEach(function (row, i) {
      var statusVal = (row['Status'] || '').trim();
      var badgeCls  = statusVal ? 'badge badge--' + statusVal.toLowerCase().replace(/[^a-z]/g, '') : 'badge';

      html += '<div class="sub-card" data-index="' + i + '" data-tab="' + tabName + '">';

      // ── Summary row ──
      html += '<div class="sub-card__summary">';
      html += '  <div class="sub-card__fields">';
      html += '    <span class="sub-card__time">' + escapeHtml(row['Time'] || '') + '</span>';
      html += '    <span class="sub-card__name">' + escapeHtml(row['Name'] || '') + '</span>';
      if (statusVal) {
        html += '  <span class="' + badgeCls + '">' + escapeHtml(statusVal) + '</span>';
      }
      html += '    <span class="sub-card__address">' + escapeHtml(row['Address'] || '') + '</span>';
      html += '  </div>';
      html += '  <div class="sub-card__actions">';
      var statusLower = statusVal.toLowerCase();
      if (statusLower !== 'success') {
        html += '    <button type="button" class="btn-action btn-action--approve" title="Approve">';
        html += '      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        html += '    </button>';
      }
      if (statusLower !== 'spam') {
        html += '    <button type="button" class="btn-action btn-action--delete" title="Delete">';
        html += '      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
        html += '    </button>';
      }
      html += '  </div>';
      html += '</div>';

      // ── Detail panel (hidden by default) ──
      html += '<div class="sub-card__detail">';
      html += '  <div class="detail-grid">';
      DETAIL_COLS.forEach(function (col) {
        var val = row[col] || '';
        if (val) {
          var itemClass = (col === 'Message') ? 'detail-item detail-item--wide' : 'detail-item';
          html += '<div class="' + itemClass + '">';
          html += '  <span class="detail-label">' + escapeHtml(col) + '</span>';
          html += '  <span class="detail-value">' + escapeHtml(val) + '</span>';
          html += '</div>';
        }
      });
      html += '  </div>';
      
      // ── Notes section ──
      html += '  <div class="notes-section">';
      html += '    <label class="notes-label">Notes</label>';
      html += '    <textarea class="notes-textarea" placeholder="Add custom notes here..." rows="3">' + escapeHtml(row['Notes'] || '') + '</textarea>';
      html += '    <button type="button" class="btn-save-notes">Save Notes</button>';
      html += '  </div>';
      html += '</div>';

      html += '</div>'; // .sub-card
    });

    return html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Sort data by Time field ──────────────────────────────────
  function sortData(rows, order) {
    if (!rows || rows.length === 0) return rows;
    
    var sorted = rows.slice(); // Create a copy to avoid mutating original
    
    sorted.sort(function (a, b) {
      var timeA = new Date(a['Time'] || 0);
      var timeB = new Date(b['Time'] || 0);
      
      if (order === 'oldest') {
        return timeA - timeB; // Ascending
      } else {
        return timeB - timeA; // Descending (newest first)
      }
    });
    
    return sorted;
  }

  // ── Render data into the four tab panels ──────────────────────
  function renderAll(data) {
    currentData = data;
    
    // Sort each list according to its current sort order
    var sortedPending = sortData(data.pending, sortOrder.pending);
    var sortedSuccess = sortData(data.success, sortOrder.success);
    var sortedSpam = sortData(data.spam, sortOrder.spam);
    var sortedAll = sortData(data.all, sortOrder.all);
    
    document.getElementById('pending-list').innerHTML = buildCards(sortedPending, 'pending');
    document.getElementById('success-list').innerHTML = buildCards(sortedSuccess, 'success');
    document.getElementById('spam-list').innerHTML = buildCards(sortedSpam, 'spam');
    document.getElementById('all-list').innerHTML = buildCards(sortedAll, 'all');
    
    // Update currentData with sorted arrays for action handlers
    currentData.pending = sortedPending;
    currentData.success = sortedSuccess;
    currentData.spam = sortedSpam;
    currentData.all = sortedAll;
    
    // Update sort select UI to match current sort order
    updateSortSelectUI();
    
    bindCardEvents();
  }

  // ── Update sort select dropdowns to match current sort order ──
  function updateSortSelectUI() {
    document.getElementById('sort-pending').value = sortOrder.pending;
    document.getElementById('sort-success').value = sortOrder.success;
    document.getElementById('sort-spam').value = sortOrder.spam;
    document.getElementById('sort-all').value = sortOrder.all;
  }

  // ── Toggle expand/collapse on card click ───────────────────
  // ── Helper: set loading state on both action buttons in a card ──
  function setCardLoading(card, isLoading) {
    var buttons = card.querySelectorAll('.btn-action');
    buttons.forEach(function (btn) {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.classList.add('btn-action--loading');
      } else {
        btn.classList.remove('btn-action--loading');
      }
    });
  }

  function bindCardEvents() {
    document.querySelectorAll('.sub-card__summary').forEach(function (summary) {
      summary.addEventListener('click', function (e) {
        // Don't toggle when clicking action buttons
        if (e.target.closest('.btn-action')) return;
        var card = this.closest('.sub-card');
        card.classList.toggle('expanded');
      });
    });

    // ── Approve button handlers ──
    document.querySelectorAll('.btn-action--approve').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card    = this.closest('.sub-card');
        var index   = parseInt(card.dataset.index, 10);
        var tabName = card.dataset.tab;
        var rowData = currentData[tabName][index];

        if (!rowData) return;

        setCardLoading(card, true);

        SheetsService.approveRow(rowData)
          .then(function () {
            showNotification('Submission has been marked as a successful lead.', 'success');
            loadData();
          })
          .catch(function (err) {
            showNotification('Failed to approve: ' + err.message, 'error');
            setCardLoading(card, false);
          });
      });
    });

    // ── Delete / Spam button handlers ──
    document.querySelectorAll('.btn-action--delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card    = this.closest('.sub-card');
        var index   = parseInt(card.dataset.index, 10);
        var tabName = card.dataset.tab;
        var rowData = currentData[tabName][index];

        if (!rowData) return;

        setCardLoading(card, true);

        SheetsService.deleteRow(rowData)
          .then(function () {
            showNotification('Submission has been marked as spam.', 'error');
            loadData();
          })
          .catch(function (err) {
            showNotification('Failed to mark as spam: ' + err.message, 'error');
            setCardLoading(card, false);
          });
      });
    });

    // ── Save Notes button handlers ──
    document.querySelectorAll('.btn-save-notes').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card    = this.closest('.sub-card');
        var index   = parseInt(card.dataset.index, 10);
        var tabName = card.dataset.tab;
        var rowData = currentData[tabName][index];
        var textarea = card.querySelector('.notes-textarea');
        var notes = textarea.value.trim();

        if (!rowData) return;

        // Disable button and show loading
        btn.disabled = true;
        btn.textContent = 'Saving...';

        SheetsService.updateNotes(rowData, notes)
          .then(function (response) {
            showNotification('Notes saved successfully.', 'success');
            // Update the current data with the new notes
            currentData[tabName][index]['Notes'] = notes;
            btn.disabled = false;
            btn.textContent = 'Save Notes';
          })
          .catch(function (err) {
            showNotification('Failed to save notes: ' + err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Save Notes';
          });
      });
    });
  }

  // ── Notification system ────────────────────────────────────────
  function showNotification(message, type) {
    // Remove any existing notification
    var existing = document.querySelector('.notification');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.className = 'notification notification--' + (type || 'info');
    el.innerHTML =
      '<span class="notification__text">' + message + '</span>' +
      '<button class="notification__close" type="button">&times;</button>';

    document.body.appendChild(el);

    // Trigger animation
    requestAnimationFrame(function () {
      el.classList.add('notification--visible');
    });

    // Close button
    el.querySelector('.notification__close').addEventListener('click', function () {
      el.classList.remove('notification--visible');
      setTimeout(function () { el.remove(); }, 300);
    });

    // Auto-dismiss after 5s
    setTimeout(function () {
      if (el.parentNode) {
        el.classList.remove('notification--visible');
        setTimeout(function () { el.remove(); }, 300);
      }
    }, 5000);
  }

  // ── Loading / error states ────────────────────────────────────
  function showLoading() {
    var lists = ['pending-list', 'success-list', 'spam-list', 'all-list'];
    lists.forEach(function (id) {
      document.getElementById(id).innerHTML =
        '<div class="empty-state"><span class="spinner"></span> Loading submissions&hellip;</div>';
    });
  }

  function showError(err) {
    var msg = '<div class="empty-state error-state">Failed to load data. ' + escapeHtml(err.message) + '</div>';
    var lists = ['pending-list', 'success-list', 'spam-list', 'all-list'];
    lists.forEach(function (id) {
      document.getElementById(id).innerHTML = msg;
    });
  }

  // ── Fetch and render ──────────────────────────────────────────
  function loadData() {
    showLoading();
    SheetsService.fetchAll()
      .then(renderAll)
      .catch(showError);
  }

  // ── Refresh button ────────────────────────────────────────────
  var refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      loadData();
    });
  }

  // ── Sort select handlers ──────────────────────────────────────
  var sortSelects = document.querySelectorAll('.sort-select');
  sortSelects.forEach(function (select) {
    select.addEventListener('change', function () {
      var listName = this.dataset.list;
      sortOrder[listName] = this.value;
      
      // Re-render with the current data
      renderAll(currentData);
    });
  });

  // ── Tutorial modal handlers ───────────────────────────────────
  var tutorialModal = document.getElementById('tutorial-modal');
  var tutorialBtn = document.getElementById('tutorial-btn');
  var modalClose = tutorialModal.querySelector('.modal-close');
  var modalBtnClose = tutorialModal.querySelector('.btn-modal-close');
  var modalOverlay = tutorialModal.querySelector('.modal-overlay');

  function openTutorial() {
    tutorialModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeTutorial() {
    tutorialModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', openTutorial);
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeTutorial);
  }

  if (modalBtnClose) {
    modalBtnClose.addEventListener('click', closeTutorial);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeTutorial);
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && tutorialModal.classList.contains('active')) {
      closeTutorial();
    }
  });

  // ── Authentication-aware initialization ───────────────────────
  // Only load data after successful authentication
  window.addEventListener('auth-success', function() {
    loadData();
  });

  // Clear data on logout
  window.addEventListener('auth-logout', function() {
    currentData = { pending: [], success: [], spam: [], all: [] };
  });

  // If already authenticated (page refresh/remembered device), load data
  if (typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
    loadData();
  }
})();
