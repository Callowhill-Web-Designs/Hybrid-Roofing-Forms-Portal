/**
 * Hybrid Roofing Forms Portal — Google Sheets Data Service
 *
 * Fetches submission data from Google Sheets API v4.
 */

var SheetsService = (function () {
  'use strict';

  var API_KEY    = 'AIzaSyC3KlLvjsVYN-vd6HGs9MV9MTP8whnpZhY';
  var SHEET_ID   = '1CcKTK6cII31hEhwr_qffXnq32e7YU9AttdRS4iuQxzI';
  var BASE_URL   = 'https://sheets.googleapis.com/v4/spreadsheets/' + SHEET_ID + '/values/';

  // ── IMPORTANT: Paste your deployed Apps Script Web App URL here ──
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQaNutqMFlOPvyX1Ff2CD8ShTCwPf029rcr6r89GgEapsTYHdHgu98tbYhLSR7E9dQ/exec';

  // Column headers we expect (order matters — must match sheet)
  var COLUMNS = ['Time', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Message', 'IP', 'Status', 'Notes'];

  /**
   * Fetch rows from a specific worksheet tab.
   * @param {string} sheetName - The worksheet name (Pending, Success, Spam, All)
   * @returns {Promise<Object[]>} Array of row objects keyed by column header
   */
  function fetchSheet(sheetName) {
    var url = BASE_URL + encodeURIComponent(sheetName) + '?key=' + API_KEY;

    return fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Google Sheets API error: ' + res.status + ' ' + res.statusText);
        }
        return res.json();
      })
      .then(function (data) {
        var rows = data.values;
        if (!rows || rows.length === 0) {
          return [];
        }

        // Use the first row as headers; fall back to COLUMNS constant
        var headers = rows[0] && rows[0].length ? rows[0] : COLUMNS;

        // Map remaining rows to objects
        return rows.slice(1).map(function (row) {
          var obj = {};
          headers.forEach(function (header, i) {
            obj[header.trim()] = (row[i] || '').toString().trim();
          });
          return obj;
        });
      });
  }

  /**
   * Fetch all four tabs in parallel.
   * @returns {Promise<{pending: Object[], success: Object[], spam: Object[], all: Object[]}>}
   */
  function fetchAll() {
    return Promise.all([
      fetchSheet('Pending'),
      fetchSheet('Success'),
      fetchSheet('Spam'),
      fetchSheet('All')
    ]).then(function (results) {
      return {
        pending: results[0],
        success: results[1],
        spam:    results[2],
        all:     results[3]
      };
    });
  }

  // Public API
  return {
    fetchSheet: fetchSheet,
    fetchAll:   fetchAll,
    COLUMNS:    COLUMNS,
    approveRow: approveRow,
    deleteRow:  deleteRow,
    updateNotes: updateNotes
  };

  /**
   * Send an action to the Apps Script backend.
   * @param {string} action - 'approve' or 'delete'
   * @param {Object} rowData - The full row object
   * @returns {Promise<Object>}
   */
  function postAction(action, rowData) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: action, rowData: rowData })
    })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Server error: ' + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      return data;
    });
  }

  /**
   * Mark a submission as approved (Success).
   */
  function approveRow(rowData) {
    return postAction('approve', rowData);
  }

  /**
   * Mark a submission as spam / delete.
   */
  function deleteRow(rowData) {
    return postAction('delete', rowData);
  }

  /**
   * Update notes for a submission.
   * @param {Object} rowData - The full row object
   * @param {string} notes - The notes text to save
   * @returns {Promise<Object>}
   */
  function updateNotes(rowData, notes) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'updateNotes', rowData: rowData, notes: notes })
    })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Server error: ' + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      return data;
    });
  }
})();
