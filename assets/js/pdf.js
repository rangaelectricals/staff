(function () {
  const safe = (v) =>
    v === undefined || v === null || v === "" ? "-" : String(v);

  // ─── Build the printable HTML ────────────────────────────────────────────────
  function buildPrintHtml(staff) {
    const fileId = window.driveLinks
      ? window.driveLinks.extractFileId(staff.photo)
      : null;
    const thumbUrl = fileId
      ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w300-h300`
      : "";

    const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23e2e8f0' rx='8'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%2394a3b8'/%3E%3Cellipse cx='60' cy='96' rx='34' ry='22' fill='%2394a3b8'/%3E%3C/svg%3E`;

    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const row = (label, value) =>
      `<div class="field">
        <span class="label">${label}</span>
        <span class="value">${safe(value)}</span>
      </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${safe(staff.fullName)} – Staff Profile</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #111827;
      padding: 0;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #f97316 0%, #eab308 100%);
      padding: 28px 32px;
      display: flex;
      align-items: center;
      gap: 24px;
      page-break-inside: avoid;
    }
    .photo-wrap {
      width: 100px;
      height: 100px;
      border-radius: 10px;
      overflow: hidden;
      border: 3px solid rgba(255,255,255,0.6);
      flex-shrink: 0;
      background: rgba(255,255,255,0.2);
    }
    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .header-info { flex: 1; }
    .header-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.75);
      margin-bottom: 4px;
    }
    .header-name {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
      line-height: 1.2;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.95);
      color: #f97316;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    .header-mobile {
      font-size: 12px;
      color: rgba(255,255,255,0.85);
    }

    /* ── Body ── */
    .body { padding: 24px 32px; }

    /* ── Section ── */
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    /* ── Grid ── */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
    }
    .grid-1 { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .field {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .label {
      display: block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #6b7280;
      margin-bottom: 3px;
    }
    .value {
      display: block;
      font-size: 12px;
      color: #1e293b;
      font-weight: 500;
    }

    /* ── Footer ── */
    .footer {
      margin: 0 32px;
      padding: 12px 0 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9ca3af;
      page-break-inside: avoid;
    }

    /* ── Print ── */
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="photo-wrap">
      <img
        src="${thumbUrl || avatarSvg}"
        alt="${safe(staff.fullName)}"
        onerror="this.onerror=null;this.src='${avatarSvg}'"
      />
    </div>
    <div class="header-info">
      <div class="header-label">Staff Profile</div>
      <div class="header-name">${safe(staff.fullName)}</div>
      <div class="badge">${safe(staff.designation)}</div>
      <div class="header-mobile">${safe(staff.mobile)}</div>
    </div>
  </div>

  <!-- Body -->
  <div class="body">

    <!-- Personal Information -->
    <div class="section">
      <div class="section-title">
        <span class="section-dot" style="background:#3b82f6;"></span>
        Personal Information
      </div>
      <div class="grid-2">
        ${row("Date of Birth", window.appUi ? window.appUi.formatDate(staff.dob) : staff.dob)}
        ${row("Blood Group", staff.bloodGroup)}
        ${row("Mobile", staff.mobile)}
        ${row("Designation", staff.designation)}
      </div>
      <div class="grid-1" style="margin-top:10px;">
        ${row("Address", staff.address)}
      </div>
    </div>

    <!-- Identity Details -->
    <div class="section">
      <div class="section-title">
        <span class="section-dot" style="background:#10b981;"></span>
        Identity Details
      </div>
      <div class="grid-2">
        ${row("Aadhaar Number", staff.aadhaarNumber)}
        ${row("Driving License", staff.drivingLicense)}
      </div>
    </div>

    <!-- Emergency Contact -->
    <div class="section">
      <div class="section-title">
        <span class="section-dot" style="background:#f97316;"></span>
        Emergency Contact
      </div>
      <div class="grid-2">
        ${row("Name", staff.emergencyContactName)}
        ${row("Mobile", staff.emergencyMobile)}
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Staff Management System &nbsp;|&nbsp; Confidential</span>
    <span>Generated: ${today}</span>
  </div>

  <script>
    // Wait for photo to load (or fail), then print
    var img = document.querySelector('.photo-wrap img');
    function doPrint() { window.print(); }
    if (img.complete) {
      setTimeout(doPrint, 300);
    } else {
      img.addEventListener('load',  function() { setTimeout(doPrint, 300); });
      img.addEventListener('error', function() { setTimeout(doPrint, 300); });
    }
  <\/script>
</body>
</html>`;
  }

  // ─── Main ────────────────────────────────────────────────────────────────────
  async function downloadProfilePdf(staff) {
    const overlay = document.getElementById("pdf-overlay");
    const btn = document.getElementById("btn-pdf");
    if (overlay) overlay.style.display = "flex";
    if (btn) btn.disabled = true;

    try {
      const html = buildPrintHtml(staff);
      const win = window.open("", "_blank");

      if (!win) {
        throw new Error(
          "Popup blocked. Please allow popups for this site and try again."
        );
      }

      win.document.write(html);
      win.document.close();

    } finally {
      // Give the new window a moment to appear, then hide our overlay
      setTimeout(() => {
        if (overlay) overlay.style.display = "none";
        if (btn) btn.disabled = false;
      }, 600);
    }
  }

  window.pdfUtil = { downloadProfilePdf };
})();
