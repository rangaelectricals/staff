(function () {
  function showToast(message, type) {
    const root = document.getElementById("toast");
    if (!root) return;

    const alert = document.createElement("div");
    const cls = type === "error" ? "alert-error" : type === "warning" ? "alert-warning" : "alert-success";
    alert.className = `alert ${cls} shadow-lg`;
    alert.innerHTML = `<span>${message}</span>`;
    root.appendChild(alert);

    setTimeout(() => {
      alert.remove();
    }, 3000);
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function safe(value) {
    return value === undefined || value === null || value === "" ? "-" : value;
  }

  function formatDate(dateStr) {
    if (!dateStr || dateStr.trim() === "") return "—";

    // Attempt to parse 'YYYY-MM-DD' correctly without timezone shift issues
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    // Fallback if parsing fails or it's a different format
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return dateStr;
  }

  window.appUi = { showToast, getQueryParam, debounce, safe, formatDate };
})();
