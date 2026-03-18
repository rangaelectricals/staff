(function () {
  const state = {
    page: 1,
    pageSize: window.APP_CONFIG.PAGE_SIZE,
    total: 0,
    records: [],
    filters: { name: "", mobile: "", designation: "" },
    isLoading: false,
  };

  function toggleLoading(isLoading) {
    state.isLoading = isLoading;
    const loading = document.getElementById("staff-loading-state");
    const empty = document.getElementById("staff-empty-state");
    const tableCard = document.querySelector(".sys-card.hidden.md\\:block");
    const mobileList = document.getElementById("staff-card-list");
    const pagination = document.getElementById("pagination-controls");

    if (loading) loading.classList.toggle("hidden", !isLoading);
    if (empty) empty.classList.add("hidden");
    if (tableCard) tableCard.classList.toggle("opacity-50", isLoading);
    if (mobileList) mobileList.classList.toggle("opacity-50", isLoading);
    if (pagination) pagination.classList.toggle("pointer-events-none", isLoading);
  }

  function renderEmptyState() {
    const empty = document.getElementById("staff-empty-state");
    const body = document.getElementById("staff-table-body");
    const mobile = document.getElementById("staff-card-list");
    if (!empty || !body || !mobile) return;

    const hasData = state.records.length > 0;
    empty.classList.toggle("hidden", hasData);
    if (!hasData) {
      body.innerHTML = "";
      mobile.innerHTML = "";
    }
  }

  const AVATAR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23e2e8f0' rx='8'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%2394a3b8'/%3E%3Cellipse cx='60' cy='96' rx='34' ry='22' fill='%2394a3b8'/%3E%3C/svg%3E`;

  function thumbUrl(driveUrl, size = 120) {
    const id = driveUrl ? window.driveLinks.extractFileId(driveUrl) : null;
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}-h${size}` : "";
  }

  function profileLink(id) {
    return `staff-profile.html?id=${encodeURIComponent(id)}`;
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
      const isValid =
        hasAttachment &&
        preview &&
        preview !== rawUrl &&
        download &&
        download !== rawUrl;

      return `<div class="flex flex-wrap gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span class="font-semibold text-slate-700 min-w-20 text-sm">${doc.label}</span>
        ${
          isValid
            ? `<a class="btn btn-xs btn-outline" href="${preview}" target="_blank" rel="noopener">Preview</a>
               <a class="btn btn-xs bg-slate-800 text-white border-none hover:bg-slate-700" href="${download}" download="${fileName}" target="_blank" rel="noopener">Download</a>
               <button class="btn btn-xs btn-outline text-orange-600 border-orange-200" data-share="${preview}">Copy Link</button>`
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
  }

  if (window.location.pathname.endsWith("staff-list.html")) {
    bindEvents();
    loadStaff();
  }
})();
