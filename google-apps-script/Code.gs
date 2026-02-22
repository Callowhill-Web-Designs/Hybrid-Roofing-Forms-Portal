/**
 * Google Apps Script — Hybrid Roofing Forms Portal Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Deploy > New deployment
 * 5. Type = "Web app"
 * 6. Execute as = "Me"
 * 7. Who has access = "Anyone"
 * 8. Click Deploy and copy the Web App URL
 * 9. Paste the URL into js/sheets.js as the APPS_SCRIPT_URL value
 */

// ── Configuration ───────────────────────────────────────────────
var COLUMNS = ['Time', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Message', 'IP', 'Status'];

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;

    if (action === 'approve') {
      return handleApprove(params);
    } else if (action === 'delete') {
      return handleDelete(params);
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Also handle GET for CORS preflight / testing
function doGet(e) {
  return jsonResponse({ success: true, message: 'Hybrid Roofing API is running.' });
}

// ── Approve: set Status to "Success", move row to Success sheet, remove from Pending/Spam ──
function handleApprove(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rowData = params.rowData; // full row object

  // 1. Update status in the "All" sheet
  updateStatusInSheet(ss, 'All', rowData, 'Success');

  // 2. Remove from Pending sheet (if exists)
  removeRowFromSheet(ss, 'Pending', rowData);

  // 3. Remove from Spam sheet (if exists)
  removeRowFromSheet(ss, 'Spam', rowData);

  // 4. Add to Success sheet (if not already there)
  addRowToSheet(ss, 'Success', rowData, 'Success');

  return jsonResponse({ success: true, message: 'Submission approved and moved to Success.' });
}

// ── Delete: remove from Pending, Spam, and optionally All ──
function handleDelete(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rowData = params.rowData;

  // 1. Update status in "All" sheet to "Spam"
  updateStatusInSheet(ss, 'All', rowData, 'Spam');

  // 2. Remove from Pending
  removeRowFromSheet(ss, 'Pending', rowData);

  // 3. Remove from Success (if exists)
  removeRowFromSheet(ss, 'Success', rowData);

  // 4. Add to Spam sheet (if not already there)
  addRowToSheet(ss, 'Spam', rowData, 'Spam');

  return jsonResponse({ success: true, message: 'Submission marked as spam.' });
}

// ── Helper: find a row by matching Name + Email + Phone ──
// Avoids Time because Sheets stores dates as Date objects which stringify differently
function findRowIndex(sheet, rowData) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var nameIdx  = headers.indexOf('Name');
  var emailIdx = headers.indexOf('Email');
  var phoneIdx = headers.indexOf('Phone');

  var targetName  = String(rowData['Name']  || '').trim().toLowerCase();
  var targetEmail = String(rowData['Email'] || '').trim().toLowerCase();
  var targetPhone = String(rowData['Phone'] || '').trim().replace(/\D/g, '');

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowName  = String(row[nameIdx]  || '').trim().toLowerCase();
    var rowEmail = String(row[emailIdx] || '').trim().toLowerCase();
    var rowPhone = String(row[phoneIdx] || '').trim().replace(/\D/g, '');

    if (rowName === targetName && rowEmail === targetEmail && rowPhone === targetPhone) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

// ── Helper: update the Status column for a matched row ──
function updateStatusInSheet(ss, sheetName, rowData, newStatus) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var rowNum = findRowIndex(sheet, rowData);
  if (rowNum === -1) return;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var statusCol = headers.indexOf('Status');
  if (statusCol === -1) return;

  sheet.getRange(rowNum, statusCol + 1).setValue(newStatus);
}

// ── Helper: remove a row from a sheet ──
function removeRowFromSheet(ss, sheetName, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var rowNum = findRowIndex(sheet, rowData);
  if (rowNum === -1) return;

  sheet.deleteRow(rowNum);
}

// ── Helper: add a row to a sheet ──
function addRowToSheet(ss, sheetName, rowData, newStatus) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  // Check if already exists
  var existing = findRowIndex(sheet, rowData);
  if (existing !== -1) {
    // Just update status
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var statusCol = headers.indexOf('Status');
    if (statusCol !== -1) {
      sheet.getRange(existing, statusCol + 1).setValue(newStatus);
    }
    return;
  }

  // Build row array in header order
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = headers.map(function (h) {
    if (h.trim() === 'Status') return newStatus;
    return rowData[h.trim()] || '';
  });

  sheet.appendRow(newRow);
}

// ── Helper: JSON response with CORS headers ──
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
