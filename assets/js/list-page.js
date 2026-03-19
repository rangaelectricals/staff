(function () {
  const state = {
    page: 1,
    pageSize: window.APP_CONFIG.PAGE_SIZE,
    total: 0,
    records: [],
    filters: { name: "", mobile: "", designation: "" },
    isLoading: false,
    bulkVerifiedRows: [],
    bulkInvalidRows: [],
  };

  const EXPORT_HEADERS = [
    "Staff ID",
    "Timestamp",
    "Full Name",
    "Date of Birth",
    "Mobile",
    "Address",
    "Aadhaar Number",
    "Driving License",
    "Emergency Contact Name",
    "Emergency Mobile",
    "Aadhaar Image",
    "License Image",
    "Photo",
    "Blood Group",
    "Designation",
  ];

  const BULK_HEADERS = [
    "Full Name",
    "Date of Birth",
    "Mobile",
    "Address",
    "Aadhaar Number",
    "Driving License",
    "Emergency Contact Name",
    "Emergency Mobile",
    "Aadhaar Image",
    "License Image",
    "Photo",
    "Blood Group",
    "Designation",
  ];

  const BULK_KEY_MAP = {
    "Full Name": "fullName",
    "Date of Birth": "dob",
    "Mobile": "mobile",
    "Address": "address",
    "Aadhaar Number": "aadhaarNumber",
    "Driving License": "drivingLicense",
    "Emergency Contact Name": "emergencyContactName",
    "Emergency Mobile": "emergencyMobile",
    "Aadhaar Image": "aadhaarImage",
    "License Image": "licenseImage",
    "Photo": "photo",
    "Blood Group": "bloodGroup",
    "Designation": "designation",
  };

  const REQUIRED_BULK_KEYS = [
    "fullName",
    "dob",
    "mobile",
    "address",
    "aadhaarNumber",
    "photo",
    "bloodGroup",
    "designation",
  ];

  function renderTableSkeletonRows() {
    const body = document.getElementById("staff-table-body");
    if (!body) return;

    body.innerHTML = Array.from({ length: 6 }).map(() => `
      <tr>
        <td><div class="staff-thumb skeleton-3d-avatar skeleton-3d-float"></div></td>
        <td><div class="skeleton-3d-text skeleton-3d-float" style="height:12px;width:78%;"></div></td>
        <td><div class="skeleton-3d-text skeleton-3d-float" style="height:12px;width:62%;"></div></td>
        <td><div class="skeleton-3d-text skeleton-3d-float" style="height:22px;width:96px;"></div></td>
        <td><div class="skeleton-3d-text skeleton-3d-float" style="height:22px;width:70px;"></div></td>
        <td>
          <div class="staff-action-group">
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:62px;"></div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:62px;"></div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:62px;"></div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:48px;"></div>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function renderCardSkeletonRows() {
    const root = document.getElementById("staff-card-list");
    if (!root) return;

    root.innerHTML = Array.from({ length: 4 }).map(() => `
      <article class="sys-card">
        <div class="p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="staff-thumb skeleton-3d-avatar skeleton-3d-float" style="width:74px;height:74px;"></div>
            <div class="flex-1 min-w-0 space-y-2">
              <div class="skeleton-3d-text skeleton-3d-float" style="height:12px;width:70%;"></div>
              <div class="skeleton-3d-text skeleton-3d-float" style="height:20px;width:108px;"></div>
            </div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:20px;width:64px;"></div>
          </div>
          <div class="skeleton-3d-text skeleton-3d-float mb-3" style="height:12px;width:50%;"></div>
          <div class="staff-action-group">
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:62px;"></div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:62px;"></div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:62px;"></div>
            <div class="skeleton-3d-text skeleton-3d-float" style="height:28px;width:48px;"></div>
          </div>
        </div>
      </article>
    `).join("");
  }

  function toggleLoading(isLoading) {
    state.isLoading = isLoading;
    const loading = document.getElementById("staff-loading-state");
    const empty = document.getElementById("staff-empty-state");
    const tableCard = document.querySelector(".sys-card.hidden.md\\:block");
    const mobileList = document.getElementById("staff-card-list");
    const pagination = document.getElementById("pagination-controls");

    if (loading) loading.classList.add("hidden");
    if (empty) empty.classList.add("hidden");
    if (tableCard) tableCard.classList.toggle("opacity-80", isLoading);
    if (mobileList) mobileList.classList.toggle("opacity-90", isLoading);
    if (pagination) pagination.classList.toggle("pointer-events-none", isLoading);

    if (isLoading) {
      renderTableSkeletonRows();
      renderCardSkeletonRows();
    }
  }

  function renderEmptyState() {
    const empty = document.getElementById("staff-empty-state");
    const body = document.getElementById("staff-table-body");
    const mobile = document.getElementById("staff-card-list");
    if (!empty || !body || !mobile) return;

    if (state.isLoading) {
      empty.classList.add("hidden");
      return;
    }

    const hasData = state.records.length > 0;
    empty.classList.toggle("hidden", hasData);
    if (!hasData) {
      body.innerHTML = "";
      mobile.innerHTML = "";
    }
  }

  const AVATAR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23e2e8f0' rx='8'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%2394a3b8'/%3E%3Cellipse cx='60' cy='96' rx='34' ry='22' fill='%2394a3b8'/%3E%3C/svg%3E`;

  function thumbUrl(driveUrl, size = 120) {
    if (!driveUrl) return "";
    if (window.driveLinks && typeof window.driveLinks.toDisplayUrl === "function") {
      return window.driveLinks.toDisplayUrl(driveUrl, size);
    }
    return String(driveUrl || "").trim();
  }

  function profileLink(id) {
    return `staff-profile.html?id=${encodeURIComponent(id)}`;
  }

  function normalizeHeaderName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateYmd(input) {
    const str = String(input || "").trim();
    if (!str) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }

    const dt = new Date(str);
    if (!Number.isNaN(dt.getTime())) {
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    }

    return "";
  }

  function parseExcelDate(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = value * 24 * 60 * 60 * 1000;
      const dt = new Date(excelEpoch.getTime() + ms);
      return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
    }
    return formatDateYmd(value);
  }

  function normalizeName(value) {
    return String(value || "staff")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-]/g, "")
      .toUpperCase();
  }

  function buildDownloadFileName(staff, docKey) {
    const staffName = normalizeName(staff.fullName || "STAFF");
    const map = {
      aad: "AAD",
      dl: "DL",
      photo: "PHOTO",
    };
    const suffix = map[docKey] || "DOC";
    return `${staffName}_${suffix}`;
  }

  function getBulkElements() {
    return {
      fileInput: document.getElementById("bulk-file"),
      summary: document.getElementById("bulk-verify-summary"),
      errorsWrap: document.getElementById("bulk-verify-errors"),
      errorsBody: document.getElementById("bulk-verify-errors-body"),
      btnUpload: document.getElementById("btn-upload-bulk"),
    };
  }

  function renderBulkSummary(total, valid, invalid) {
    const { summary } = getBulkElements();
    if (!summary) return;
    summary.classList.remove("hidden");
    summary.innerHTML = `
      <div class="flex flex-wrap gap-3 items-center">
        <span class="badge badge-neutral">Rows: ${total}</span>
        <span class="badge badge-success">Valid: ${valid}</span>
        <span class="badge badge-error">Invalid: ${invalid}</span>
      </div>
      <p class="mt-2 text-xs text-slate-600">Upload button stays enabled only when at least one valid row is verified.</p>
    `;
  }

  function renderBulkErrors(errors) {
    const { errorsWrap, errorsBody } = getBulkElements();
    if (!errorsWrap || !errorsBody) return;

    if (!errors.length) {
      errorsWrap.classList.add("hidden");
      errorsBody.innerHTML = "";
      return;
    }

    errorsWrap.classList.remove("hidden");
    errorsBody.innerHTML = errors.slice(0, 20).map((item) => `
      <tr>
        <td>${item.row}</td>
        <td>${item.errors.join(", ")}</td>
      </tr>
    `).join("");
  }

  function setUploadEnabled(enabled) {
    const { btnUpload } = getBulkElements();
    if (!btnUpload) return;
    btnUpload.disabled = !enabled;
  }

  function styleCell(ws, cellAddress, style) {
    if (!ws[cellAddress]) return;
    ws[cellAddress].s = style;
  }

  function exportStyledExcel(records) {
    if (!window.XLSX || !window.XLSX.utils) {
      window.appUi.showToast("Excel library not loaded", "error");
      return;
    }

    const title = "RANGA ELECTRICALS - STAFF LIST";
    const now = new Date();
    const generatedAt = `Generated: ${now.toLocaleString()}`;
    const rows = records.map((staff) => [
      staff.id || "",
      staff.timestamp || "",
      staff.fullName || "",
      staff.dob || "",
      staff.mobile || "",
      staff.address || "",
      staff.aadhaarNumber || "",
      staff.drivingLicense || "",
      staff.emergencyContactName || "",
      staff.emergencyMobile || "",
      staff.aadhaarImage || "",
      staff.licenseImage || "",
      staff.photo || "",
      staff.bloodGroup || "",
      staff.designation || "",
    ]);

    const aoa = [
      [title],
      [generatedAt],
      [],
      EXPORT_HEADERS,
      ...rows,
    ];

    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: EXPORT_HEADERS.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: EXPORT_HEADERS.length - 1 } },
    ];

    ws["!cols"] = [
      { wch: 21 }, { wch: 20 }, { wch: 24 }, { wch: 14 }, { wch: 14 },
      { wch: 36 }, { wch: 20 }, { wch: 20 }, { wch: 24 }, { wch: 16 },
      { wch: 32 }, { wch: 32 }, { wch: 32 }, { wch: 14 }, { wch: 18 },
    ];

    ws["!rows"] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];

    const titleStyle = {
      font: { name: "Calibri", bold: true, color: { rgb: "FFFFFFFF" }, sz: 14 },
      fill: { fgColor: { rgb: "FF0F766E" } },
      alignment: { horizontal: "center", vertical: "center", indent: 1 },
      border: {
        top: { style: "thin", color: { rgb: "FF0B4F49" } },
        bottom: { style: "thin", color: { rgb: "FF0B4F49" } },
        left: { style: "thin", color: { rgb: "FF0B4F49" } },
        right: { style: "thin", color: { rgb: "FF0B4F49" } },
      },
    };

    const subtitleStyle = {
      font: { name: "Calibri", italic: true, color: { rgb: "FF334155" }, sz: 10 },
      fill: { fgColor: { rgb: "FFE2E8F0" } },
      alignment: { horizontal: "left", vertical: "center", indent: 1 },
      border: {
        top: { style: "thin", color: { rgb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { rgb: "FFCBD5E1" } },
        left: { style: "thin", color: { rgb: "FFCBD5E1" } },
        right: { style: "thin", color: { rgb: "FFCBD5E1" } },
      },
    };

    const headerStyle = {
      font: { name: "Calibri", bold: true, color: { rgb: "FFFFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "FF1E3A8A" } },
      alignment: { horizontal: "left", vertical: "center", wrapText: true, indent: 1 },
      border: {
        top: { style: "thin", color: { rgb: "FF1E3A8A" } },
        bottom: { style: "thin", color: { rgb: "FF1E3A8A" } },
        left: { style: "thin", color: { rgb: "FF1E3A8A" } },
        right: { style: "thin", color: { rgb: "FF1E3A8A" } },
      },
    };

    const rowStyleOdd = {
      font: { name: "Calibri", color: { rgb: "FF0F172A" }, sz: 10 },
      fill: { fgColor: { rgb: "FFFFFFFF" } },
      alignment: { horizontal: "left", vertical: "top", wrapText: true, indent: 1 },
      border: {
        top: { style: "thin", color: { rgb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { rgb: "FFE2E8F0" } },
        left: { style: "thin", color: { rgb: "FFE2E8F0" } },
        right: { style: "thin", color: { rgb: "FFE2E8F0" } },
      },
    };

    const rowStyleEven = {
      font: { name: "Calibri", color: { rgb: "FF0F172A" }, sz: 10 },
      fill: { fgColor: { rgb: "FFF8FAFC" } },
      alignment: { horizontal: "left", vertical: "top", wrapText: true, indent: 1 },
      border: {
        top: { style: "thin", color: { rgb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { rgb: "FFE2E8F0" } },
        left: { style: "thin", color: { rgb: "FFE2E8F0" } },
        right: { style: "thin", color: { rgb: "FFE2E8F0" } },
      },
    };

    styleCell(ws, "A1", titleStyle);
    styleCell(ws, "A2", subtitleStyle);

    for (let c = 0; c < EXPORT_HEADERS.length; c++) {
      const headerCell = window.XLSX.utils.encode_cell({ r: 3, c });
      styleCell(ws, headerCell, headerStyle);
    }

    for (let r = 4; r < 4 + rows.length; r++) {
      for (let c = 0; c < EXPORT_HEADERS.length; c++) {
        const cell = window.XLSX.utils.encode_cell({ r, c });
        styleCell(ws, cell, (r % 2 === 0) ? rowStyleEven : rowStyleOdd);
      }
    }

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Staff List");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    window.XLSX.writeFile(wb, `STAFF_LIST_${stamp}.xlsx`);
  }

  function buildTemplateWorkbook() {
    if (!window.XLSX || !window.XLSX.utils) {
      window.appUi.showToast("Excel library not loaded", "error");
      return;
    }

    const sample = [
      "Ravi Kumar",
      "1998-02-11",
      "9876543210",
      "No. 21, Gandhi Street, Chennai",
      "123412341234",
      "TN01 20190012345",
      "Suresh Kumar",
      "9876543201",
      "",
      "",
      "https://drive.google.com/file/d/EXAMPLE/view",
      "O+",
      "Driver",
    ];

    const ws = window.XLSX.utils.aoa_to_sheet([BULK_HEADERS, sample]);
    ws["!cols"] = BULK_HEADERS.map(() => ({ wch: 24 }));

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Bulk Staff Template");
    window.XLSX.writeFile(wb, "STAFF_BULK_TEMPLATE.xlsx");
  }

  function mapRowToPayload(rawRow) {
    const payload = {};
    Object.keys(rawRow).forEach((key) => {
      const normalizedKey = normalizeHeaderName(key);
      const foundHeader = BULK_HEADERS.find((header) => normalizeHeaderName(header) === normalizedKey);
      if (!foundHeader) return;
      const payloadKey = BULK_KEY_MAP[foundHeader];
      payload[payloadKey] = String(rawRow[key] ?? "").trim();
    });

    payload.dob = parseExcelDate(rawRow["Date of Birth"] || payload.dob);
    return payload;
  }

  function validateBulkPayload(payload) {
    const errors = [];

    REQUIRED_BULK_KEYS.forEach((key) => {
      if (!String(payload[key] || "").trim()) {
        errors.push(`Missing ${key}`);
      }
    });

    if (payload.mobile && !/^\d{10}$/.test(payload.mobile)) {
      errors.push("Mobile must be 10 digits");
    }

    if (payload.emergencyMobile && !/^\d{10}$/.test(payload.emergencyMobile)) {
      errors.push("Emergency mobile must be 10 digits");
    }

    if (payload.aadhaarNumber && !/^\d{12}$/.test(payload.aadhaarNumber)) {
      errors.push("Aadhaar number must be 12 digits");
    }

    if (payload.dob && !/^\d{4}-\d{2}-\d{2}$/.test(payload.dob)) {
      errors.push("Date of birth must be YYYY-MM-DD");
    }

    return errors;
  }

  async function readBulkRowsFromFile(file) {
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: "array", cellDates: true });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    return window.XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  }

  async function verifyBulkFile() {
    const { fileInput } = getBulkElements();
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (!file) {
      window.appUi.showToast("Select an Excel file first", "warning");
      return;
    }

    try {
      const rawRows = await readBulkRowsFromFile(file);
      if (!rawRows.length) {
        state.bulkVerifiedRows = [];
        state.bulkInvalidRows = [];
        renderBulkSummary(0, 0, 0);
        renderBulkErrors([]);
        setUploadEnabled(false);
        window.appUi.showToast("File is empty", "warning");
        return;
      }

      const firstHeaders = Object.keys(rawRows[0] || {}).map(normalizeHeaderName);
      const missingHeaders = BULK_HEADERS.filter((h) => !firstHeaders.includes(normalizeHeaderName(h)));
      if (missingHeaders.length) {
        throw new Error(`Missing columns: ${missingHeaders.join(", ")}`);
      }

      const validRows = [];
      const invalidRows = [];

      rawRows.forEach((raw, index) => {
        const payload = mapRowToPayload(raw);
        const errors = validateBulkPayload(payload);
        if (errors.length) {
          invalidRows.push({ row: index + 2, errors });
          return;
        }
        validRows.push(payload);
      });

      state.bulkVerifiedRows = validRows;
      state.bulkInvalidRows = invalidRows;

      renderBulkSummary(rawRows.length, validRows.length, invalidRows.length);
      renderBulkErrors(invalidRows);
      setUploadEnabled(validRows.length > 0);

      if (invalidRows.length) {
        window.appUi.showToast("Verification completed with errors", "warning");
      } else {
        window.appUi.showToast("Verification completed successfully", "success");
      }
    } catch (error) {
      setUploadEnabled(false);
      renderBulkErrors([{ row: 1, errors: [error.message || "Unable to verify file"] }]);
      window.appUi.showToast(error.message || "Unable to verify file", "error");
    }
  }

  async function uploadVerifiedRowsFallback(rows) {
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        await window.staffApi.addStaff(rows[i]);
        inserted += 1;
      } catch (e) {
        failed += 1;
      }
    }

    return { inserted, failed, total: rows.length };
  }

  async function uploadVerifiedRows() {
    if (!state.bulkVerifiedRows.length) {
      window.appUi.showToast("Verify file before upload", "warning");
      return;
    }

    const uploadBtn = document.getElementById("btn-upload-bulk");
    window.appUi.setButtonLoading(uploadBtn, true, "Uploading...");

    try {
      const result = await window.staffApi.bulkAddStaff({ rows: state.bulkVerifiedRows });
      const inserted = Number(result.data && result.data.inserted ? result.data.inserted : 0);
      const failed = Number(result.data && result.data.failed ? result.data.failed : 0);
      window.appUi.showToast(`Upload complete: ${inserted} inserted, ${failed} failed`, failed ? "warning" : "success");
      await loadStaff();
    } catch (error) {
      const msg = String(error.message || "");
      if (msg.toLowerCase().includes("unsupported action")) {
        const fallback = await uploadVerifiedRowsFallback(state.bulkVerifiedRows);
        window.appUi.showToast(`Upload complete: ${fallback.inserted} inserted, ${fallback.failed} failed`, fallback.failed ? "warning" : "success");
        await loadStaff();
      } else {
        window.appUi.showToast(msg || "Bulk upload failed", "error");
      }
    } finally {
      window.appUi.setButtonLoading(uploadBtn, false);
    }
  }

  async function onExportExcel() {
    const btn = document.getElementById("btn-export-excel");
    window.appUi.setButtonLoading(btn, true, "Exporting...");

    try {
      const res = await window.staffApi.getStaff({
        page: 1,
        pageSize: 50000,
        name: state.filters.name,
        mobile: state.filters.mobile,
        designation: state.filters.designation,
      });
      const records = res.data || [];

      if (!records.length) {
        window.appUi.showToast("No data available for export", "warning");
        return;
      }

      exportStyledExcel(records);
      window.appUi.showToast("Excel exported", "success");
    } catch (error) {
      window.appUi.showToast(error.message || "Export failed", "error");
    } finally {
      window.appUi.setButtonLoading(btn, false);
    }
  }

  // ── Table (desktop) ────────────────────────────────────────────────────────
  function renderTable() {
    const body = document.getElementById("staff-table-body");
    if (!body) return;

    body.innerHTML = state.records.map((staff) => {
      const photoSrc = thumbUrl(staff.photo, 120) || AVATAR_SVG;
      const viewUrl = staff.photo ? window.driveLinks.toPreviewUrl(staff.photo) : "#";

      return `<tr>
        <td>
          <a href="${viewUrl}" target="_blank" rel="noopener noreferrer">
            <img class="staff-thumb" src="${photoSrc}" alt="${staff.fullName || ''}"
              loading="lazy" onerror="this.onerror=null;this.src='${AVATAR_SVG}'" />
          </a>
        </td>
        <td class="font-semibold text-slate-800">${staff.fullName || "—"}</td>
        <td class="text-slate-500 text-sm">${staff.mobile || "—"}</td>
        <td><span class="sys-badge bg-blue-50 text-blue-700 border border-blue-100">${staff.designation || "—"}</span></td>
        <td><span class="sys-badge bg-red-50 text-red-600 border border-red-100">${staff.bloodGroup || "—"}</span></td>
        <td>
          <div class="staff-action-group">
            <a href="${profileLink(staff.id)}" class="btn btn-xs staff-action-btn staff-action-view gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </a>
            <a href="add-staff.html?id=${encodeURIComponent(staff.id)}" class="btn btn-xs staff-action-btn staff-action-edit gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </a>
            <button class="btn btn-xs staff-action-btn staff-action-docs gap-1" data-docs="${staff.id}">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Docs
            </button>
            <button class="btn btn-xs staff-action-btn staff-action-delete gap-1" data-delete="${staff.id}">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Del
            </button>
          </div>
        </td>
      </tr>`;
    }).join("");

    body.querySelectorAll("button[data-docs]").forEach((btn) =>
      btn.addEventListener("click", () => openDocsModal(btn.dataset.docs))
    );
    body.querySelectorAll("button[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => onDelete(btn.dataset.delete))
    );
  }

  // ── Cards (mobile) ─────────────────────────────────────────────────────────
  function renderCards() {
    const root = document.getElementById("staff-card-list");
    if (!root) return;

    root.innerHTML = state.records.map((staff) => {
      const photoSrc = thumbUrl(staff.photo, 160) || AVATAR_SVG;
      const viewUrl = staff.photo ? window.driveLinks.toPreviewUrl(staff.photo) : "#";

      return `<article class="sys-card">
        <div class="p-4">
          <div class="flex items-center gap-3 mb-3">
            <a href="${viewUrl}" target="_blank" rel="noopener noreferrer">
              <img class="staff-thumb" style="width:74px;height:74px;" src="${photoSrc}" alt="${staff.fullName || ''}"
                loading="lazy" onerror="this.onerror=null;this.src='${AVATAR_SVG}'" />
            </a>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-slate-800 truncate">${staff.fullName || "—"}</h3>
              <span class="sys-badge bg-blue-50 text-blue-700 border border-blue-100">${staff.designation || "—"}</span>
            </div>
            <span class="sys-badge bg-red-50 text-red-600 border border-red-100 self-start">${staff.bloodGroup || "—"}</span>
          </div>
          <p class="text-sm text-slate-500 mb-3">${staff.mobile || "—"}</p>
          <div class="staff-action-group">
            <a href="${profileLink(staff.id)}" class="btn btn-xs staff-action-btn staff-action-view gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View
            </a>
            <a href="add-staff.html?id=${encodeURIComponent(staff.id)}" class="btn btn-xs staff-action-btn staff-action-edit gap-1">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </a>
            <button class="btn btn-xs staff-action-btn staff-action-docs gap-1" data-docs="${staff.id}">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Docs
            </button>
            <button class="btn btn-xs staff-action-btn staff-action-delete gap-1" data-delete="${staff.id}">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Del
            </button>
          </div>
        </div>
      </article>`;
    }).join("");

    root.querySelectorAll("button[data-docs]").forEach((btn) =>
      btn.addEventListener("click", () => openDocsModal(btn.dataset.docs))
    );
    root.querySelectorAll("button[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => onDelete(btn.dataset.delete))
    );
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  // ── Pagination ─────────────────────────────────────────────────────────────
  function renderPagination() {
    const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
    const text = `Page ${state.page} of ${pages} · ${state.total} staff`;

    const info = document.getElementById("pagination-info");
    const infoMobile = document.getElementById("pagination-info-mobile");
    if (info) info.textContent = text;
    if (infoMobile) infoMobile.textContent = text;

    const container = document.getElementById("pagination-controls");
    if (!container) return;

    let html = '';

    // Prev
    html += `<button class="join-item btn btn-sm bg-white border-slate-200 text-slate-600 hover:bg-slate-50" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>«</button>`;

    // Page Numbers
    for (let i = 1; i <= pages; i++) {
      if (pages > 7) {
        if (i === 1 || i === pages || (i >= state.page - 1 && i <= state.page + 1)) {
          html += `<button class="join-item btn btn-sm border-slate-200 ${i === state.page ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}" data-page="${i}">${i}</button>`;
        } else if (i === state.page - 2 || i === state.page + 2) {
          html += `<button class="join-item btn btn-sm bg-white border-slate-200 text-slate-400" disabled>...</button>`;
        }
      } else {
        html += `<button class="join-item btn btn-sm border-slate-200 ${i === state.page ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}" data-page="${i}">${i}</button>`;
      }
    }

    // Next
    html += `<button class="join-item btn btn-sm bg-white border-slate-200 text-slate-600 hover:bg-slate-50" data-page="${state.page + 1}" ${state.page >= pages ? 'disabled' : ''}>»</button>`;

    container.innerHTML = html;
  }

  // ── Docs Modal ─────────────────────────────────────────────────────────────
  function openDocsModal(staffId) {
    const staff = state.records.find((s) => String(s.id) === String(staffId));
    if (!staff) return;

    const modal = document.getElementById("docs-modal");
    const content = document.getElementById("docs-modal-content");

    const docMap = [
      { label: "Aadhaar", key: "aad", url: staff.aadhaarImage },
      { label: "License", key: "dl", url: staff.licenseImage },
      { label: "Photo", key: "photo", url: staff.photo },
    ];

    content.innerHTML = docMap.map((doc) => {
      const rawUrl = String(doc.url || "").trim();
      const hasAttachment = Boolean(rawUrl);
      const preview = hasAttachment ? window.driveLinks.toPreviewUrl(rawUrl) : "";
      const download = hasAttachment ? window.driveLinks.toDownloadUrl(rawUrl) : "";
      const fileName = buildDownloadFileName(staff, doc.key);
      const isValid = hasAttachment && window.driveLinks.isSupportedImageSource(rawUrl);
      const allowCopyLink = /^https?:\/\//i.test(rawUrl);

      return `<div class="flex flex-wrap gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span class="font-semibold text-slate-700 min-w-20 text-sm">${doc.label}</span>
        ${
          isValid
            ? `<a class="btn btn-xs btn-outline" href="${preview}" target="_blank" rel="noopener">Preview</a>
              <a class="btn btn-xs bg-slate-800 text-white border-none hover:bg-slate-700" href="${download}" download="${fileName}" target="_blank" rel="noopener">Download</a>
              ${allowCopyLink ? `<button class="btn btn-xs btn-outline text-orange-600 border-orange-200" data-share="${preview}">Copy Link</button>` : ""}`
            : `<span class="text-xs font-semibold text-slate-500">No Attachments</span>`
        }
      </div>`;
    }).join("");

    content.querySelectorAll("button[data-share]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.share);
          window.appUi.showToast("Link copied!", "success");
        } catch {
          window.appUi.showToast("Unable to copy", "error");
        }
      });
    });

    modal.showModal();
  }

  // ── Load ───────────────────────────────────────────────────────────────────
  async function loadStaff() {
    toggleLoading(true);
    try {
      const res = await window.staffApi.getStaff({
        page: state.page,
        pageSize: state.pageSize,
        name: state.filters.name,
        mobile: state.filters.mobile,
        designation: state.filters.designation,
      });

      state.records = res.data || [];
      state.total = res.pagination?.total || 0;
      renderTable();
      renderCards();
      renderPagination();
      renderEmptyState();
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    } finally {
      toggleLoading(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this staff record? This cannot be undone.")) return;
    try {
      await window.staffApi.deleteStaff({ id });
      window.appUi.showToast("Staff deleted", "success");
      if (state.records.length === 1 && state.page > 1) state.page -= 1;
      await loadStaff();
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  function bindEvents() {
    function execSearch() {
      state.page = 1;
      state.filters.name = document.getElementById("search-name")?.value.trim() || "";
      state.filters.mobile = document.getElementById("search-mobile")?.value.trim() || "";
      state.filters.designation = document.getElementById("search-designation")?.value.trim() || "";
      loadStaff();
    }

    const debouncedSearch = window.appUi.debounce(execSearch, 300);

    // Instant Search
    ["search-name", "search-mobile", "search-designation"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", debouncedSearch);
        el.addEventListener("keyup", debouncedSearch);
      }
    });

    // Manual Search & Reset
    document.getElementById("btn-search")?.addEventListener("click", execSearch);

    document.getElementById("btn-reset")?.addEventListener("click", () => {
      state.page = 1;
      state.filters = { name: "", mobile: "", designation: "" };
      ["search-name", "search-mobile", "search-designation"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      loadStaff();
    });

    // Keyboard shortcut: press Escape to clear all filters quickly
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const active = document.activeElement;
      const isTyping = active && ["INPUT", "TEXTAREA"].includes(active.tagName);
      if (!isTyping) return;

      state.page = 1;
      state.filters = { name: "", mobile: "", designation: "" };
      ["search-name", "search-mobile", "search-designation"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      loadStaff();
      window.appUi.showToast("Filters cleared", "success");
    });

    // Delegated Pagination Control
    document.getElementById("pagination-controls")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-page]");
      if (!btn || btn.disabled) return;
      const newPage = parseInt(btn.dataset.page, 10);
      if (newPage && newPage !== state.page) {
        state.page = newPage;
        loadStaff();
      }
    });

    document.getElementById("btn-export-excel")?.addEventListener("click", onExportExcel);
    document.getElementById("btn-download-template")?.addEventListener("click", buildTemplateWorkbook);
    document.getElementById("btn-verify-bulk")?.addEventListener("click", verifyBulkFile);
    document.getElementById("btn-upload-bulk")?.addEventListener("click", uploadVerifiedRows);

    document.getElementById("bulk-file")?.addEventListener("change", () => {
      state.bulkVerifiedRows = [];
      state.bulkInvalidRows = [];
      setUploadEnabled(false);
      const { summary } = getBulkElements();
      if (summary) summary.classList.add("hidden");
      renderBulkErrors([]);
    });
  }

  if (window.location.pathname.endsWith("staff-list.html")) {
    bindEvents();
    loadStaff();
  }
})();
