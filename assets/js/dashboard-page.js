(function () {
  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseDate(value) {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function formatDateShort(value) {
    const dt = parseDate(value);
    if (!dt) return "—";
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function normalizeDesignation(value) {
    const raw = String(value || "").trim();
    if (!raw) return "Unspecified";
    return raw
      .toLowerCase()
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }

  function setMetricText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function percent(part, total) {
    if (!total) return 0;
    return Math.round((Number(part || 0) / Number(total || 0)) * 100);
  }

  function toggleSkeleton(el, isLoading) {
    if (!el) return;
    el.classList.toggle("skeleton-3d-text", isLoading);
    el.classList.toggle("skeleton-3d-float", isLoading);
    el.classList.toggle("skeleton-stat-line", isLoading);
  }

  function renderBreakdownSkeleton() {
    const root = document.getElementById("dashboard-designation-breakdown");
    if (!root) return;
    root.innerHTML = Array.from({ length: 5 }).map(() => `
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="skeleton-3d-text skeleton-3d-float" style="height:11px;width:38%;"></span>
          <span class="skeleton-3d-text skeleton-3d-float" style="height:11px;width:14%;"></span>
        </div>
        <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full skeleton-3d-block skeleton-3d-float" style="width:100%"></div>
        </div>
      </div>
    `).join("");
  }

  function renderRecentSkeleton() {
    const root = document.getElementById("dashboard-recent-list");
    if (!root) return;
    root.innerHTML = Array.from({ length: 5 }).map(() => `
      <div class="rounded-xl border border-slate-200 p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="skeleton-3d-text skeleton-3d-float" style="height:12px;width:36%;"></span>
          <span class="skeleton-3d-text skeleton-3d-float" style="height:12px;width:22%;"></span>
        </div>
        <div class="flex gap-2">
          <span class="skeleton-3d-text skeleton-3d-float" style="height:18px;width:94px;"></span>
          <span class="skeleton-3d-text skeleton-3d-float" style="height:18px;width:124px;"></span>
        </div>
      </div>
    `).join("");
  }

  function setQualitySkeleton(isLoading) {
    [
      "quality-photo-text",
      "quality-aadhaar-text",
      "quality-license-text",
      "quality-emergency-text",
      "insight-missing-photo",
      "insight-missing-aadhaar",
      "insight-missing-emergency",
      "insight-birthday-month",
      "dashboard-role-count",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isLoading) el.textContent = "";
      el.classList.toggle("skeleton-3d-text", isLoading);
      el.classList.toggle("skeleton-3d-float", isLoading);
      el.classList.toggle("inline-block", isLoading);
      if (isLoading) {
        el.style.minWidth = id === "dashboard-role-count" ? "88px" : "70px";
      } else {
        el.style.minWidth = "";
      }
    });

    [
      "quality-photo-bar",
      "quality-aadhaar-bar",
      "quality-license-bar",
      "quality-emergency-bar",
    ].forEach((id) => {
      const bar = document.getElementById(id);
      if (!bar) return;
      if (isLoading) {
        bar.style.width = "100%";
      }
      bar.classList.toggle("skeleton-3d-block", isLoading);
      bar.classList.toggle("skeleton-3d-float", isLoading);
    });
  }

  function setStatsLoading(isLoading) {
    ["stat-total", "stat-drivers", "stat-electricians", "stat-new"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isLoading) {
        el.dataset.actualValue = el.textContent;
        el.textContent = "";
      } else if (el.textContent.trim() === "" && el.dataset.actualValue) {
        el.textContent = el.dataset.actualValue;
      }
      toggleSkeleton(el, isLoading);
    });

    [
      "stat-total-meta",
      "stat-drivers-meta",
      "stat-electricians-meta",
      "stat-new-meta",
      "stat-total-chip",
      "stat-drivers-chip",
      "stat-electricians-chip",
      "stat-new-chip",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isLoading) {
        el.dataset.actualValue = el.textContent;
        el.textContent = "";
      } else if (!el.textContent.trim() && el.dataset.actualValue) {
        el.textContent = el.dataset.actualValue;
      }
      el.classList.toggle("skeleton-3d-text", isLoading);
      el.classList.toggle("skeleton-3d-float", isLoading);
      el.classList.toggle("inline-block", isLoading);
      el.style.minWidth = isLoading ? (id.includes("meta") ? "116px" : "56px") : "";
    });

    const updated = document.getElementById("stats-last-updated");
    if (updated) {
      if (isLoading) {
        updated.dataset.actualValue = updated.textContent;
        updated.textContent = "";
      } else if (!updated.textContent.trim() && updated.dataset.actualValue) {
        updated.textContent = updated.dataset.actualValue;
      }
      updated.classList.toggle("skeleton-3d-text", isLoading);
      updated.classList.toggle("skeleton-3d-float", isLoading);
      updated.classList.toggle("inline-block", isLoading);
      updated.style.minWidth = isLoading ? "170px" : "";
    }

    const refreshBtn = document.getElementById("btn-refresh-stats");
    if (refreshBtn) {
      window.appUi.setButtonLoading(refreshBtn, isLoading, "Refreshing...");
    }

    if (isLoading) {
      renderBreakdownSkeleton();
      renderRecentSkeleton();
    }
    setQualitySkeleton(isLoading);
  }

  function setLastUpdated() {
    const node = document.getElementById("stats-last-updated");
    if (!node) return;
    const now = new Date();
    node.textContent = `Last updated: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  function renderDesignationBreakdown(records) {
    const root = document.getElementById("dashboard-designation-breakdown");
    const roleCount = document.getElementById("dashboard-role-count");
    if (!root) return;

    const counts = new Map();
    records.forEach((item) => {
      const key = normalizeDesignation(item.designation);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const rows = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);

    if (roleCount) {
      roleCount.textContent = `${rows.length} roles`;
    }

    if (!rows.length) {
      root.innerHTML = `<p class="text-sm text-slate-500 font-medium">No role data available.</p>`;
      return;
    }

    const max = rows[0][1] || 1;
    root.innerHTML = rows.slice(0, 7).map(([role, count]) => {
      const width = Math.max(8, Math.round((count / max) * 100));
      return `<div class="space-y-1">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>${esc(role)}</span>
          <span>${count}</span>
        </div>
        <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full bg-indigo-500 rounded-full" style="width:${width}%"></div>
        </div>
      </div>`;
    }).join("");
  }

  function renderQuality(records) {
    const total = records.length || 0;

    const withPhoto = records.filter((r) => String(r.photo || "").trim()).length;
    const withAadhaar = records.filter((r) => String(r.aadhaarImage || "").trim()).length;
    const withLicense = records.filter((r) => String(r.licenseImage || "").trim()).length;
    const withEmergency = records.filter((r) => String(r.emergencyContactName || "").trim() || String(r.emergencyMobile || "").trim()).length;

    function ratio(count) {
      return total ? Math.round((count / total) * 100) : 0;
    }

    const photoPct = ratio(withPhoto);
    const aadhaarPct = ratio(withAadhaar);
    const licensePct = ratio(withLicense);
    const emergencyPct = ratio(withEmergency);

    setMetricText("quality-photo-text", `${photoPct}%`);
    setMetricText("quality-aadhaar-text", `${aadhaarPct}%`);
    setMetricText("quality-license-text", `${licensePct}%`);
    setMetricText("quality-emergency-text", `${emergencyPct}%`);

    const bars = [
      ["quality-photo-bar", photoPct],
      ["quality-aadhaar-bar", aadhaarPct],
      ["quality-license-bar", licensePct],
      ["quality-emergency-bar", emergencyPct],
    ];
    bars.forEach(([id, pct]) => {
      const bar = document.getElementById(id);
      if (bar) bar.style.width = `${pct}%`;
    });

    const nowMonth = new Date().getMonth();
    const birthdaysThisMonth = records.filter((r) => {
      const dob = parseDate(r.dob);
      return dob && dob.getMonth() === nowMonth;
    }).length;

    setMetricText("insight-missing-photo", String(Math.max(0, total - withPhoto)));
    setMetricText("insight-missing-aadhaar", String(Math.max(0, total - withAadhaar)));
    setMetricText("insight-missing-emergency", String(Math.max(0, total - withEmergency)));
    setMetricText("insight-birthday-month", String(birthdaysThisMonth));
  }

  function renderRecent(records) {
    const root = document.getElementById("dashboard-recent-list");
    if (!root) return;

    const recent = records
      .slice()
      .sort((a, b) => {
        const aDate = parseDate(a.timestamp);
        const bDate = parseDate(b.timestamp);
        return (bDate ? bDate.getTime() : 0) - (aDate ? aDate.getTime() : 0);
      })
      .slice(0, 6);

    if (!recent.length) {
      root.innerHTML = `<p class="text-sm text-slate-500 font-medium">No recent entries available.</p>`;
      return;
    }

    root.innerHTML = recent.map((item) => {
      const designation = normalizeDesignation(item.designation);
      return `<div class="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/80">
        <div class="flex items-center justify-between gap-3">
          <h4 class="text-sm font-bold text-slate-800 truncate">${esc(item.fullName || "—")}</h4>
          <span class="text-xs text-slate-500 font-semibold">${formatDateShort(item.timestamp)}</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span class="badge badge-info badge-sm">${esc(designation)}</span>
          <span class="text-xs text-slate-600 font-semibold">${esc(item.mobile || "No mobile")}</span>
        </div>
      </div>`;
    }).join("");
  }

  async function initDashboard() {
    setStatsLoading(true);
    try {
      const res = await window.staffApi.getStaff({ page: 1, pageSize: 50000 });
      const stats = res.stats || {};
      const records = Array.isArray(res.data) ? res.data : [];

      document.getElementById("stat-total").textContent = stats.totalStaff ?? 0;
      document.getElementById("stat-drivers").textContent = stats.drivers ?? 0;
      document.getElementById("stat-electricians").textContent = stats.electricians ?? 0;
      document.getElementById("stat-new").textContent = stats.newStaffAdded ?? 0;

      const totalStaff = Number(stats.totalStaff || 0);
      const drivers = Number(stats.drivers || 0);
      const electricians = Number(stats.electricians || 0);
      const newThisMonth = Number(stats.newStaffAdded || 0);

      setMetricText("stat-total-meta", "All active staff records");
      setMetricText("stat-drivers-meta", `${percent(drivers, totalStaff)}% workforce share`);
      setMetricText("stat-electricians-meta", `${percent(electricians, totalStaff)}% workforce share`);
      setMetricText("stat-new-meta", `${percent(newThisMonth, totalStaff)}% monthly intake`);

      setMetricText("stat-total-chip", "Live");
      setMetricText("stat-drivers-chip", `${drivers}`);
      setMetricText("stat-electricians-chip", `${electricians}`);
      setMetricText("stat-new-chip", "Month");

      renderDesignationBreakdown(records);
      renderQuality(records);
      renderRecent(records);
      setLastUpdated();
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    } finally {
      setStatsLoading(false);
    }
  }

  if (window.location.pathname.endsWith("dashboard.html") || window.location.pathname.endsWith("/")) {
    document.getElementById("btn-refresh-stats")?.addEventListener("click", initDashboard);
    initDashboard();
  }
})();
