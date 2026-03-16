(function () {
  const { API_BASE_URL, ACTIONS } = window.APP_CONFIG;

  function assertApiUrl() {
    if (!API_BASE_URL || API_BASE_URL.includes("PASTE_YOUR_APPS_SCRIPT")) {
      throw new Error("Apps Script URL is not configured in assets/js/config.js");
    }
  }

  async function request(action, payload, method) {
    assertApiUrl();

    if (method === "GET") {
      const params = new URLSearchParams({ action, ...payload });
      const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
      return parseResponse(res);
    }

    const body = new URLSearchParams({
      action,
      payload: JSON.stringify(payload || {}),
    });

    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });

    return parseResponse(res);
  }

  async function parseResponse(res) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "Request failed");
    }
    return json;
  }

  window.staffApi = {
    async getStaff(filters) {
      return request(ACTIONS.GET_STAFF, filters || {}, "GET");
    },
    async addStaff(data) {
      return request(ACTIONS.ADD_STAFF, data || {}, "POST");
    },
    async updateStaff(data) {
      return request(ACTIONS.UPDATE_STAFF, data || {}, "POST");
    },
    async deleteStaff(data) {
      return request(ACTIONS.DELETE_STAFF, data || {}, "POST");
    },
  };
})();
