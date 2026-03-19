(function () {
  let currentStaff = null;

  function setProfileLoading(isLoading) {
    const textTargets = [
      "profile-name",
      "profile-first-name",
      "profile-last-name",
      "profile-designation",
      "profile-mobile",
      "profile-dob",
      "profile-blood",
      "profile-address",
      "profile-aadhaar",
      "profile-license",
      "profile-emergency-name",
      "profile-emergency-mobile",
    ];

    textTargets.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isLoading) {
        el.textContent = "";
      }
      el.classList.toggle("skeleton-3d-text", isLoading);
      el.classList.toggle("skeleton-3d-float", isLoading);
      el.classList.toggle("inline-block", isLoading);
      if (isLoading) {
        el.style.minWidth = id === "profile-address" ? "75%" : "120px";
      } else {
        el.style.minWidth = "";
      }
    });

    const photo = document.getElementById("profile-photo");
    if (photo) {
      if (isLoading) {
        photo.removeAttribute("src");
      }
      photo.classList.toggle("skeleton-3d-avatar", isLoading);
      photo.classList.toggle("skeleton-3d-float", isLoading);
      photo.classList.toggle("profile-photo-loading", isLoading);
    }

    const docs = document.getElementById("docs-actions");
    if (docs && isLoading) {
      docs.innerHTML = Array.from({ length: 3 }).map(() => `
        <article class="doc-preview-card is-loading">
          <div class="doc-preview-media">
            <div class="skeleton-3d-text skeleton-3d-float" style="height:100%;width:100%;border-radius:14px;"></div>
          </div>
          <div class="doc-preview-footer">
            <div class="skeleton-3d-text skeleton-3d-float" style="height:12px;width:54%;"></div>
            <div class="doc-preview-actions">
              <div class="skeleton-3d-text skeleton-3d-float" style="height:30px;width:70px;"></div>
              <div class="skeleton-3d-text skeleton-3d-float" style="height:30px;width:82px;"></div>
            </div>
          </div>
        </article>
      `).join("");
    }

    document.getElementById("btn-pdf")?.toggleAttribute("disabled", isLoading);
    document.getElementById("btn-edit")?.classList.toggle("pointer-events-none", isLoading);
    document.querySelectorAll("button[data-copy-target]").forEach((btn) => {
      btn.toggleAttribute("disabled", isLoading);
    });
  }

  function splitName(fullName) {
    const cleanName = String(fullName || "").trim();
    if (!cleanName) {
      return { firstName: "", lastName: "" };
    }

    const chunks = cleanName.split(/\s+/);
    return {
      firstName: chunks[0] || "",
      lastName: chunks.length > 1 ? chunks.slice(1).join(" ") : "",
    };
  }

  function getElementText(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    return String(el.textContent || "").trim();
  }

  async function copyFieldValue(targetId, fieldLabel) {
    const value = getElementText(targetId);
    if (!value || value === "-" || value === "—") {
      window.appUi.showToast(`${fieldLabel} is empty`, "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      window.appUi.showToast(`${fieldLabel} copied`, "success");
    } catch (error) {
      window.appUi.showToast("Unable to copy", "error");
    }
  }

  function bindCopyButtons() {
    document.querySelectorAll("button[data-copy-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.copyTarget;
        const fieldLabel = btn.dataset.copyLabel || "Value";
        copyFieldValue(targetId, fieldLabel);
      });
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = window.appUi.safe(value);
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

  function renderDocs(staff) {
    const root = document.getElementById("docs-actions");
    if (!root) return;

    const docs = [
      { label: "Aadhaar", key: "aad", url: staff.aadhaarImage },
      { label: "License", key: "dl", url: staff.licenseImage },
      { label: "Profile Photo", key: "photo", url: staff.photo },
    ];

    root.innerHTML = docs
      .map((doc) => {
        const rawUrl = String(doc.url || "").trim();
        const hasAttachment = Boolean(rawUrl);
        const preview = hasAttachment ? window.driveLinks.toPreviewUrl(rawUrl) : "";
        const download = hasAttachment ? window.driveLinks.toDownloadUrl(rawUrl) : "";
        const share = hasAttachment ? window.driveLinks.toShareUrl(rawUrl) : "";
        const display = hasAttachment ? window.driveLinks.toDisplayUrl(rawUrl, 520) : "";
        const fileName = buildDownloadFileName(staff, doc.key);
        const isValid = hasAttachment && window.driveLinks.isSupportedImageSource(rawUrl);
        const allowShare = /^https?:\/\//i.test(rawUrl);

        return `<article class="doc-preview-card ${isValid ? "" : "doc-preview-empty"}">
          <div class="doc-preview-media-wrap">
            ${
              isValid
                ? `<a href="${preview}" target="_blank" rel="noopener" class="doc-preview-media-link">
                    <img src="${display}" alt="${doc.label}" class="doc-preview-media" loading="lazy" />
                  </a>`
                : `<div class="doc-preview-media doc-preview-fallback">
                    <span>No Attachment</span>
                  </div>`
            }
            ${
              isValid
                ? `<div class="doc-preview-actions float-actions">
                    <a class="btn btn-xs doc-action-btn doc-action-preview" href="${preview}" target="_blank" rel="noopener">Preview</a>
                    <a class="btn btn-xs doc-action-btn doc-action-download" href="${download}" download="${fileName}" target="_blank" rel="noopener noreferrer">Download</a>
                    ${allowShare ? `<button class="btn btn-xs doc-action-btn doc-action-share" data-share="${share}">Share</button>` : ""}
                  </div>`
                : ""
            }
          </div>
          <div class="doc-preview-footer">
            <h4 class="doc-preview-title">${doc.label}</h4>
          </div>
        </article>`;
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
    const nameParts = splitName(staff.fullName);

    const thumbUrl = staff.photo ? window.driveLinks.toDisplayUrl(staff.photo, 300) : '';
    const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23e2e8f0' rx='8'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%2394a3b8'/%3E%3Cellipse cx='60' cy='96' rx='34' ry='22' fill='%2394a3b8'/%3E%3C/svg%3E`;
    const photoEl = document.getElementById("profile-photo");
    photoEl.src = thumbUrl || avatarSvg;
    photoEl.onerror = () => { photoEl.onerror = null; photoEl.src = avatarSvg; };
    setText("profile-name", staff.fullName);
    setText("profile-first-name", nameParts.firstName);
    setText("profile-last-name", nameParts.lastName);
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

    setProfileLoading(true);
    try {
      const res = await window.staffApi.getStaff({ id, page: 1, pageSize: 1 });
      const staff = (res.data || [])[0];
      if (!staff) {
        throw new Error("Staff not found");
      }
      renderProfile(staff);
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    } finally {
      setProfileLoading(false);
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
    bindCopyButtons();
    bindPdf();
    loadProfile();
  }
})();
