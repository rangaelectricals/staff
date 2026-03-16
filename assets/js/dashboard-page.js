(function () {
  async function initDashboard() {
    try {
      const res = await window.staffApi.getStaff({ page: 1, pageSize: 1 });
      const stats = res.stats || {};
      document.getElementById("stat-total").textContent = stats.totalStaff ?? 0;
      document.getElementById("stat-drivers").textContent = stats.drivers ?? 0;
      document.getElementById("stat-electricians").textContent = stats.electricians ?? 0;
      document.getElementById("stat-new").textContent = stats.newStaffAdded ?? 0;
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    }
  }

  if (window.location.pathname.endsWith("dashboard.html") || window.location.pathname.endsWith("/")) {
    initDashboard();
  }
})();
