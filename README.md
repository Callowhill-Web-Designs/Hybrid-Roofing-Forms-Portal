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

# Hybrid Roofing Forms Portal

A secure web-based portal for managing form submissions from your website. Review pending submissions, approve legitimate leads, flag spam, and add custom notes.

## Features

- 🔐 **Secure Authentication**: Server-side authentication using Netlify Functions with JWT tokens
- 📋 **Organized Tabs**: View submissions by status (Pending, Success, Spam, All)
- ✅ **Quick Actions**: Approve or delete submissions with one click
- 📝 **Custom Notes**: Add and save notes for each submission
- 🔄 **Real-time Sync**: Connected to Google Sheets for live data
- 📊 **Sort Options**: Order by newest or oldest submissions
- 🗑️ **Auto-Cleanup**: Automatically deletes submissions older than 90 days (configurable)
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ❓ **Built-in Tutorial**: Help guide for new users

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs the `jsonwebtoken` package required for Netlify Functions.

### 2. Configure Authentication (Netlify Environment Variables)

Authentication credentials are stored securely in Netlify's environment variables (not in code).

**In Netlify Dashboard:**

1. Go to your site's **Site configuration > Environment variables**
2. Add the following variables:
   - `AUTH_USERNAME` = Your desired username (e.g., `admin`)
   - `AUTH_PASSWORD` = Your desired password (e.g., `hybrid2026`)
   - `JWT_SECRET` = A random secret key for JWT signing (e.g., `your-super-secret-jwt-key-12345`)

**For Local Development (using Netlify CLI):**

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run `netlify dev` to test locally
3. Create a `.env` file in the root (already in `.gitignore`):

```env
AUTH_USERNAME=admin
AUTH_PASSWORD=hybrid2026
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Google Sheets Setup

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

### 5. Deploy to Netlify

**Option A: Deploy via Git (Recommended)**

1. Push your code to GitHub (or GitLab/Bitbucket)
2. Log in to [Netlify](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect your Git repository
5. Configure build settings (default settings should work)
6. Set the environment variables (see Step 2)
7. Click "Deploy site"

**Option B: Deploy via Netlify CLI**

```bash
netlify login
netlify init
netlify deploy --prod
```

**Important**: Make sure you've set the environment variables in Netlify before testing login!

## Authentication System

### How It Works

- **Server-side Validation**: Credentials are verified by Netlify Functions (not exposed to client)
- **JWT Tokens**: Upon successful login, the server issues a JSON Web Token
- **Token Storage**: 
  - Session storage for single sessions
  - Local storage for "remembered" devices
- **Automatic Validation**: Tokens are validated on page load to maintain sessions
- **Secure**: Credentials never leave the server, preventing client-side exposure

### Netlify Functions

Two serverless functions handle authentication:

1. **`/netlify/functions/login`**: Validates credentials and issues JWT tokens
2. **`/netlify/functions/validate-session`**: Validates existing tokens

### Security Features

✅ **Server-side authentication** - Credentials never exposed to client
✅ **JWT tokens** - Industry-standard token-based auth
✅ **Environment variables** - Credentials stored securely in Netlify
✅ **Token expiration** - 24-hour token lifetime
✅ **Remember device** - Optional persistent login
✅ **HTTPS** - Netlify provides SSL certificates automatically

### Changing Credentials

1. Go to Netlify Dashboard > Site configuration > Environment variables
2. Update `AUTH_USERNAME` and/or `AUTH_PASSWORD`
3. Click "Save"
4. Redeploy your site (or trigger auto-deploy)
5. Existing logged-in users will need to log in again

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
├── netlify.toml            # Netlify configuration
├── package.json            # Dependencies (jsonwebtoken)
├── .gitignore              # Git ignore rules
├── .env                    # Local environment variables (not in git)
├── netlify/
│   └── functions/          # Netlify Functions (serverless)
│       ├── login.js        # Authentication endpoint
│       └── validate-session.js  # Session validation endpoint
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── auth.js             # Authentication logic (client-side)
│   ├── dashboard.js        # Main application logic
│   └── sheets.js           # Google Sheets API integration
├── google-apps-script/
│   ├── Code.gs             # Backend script
│   └── SETUP-GUIDE.md      # Detailed setup instructions
├── assets/
│   ├── favicons/           # Site favicons
│   ├── hybrid-logo-white.svg
│   └── hybrid-logo-black.svg
└── README.md               # This file
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Netlify Functions (serverless) with JWT tokens
- **Hosting**: Netlify (with automatic HTTPS)
- **Backend**: Google Apps Script + Netlify Functions
- **Data Storage**: Google Sheets
- **API**: Google Sheets API v4
- **Security**: Server-side credential validation, JWT tokens
- **API**: Google Sheets API v4

## Troubleshooting

### Cannot Login

- **Check Environment Variables**: Verify `AUTH_USERNAME`, `AUTH_PASSWORD`, and `JWT_SECRET` are set in Netlify
- **Redeploy Site**: After changing environment variables, trigger a new deployment
- **Check Browser Console**: Look for network errors or function call failures
- **Test Locally**: Run `netlify dev` to test Netlify Functions locally
- **Clear Browser Storage**: Clear localStorage and sessionStorage, then try again

### "Connection Error" or "Server Configuration Error"

- Environment variables are not set in Netlify
- Netlify Functions failed to deploy (check Netlify build logs)
- Missing `jsonwebtoken` dependency (run `npm install`)

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
- JWT tokens expire after 24 hours (configurable in `netlify/functions/login.js`)

### Netlify Functions Not Working Locally

- Install Netlify CLI: `npm install -g netlify-cli`
- Run `netlify dev` (not `npm start`) to test functions locally
- Create a `.env` file with required environment variables
- Ensure `node_modules` directory exists (run `npm install`)

## Contributing

This is a private internal tool. For changes:
1. Never commit `.env` files with credentials
2. Test authentication changes thoroughly using `netlify dev`
3. Update environment variables in Netlify dashboard after deployment
3. Document any new features in this README

## License

© 2026 Hybrid Roofing. All rights reserved.

## Support

For technical support, contact your system administrator or refer to the setup guides in `google-apps-script/SETUP-GUIDE.md`.
