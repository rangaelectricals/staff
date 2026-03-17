# Staff Management Web Application

A mobile-responsive Staff Management web app using Google Sheets as database and Google Apps Script as backend API.

## Tech Stack
- HTML5
- TailwindCSS + DaisyUI (CDN)
- Vanilla JavaScript (Fetch/AJAX)
- Google Sheets + Google Apps Script

## Pages
- `dashboard.html`
- `staff-list.html`
- `staff-profile.html?id=<staffId>`
- `add-staff.html`

## Google Sheet Setup
1. Create a Google Sheet.
2. Rename first sheet to `STAFF_DETAILS`.
3. Set headers exactly in row 1:
   - `Staff ID`
   - `Timestamp`
   - `Full Name`
   - `Date of Birth`
   - `Mobile`
   - `Address`
   - `Aadhaar Number`
   - `Driving License`
   - `Emergency Contact Name`
   - `Emergency Mobile`
   - `Aadhaar Image`
   - `License Image`
   - `Photo`
   - `Blood Group`
   - `Designation`

## Apps Script Deployment
1. Open the Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Create these script files and paste contents from:
   - `google-apps-script/Code.gs`
   - `google-apps-script/staff.gs`
   - `google-apps-script/response.gs`
4. Save project.
5. Click `Deploy > New deployment`.
6. Type: `Web app`.
7. Execute as: `Me`.
8. Who has access: `Anyone` (or `Anyone with link` based on your need).
9. Deploy and copy Web App URL.

## Frontend Configuration
1. Open `assets/js/config.js`.
2. Replace:
   - `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   with your deployed Apps Script URL.

## Run Locally
Open with any static server.

Example (PowerShell):
```powershell
cd "k:\PROJECT 2.0\STAFF-DETIALS"
python -m http.server 5500
```
Then open:
- `http://localhost:5500/dashboard.html`

## Features
- Dashboard stats cards:
  - Total Staff
  - Drivers
  - Electricians
  - New Staff Added (current month)
- Staff listing with:
  - Search by name/mobile/designation
  - Pagination
  - Responsive table + mobile cards
- Staff profile page with:
  - Personal and identity details
  - Document preview/download/share (Aadhaar/License/Photo)
  - QR code linking to profile URL
  - PDF export via `html2pdf.js`
- Add Staff form via AJAX

## API Contract
### GET staff
- `GET <WEB_APP_URL>?action=getStaff&page=1&pageSize=10&name=&mobile=&designation=`
- Optional single profile lookup:
  - `GET ...?action=getStaff&id=STF-...`

### Add staff
- `POST <WEB_APP_URL>` with form-urlencoded:
  - `action=addStaff`
  - `payload={...json...}`

### Update staff
- `POST <WEB_APP_URL>` with:
  - `action=updateStaff`
  - `payload={ id, ...fields }`

### Delete staff
- `POST <WEB_APP_URL>` with:
  - `action=deleteStaff`
  - `payload={ id }`

## Notes
- Document fields should be Google Drive links.
- Drive links are transformed to preview/download URLs client-side.
- Keep links publicly viewable if users need direct document access.
