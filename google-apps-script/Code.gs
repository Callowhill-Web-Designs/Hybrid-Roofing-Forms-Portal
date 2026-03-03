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
 *
 * AUTO-DELETE SETUP (for 90-day cleanup):
 * 1. In the Apps Script editor, click on the clock icon (Triggers) in the left sidebar
 * 2. Click "+ Add Trigger" (bottom right)
 * 3. Choose function: deleteOldSubmissions
 * 4. Choose event source: Time-driven
 * 5. Choose type of time-based trigger: Day timer
 * 6. Choose time of day: Pick a time (e.g., 1am to 2am)
 * 7. Click Save
 * This will automatically run the cleanup daily
 */

// ── Configuration ───────────────────────────────────────────────
var COLUMNS = ['Time', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Message', 'IP', 'Status', 'Notes'];
var RETENTION_DAYS = 90; // Delete submissions older than this many days

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;

    if (action === 'approve') {
      return handleApprove(params);
    } else if (action === 'delete') {
      return handleDelete(params);
    } else if (action === 'updateNotes') {
      return handleUpdateNotes(params);
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

// ── Update Notes: update the Notes column for a submission across all relevant sheets ──
function handleUpdateNotes(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rowData = params.rowData;
  var newNotes = params.notes || '';
  
  // Update notes in all sheets where this submission exists
  var sheetsToUpdate = ['Pending', 'Success', 'Spam', 'All'];
  var updatedCount = 0;
  
  sheetsToUpdate.forEach(function(sheetName) {
    var updated = updateNotesInSheet(ss, sheetName, rowData, newNotes);
    if (updated) updatedCount++;
  });
  
  if (updatedCount > 0) {
    return jsonResponse({ success: true, message: 'Notes updated successfully.', notes: newNotes });
  } else {
    return jsonResponse({ success: false, error: 'Submission not found in any sheet.' });
  }
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

// ── Helper: update the Notes column for a matched row ──
function updateNotesInSheet(ss, sheetName, rowData, newNotes) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  var rowNum = findRowIndex(sheet, rowData);
  if (rowNum === -1) return false;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var notesCol = headers.indexOf('Notes');
  
  // If Notes column doesn't exist, add it
  if (notesCol === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Notes');
    notesCol = sheet.getLastColumn() - 1;
  }

  sheet.getRange(rowNum, notesCol + 1).setValue(newNotes);
  return true;
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

// ── Auto-delete submissions older than 90 days ──────────────────
/**
 * Deletes rows older than RETENTION_DAYS from Pending, Success, and All sheets.
 * Spam sheet is NOT affected (keeps records indefinitely).
 * 
 * To enable automatic deletion:
 * 1. Click the clock icon (Triggers) in the left sidebar
 * 2. Add a time-driven trigger for this function to run daily
 */
function deleteOldSubmissions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsToClean = ['Pending', 'Success', 'All'];
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  
  var totalDeleted = 0;
  
  sheetsToClean.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return; // No data rows (only header)
    
    var headers = data[0];
    var timeIdx = headers.indexOf('Time');
    if (timeIdx === -1) return; // Time column not found
    
    // Track which rows to delete (working backwards to avoid index shifting)
    var rowsToDelete = [];
    
    for (var i = data.length - 1; i >= 1; i--) {
      var row = data[i];
      var timeValue = row[timeIdx];
      
      // Handle different date formats
      var rowDate;
      if (timeValue instanceof Date) {
        rowDate = timeValue;
      } else if (typeof timeValue === 'string' && timeValue.trim()) {
        rowDate = new Date(timeValue);
      } else {
        continue; // Skip rows without valid dates
      }
      
      // Check if date is valid and older than cutoff
      if (!isNaN(rowDate.getTime()) && rowDate < cutoffDate) {
        rowsToDelete.push(i + 1); // Convert to 1-based row number
      }
    }
    
    // Delete rows (already sorted in reverse order)
    rowsToDelete.forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
      totalDeleted++;
    });
    
    if (rowsToDelete.length > 0) {
      Logger.log('Deleted ' + rowsToDelete.length + ' old rows from ' + sheetName);
    }
  });
  
  Logger.log('Total rows deleted: ' + totalDeleted);
  return totalDeleted;
}

/**
 * Manual test function to see what would be deleted without actually deleting.
 * Run this first to verify the function works correctly.
 */
function testDeleteOldSubmissions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsToClean = ['Pending', 'Success', 'All'];
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  
  Logger.log('Testing deletion for submissions older than: ' + cutoffDate.toISOString());
  Logger.log('Cutoff: ' + RETENTION_DAYS + ' days');
  
  sheetsToClean.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(sheetName + ': Sheet not found');
      return;
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log(sheetName + ': No data rows');
      return;
    }
    
    var headers = data[0];
    var timeIdx = headers.indexOf('Time');
    if (timeIdx === -1) {
      Logger.log(sheetName + ': Time column not found');
      return;
    }
    
    var oldRowCount = 0;
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var timeValue = row[timeIdx];
      
      var rowDate;
      if (timeValue instanceof Date) {
        rowDate = timeValue;
      } else if (typeof timeValue === 'string' && timeValue.trim()) {
        rowDate = new Date(timeValue);
      } else {
        continue;
      }
      
      if (!isNaN(rowDate.getTime()) && rowDate < cutoffDate) {
        oldRowCount++;
        Logger.log(sheetName + ' - Row ' + (i + 1) + ': ' + rowDate.toISOString() + ' (would be deleted)');
      }
    }
    
    Logger.log(sheetName + ': ' + oldRowCount + ' rows would be deleted');
  });
}
