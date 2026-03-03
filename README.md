# Hybrid Roofing Forms Portal

A secure web-based portal for managing form submissions from your website. Review pending submissions, approve legitimate leads, flag spam, and add custom notes.

## Features

- 🔐 **Secure Authentication**: Login system with "Remember this device" functionality
- 📋 **Organized Tabs**: View submissions by status (Pending, Success, Spam, All)
- ✅ **Quick Actions**: Approve or delete submissions with one click
- 📝 **Custom Notes**: Add and save notes for each submission
- 🔄 **Real-time Sync**: Connected to Google Sheets for live data
- 📊 **Sort Options**: Order by newest or oldest submissions
- 🗑️ **Auto-Cleanup**: Automatically deletes submissions older than 90 days (configurable)
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ❓ **Built-in Tutorial**: Help guide for new users

## Quick Start

### 1. Configure Authentication

**IMPORTANT**: Set up your login credentials before deployment.

1. Navigate to `js/` folder
2. Copy `config.example.js` and rename it to `config.js`
3. Edit `config.js` and set your username and password:

```javascript
var AppConfig = {
  credentials: {
    username: 'your_username',
    password: 'your_secure_password'
  },
  // ... rest of config
};
```

4. **NEVER commit `config.js` to version control** (it's already in `.gitignore`)

**Default credentials** (for initial setup only):
- Username: `admin`
- Password: `HybridRoofing2026!`

### 2. Google Sheets Setup

1. Create a new Google Sheet or use your existing submissions sheet
2. Ensure your sheet has these tabs: `Pending`, `Success`, `Spam`, `All`
3. Each sheet should have these columns:
   - Time, Name, Email, Phone, Address, City, State, ZIP, Message, IP, Status, Notes

### 3. Deploy Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Delete any existing code
4. Copy and paste the code from `google-apps-script/Code.gs`
5. Click **Deploy > New deployment**
6. Choose type: **Web app**
7. Execute as: **Me**
8. Who has access: **Anyone**
9. Click **Deploy** and authorize permissions
10. Copy the **Web App URL**

### 4. Configure the Portal

1. Open `js/sheets.js`
2. Update `APPS_SCRIPT_URL` with your Web App URL
3. Update `SHEET_ID` with your Google Sheet ID (from the URL)
4. Update `API_KEY` if needed (Google Sheets API v4 key)

### 5. Deploy the Portal

Upload all files to your web server or hosting service. Make sure:
- All files maintain their folder structure
- `config.js` is NOT included in the deployment (keep it server-side only)
- HTTPS is enabled for secure login

## Authentication System

### Login Features

- **Secure Credentials**: Stored in `config.js` (not in source control)
- **Remember Device**: Users can stay logged in across browser sessions
- **Session Management**: 
  - Session storage for single sessions
  - Local storage for "remembered" devices
- **Auto-logout**: Manual logout clears all session data

### Security Notes

⚠️ **IMPORTANT**: This is a client-side authentication system suitable for internal use or trusted users. For production environments with sensitive data, consider:

1. Implementing server-side authentication
2. Using OAuth or other industry-standard auth protocols
3. Adding HTTPS/SSL certificates
4. Implementing rate limiting and brute-force protection
5. Regular password rotation
6. Multi-factor authentication (MFA)

### Changing Credentials

1. Edit `js/config.js`
2. Update `username` and `password` in the `credentials` object
3. Save the file
4. Clear browser storage (localStorage and sessionStorage) for logged-in users
5. Users will need to log in again with new credentials

## Usage Guide

### For Portal Users

1. **Login**: Enter your credentials and optionally check "Remember this device"

2. **Pending Submissions**: Review new form entries
   - Call or email the contact to verify legitimacy
   - Expand cards to see full details

3. **Approve Real Leads**: Click the ✓ checkmark button
   - Moves submission to Success category
   - Marks as approved in Google Sheet

4. **Flag Spam**: Click the 🗑️ trash button
   - Moves submission to Spam category
   - Use for invalid phone numbers, fake emails, or spam

5. **Add Notes**: 
   - Expand any submission card
   - Scroll to the Notes section
   - Type your notes and click "Save Notes"

6. **Sort & Filter**: Use the dropdown to sort by newest or oldest

7. **Logout**: Click "Sign Out" in the top right to end your session

## Auto-Delete Configuration

Submissions older than 90 days are automatically removed from Pending, Success, and All sheets (Spam is never deleted).

### Enable Auto-Delete

1. In the Apps Script editor, click the **⏰ Clock icon** (Triggers)
2. Click **+ Add Trigger**
3. Configure:
   - Function: `deleteOldSubmissions`
   - Event source: **Time-driven**
   - Type: **Day timer**
   - Time: **1am to 2am**
4. Click **Save**

### Testing

Run `testDeleteOldSubmissions` in Apps Script to preview deletions without actually deleting.

### Adjust Retention Period

Edit `google-apps-script/Code.gs`:
```javascript
var RETENTION_DAYS = 90; // Change to your desired number
```

## File Structure

```
Hybrid-Roofing-Forms-Portal/
├── index.html              # Main application page
├── .gitignore              # Excludes config.js from version control
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── config.js           # Credentials (NOT in git)
│   ├── config.example.js   # Template for config.js
│   ├── auth.js             # Authentication logic
│   ├── dashboard.js        # Main application logic
│   └── sheets.js           # Google Sheets API integration
├── google-apps-script/
│   ├── Code.gs             # Backend script
│   └── SETUP-GUIDE.md      # Detailed setup instructions
├── assets/
│   └── hybrid-logo-white.svg
└── README.md               # This file
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Client-side with localStorage/sessionStorage
- **Backend**: Google Apps Script
- **Data Storage**: Google Sheets
- **API**: Google Sheets API v4

## Troubleshooting

### Cannot Login

- Verify credentials in `js/config.js` match what you're entering
- Check browser console for JavaScript errors
- Ensure `config.js` exists (not just `config.example.js`)
- Clear browser cache and try again

### Data Not Loading After Login

- Check that `APPS_SCRIPT_URL` in `js/sheets.js` is correct
- Verify Google Sheets API key is valid
- Open browser console to see specific error messages
- Ensure you have an active internet connection

### "Remember This Device" Not Working

- Check browser localStorage is enabled
- Some browsers in private/incognito mode disable localStorage
- Clear browser data and try again

### Session Expires Immediately

- Without "Remember this device" checked, sessions use sessionStorage
- SessionStorage clears when browser/tab closes
- Check "Remember this device" for persistent login

## Contributing

This is a private internal tool. For changes:
1. Never commit `js/config.js`
2. Test authentication changes thoroughly
3. Document any new features in this README

## License

© 2026 Hybrid Roofing. All rights reserved.

## Support

For technical support, contact your system administrator or refer to the setup guides in `google-apps-script/SETUP-GUIDE.md`.
