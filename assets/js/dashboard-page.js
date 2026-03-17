(function () {
  function setStatsLoading(isLoading) {
    ["stat-total", "stat-drivers", "stat-electricians", "stat-new"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = isLoading ? "..." : el.textContent;
      el.classList.toggle("opacity-60", isLoading);
    });

    const refreshBtn = document.getElementById("btn-refresh-stats");
    if (refreshBtn) {
      window.appUi.setButtonLoading(refreshBtn, isLoading, "Refreshing...");
    }
  }

  function setLastUpdated() {
    const node = document.getElementById("stats-last-updated");
    if (!node) return;
    const now = new Date();
    node.textContent = `Last updated: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  async function initDashboard() {
    setStatsLoading(true);
    try {
      const res = await window.staffApi.getStaff({ page: 1, pageSize: 1 });
      const stats = res.stats || {};
      document.getElementById("stat-total").textContent = stats.totalStaff ?? 0;
      document.getElementById("stat-drivers").textContent = stats.drivers ?? 0;
      document.getElementById("stat-electricians").textContent = stats.electricians ?? 0;
      document.getElementById("stat-new").textContent = stats.newStaffAdded ?? 0;
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
