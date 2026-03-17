(function () {
  let currentStaff = null;

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = window.appUi.safe(value);
  }

  function renderDocs(staff) {
    const root = document.getElementById("docs-actions");
    if (!root) return;

    const docs = [
      { label: "View Aadhaar", url: staff.aadhaarImage },
      { label: "View License", url: staff.licenseImage },
      { label: "View Photo", url: staff.photo },
    ];

    root.innerHTML = docs
      .map((doc) => {
        const rawUrl = String(doc.url || "").trim();
        const hasAttachment = Boolean(rawUrl);
        const preview = hasAttachment ? window.driveLinks.toPreviewUrl(rawUrl) : "";
        const download = hasAttachment ? window.driveLinks.toDownloadUrl(rawUrl) : "";
        const share = hasAttachment ? window.driveLinks.toShareUrl(rawUrl) : "";
        const isValid =
          hasAttachment &&
          preview &&
          preview !== rawUrl &&
          download &&
          download !== rawUrl;

        return `<div class="card bg-base-200 border border-base-300">
          <div class="card-body p-3">
            <h4 class="font-semibold">${doc.label}</h4>
            ${
              isValid
                ? `<div class="flex flex-wrap gap-2">
                    <a class="btn btn-xs bg-blue-500 hover:bg-blue-600 text-white" href="${preview}" target="_blank" rel="noopener">Preview</a>
                    <a class="btn btn-xs bg-slate-600 hover:bg-slate-700 text-white" href="${download}" target="_blank" rel="noopener noreferrer">Download</a>
                    <button class="btn btn-xs bg-green-500 hover:bg-green-600 text-white" data-share="${share}">Share</button>
                  </div>`
                : `<p class="text-sm text-slate-500 font-medium">No Attachments</p>`
            }
          </div>
        </div>`;
      })
      .join("");

    root.querySelectorAll("button[data-share]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.share);
          window.appUi.showToast("Link copied", "success");
        } catch (e) {
          window.appUi.showToast("Unable to copy", "error");
        }
      });
    });
  }

  function renderProfile(staff) {
    currentStaff = staff;

    // Use Drive thumbnail URL — serves a real JPEG (same approach as staff list)
    const fileId = staff.photo ? window.driveLinks.extractFileId(staff.photo) : '';
    const thumbUrl = fileId
      ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w300-h300`
      : '';
    const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23e2e8f0' rx='8'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%2394a3b8'/%3E%3Cellipse cx='60' cy='96' rx='34' ry='22' fill='%2394a3b8'/%3E%3C/svg%3E`;
    const photoEl = document.getElementById("profile-photo");
    photoEl.src = thumbUrl || avatarSvg;
    photoEl.onerror = () => { photoEl.onerror = null; photoEl.src = avatarSvg; };
    setText("profile-name", staff.fullName);
    setText("profile-designation", staff.designation);
    setText("profile-mobile", staff.mobile);

    // Wire Edit button
    const editBtn = document.getElementById("btn-edit");
    if (editBtn) editBtn.href = `add-staff.html?id=${encodeURIComponent(staff.id)}`;
    setText("profile-dob", window.appUi.formatDate(staff.dob));
    setText("profile-blood", staff.bloodGroup);
    setText("profile-address", staff.address);
    setText("profile-aadhaar", staff.aadhaarNumber);
    setText("profile-license", staff.drivingLicense);
    setText("profile-emergency-name", staff.emergencyContactName);
    setText("profile-emergency-mobile", staff.emergencyMobile);

    renderDocs(staff);

    const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(staff.id)}`;
    window.qrUtil.renderQr("qr-code", url);
  }

  async function loadProfile() {
    const id = window.appUi.getQueryParam("id");
    if (!id) {
      window.appUi.showToast("Missing staff id", "error");
      return;
    }

    try {
      const res = await window.staffApi.getStaff({ id, page: 1, pageSize: 1 });
      const staff = (res.data || [])[0];
      if (!staff) {
        throw new Error("Staff not found");
      }
      renderProfile(staff);
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    }
  }

  function bindPdf() {
    document.getElementById("btn-pdf")?.addEventListener("click", async () => {
      if (!currentStaff) {
        window.appUi.showToast("Staff not loaded", "error");
        return;
      }
      try {
        await window.pdfUtil.downloadProfilePdf(currentStaff);
      } catch (error) {
        window.appUi.showToast(error.message, "error");
      }
    });
  }

  if (window.location.pathname.endsWith("staff-profile.html")) {
    bindPdf();
    loadProfile();
  }
})();
