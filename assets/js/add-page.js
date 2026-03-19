(function () {
  let editingId = null;
  let cropper = null;
  let activeCropField = null;

  const CROP_PRESETS = {
    photo: { aspectRatio: 1, width: 640, height: 640, quality: 0.84, maxChars: 48000 },
    aadhaarImage: { aspectRatio: 1.58, width: 960, height: 608, quality: 0.82, maxChars: 48000 },
    licenseImage: { aspectRatio: 1.58, width: 960, height: 608, quality: 0.82, maxChars: 48000 },
  };

  function customCropAspectRatio(field) {
    // Keep profile photo square; allow free crop for document images.
    if (field === "photo") return CROP_PRESETS.photo.aspectRatio;
    return NaN;
  }

  function ensurePdfWorker() {
    if (!window.pdfjsLib || !window.pdfjsLib.GlobalWorkerOptions) return;
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  function setFormLoading(isLoading) {
    const form = document.getElementById("staff-form");
    const card = document.querySelector(".add-staff-card");
    if (!form) return;

    card?.classList.toggle("opacity-90", isLoading);

    form.querySelectorAll("input, textarea, select, button, a.btn").forEach((el) => {
      if (el.id === "btn-submit") return;
      if (isLoading) {
        if (el.tagName !== "A") {
          el.setAttribute("disabled", "disabled");
        }
        if (el.matches("input, textarea, select")) {
          el.classList.add("skeleton-3d-block", "skeleton-3d-float", "skeleton-input");
        }
      } else {
        el.removeAttribute("disabled");
        el.classList.remove("skeleton-3d-block", "skeleton-3d-float", "skeleton-input");
      }
    });

    ["preview-photo", "preview-aadhaarImage", "preview-licenseImage"].forEach((id) => {
      const image = document.getElementById(id);
      if (!image) return;
      image.classList.toggle("skeleton-3d-avatar", isLoading);
      image.classList.toggle("skeleton-3d-float", isLoading);
    });
  }

  function isImageSource(value) {
    const src = String(value || "").trim();
    if (!src) return true;
    if (window.driveLinks && typeof window.driveLinks.isSupportedImageSource === "function") {
      return window.driveLinks.isSupportedImageSource(src);
    }
    return /^data:image\//i.test(src) || /^https?:\/\//i.test(src);
  }

  function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll("[data-error-target]").forEach((input) => {
      window.appUi.clearFieldError(input);
    });
  }

  function setInputError(form, fieldName, message) {
    const input = form?.elements?.[fieldName];
    if (!input) return;
    window.appUi.setFieldError(input, message);
  }

  function getThumbUrl(value, size = 200) {
    if (!value) return "";
    if (window.driveLinks && typeof window.driveLinks.toDisplayUrl === "function") {
      return window.driveLinks.toDisplayUrl(value, size);
    }
    return String(value || "").trim();
  }

  function setupPreview(inputName) {
    const input = document.getElementById(`input-${inputName}`);
    const img = document.getElementById(`preview-${inputName}`);
    const icon = document.getElementById(`icon-${inputName}`);

    if (!input || !img || !icon) return;

    function update() {
      const url = getThumbUrl(input.value.trim());
      if (url) {
        img.src = url;
        img.classList.remove("hidden");
        icon.classList.add("hidden");
      } else {
        img.src = "";
        img.classList.add("hidden");
        icon.classList.remove("hidden");
      }
    }

    input.addEventListener("input", update);
    input.addEventListener("change", update);
    return update; // return so we can manually trigger it
  }

  let updatePhotoPreview, updateAadhaarPreview, updateLicensePreview;

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read image file"));
      reader.readAsDataURL(file);
    });
  }

  function isPdfFile(file) {
    if (!file) return false;
    const name = String(file.name || "").toLowerCase();
    const type = String(file.type || "").toLowerCase();
    return type === "application/pdf" || name.endsWith(".pdf");
  }

  async function pdfFileToImageDataUrl(file) {
    ensurePdfWorker();
    if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== "function") {
      throw new Error("PDF engine not loaded. Reload and try again.");
    }

    const data = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Render first page in high quality.
    const viewport = page.getViewport({ scale: 2.6 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d", { alpha: false });

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.95);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image for crop"));
      img.src = src;
    });
  }

  async function toLimitedDataUrl(canvas, preset) {
    let quality = preset.quality;
    let width = canvas.width;
    let height = canvas.height;

    while (quality >= 0.48) {
      const out = document.createElement("canvas");
      out.width = Math.max(140, Math.round(width));
      out.height = Math.max(140, Math.round(height));

      const ctx = out.getContext("2d");
      ctx.drawImage(canvas, 0, 0, out.width, out.height);

      const dataUrl = out.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= preset.maxChars) {
        return dataUrl;
      }

      quality -= 0.08;
      width *= 0.9;
      height *= 0.9;
    }

    throw new Error("Cropped image is still too large. Try a smaller area.");
  }

  async function applyCroppedValue(field, dataUrl) {
    const input = document.getElementById(`input-${field}`);
    if (!input) return;
    input.value = dataUrl;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    window.appUi.clearFieldError(input);
  }

  async function runAutoCrop(field, sourceUrl) {
    const preset = CROP_PRESETS[field];
    const img = await loadImage(sourceUrl);

    const sourceAspect = img.width / img.height;
    const targetAspect = preset.aspectRatio;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (sourceAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = Math.round((img.width - sw) / 2);
    } else {
      sh = img.width / targetAspect;
      sy = Math.round((img.height - sh) / 2);
    }

    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const result = await toLimitedDataUrl(canvas, preset);
    await applyCroppedValue(field, result);
    window.appUi.showToast("Auto crop applied", "success");
  }

  function resetCropper() {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    activeCropField = null;
  }

  function closeCropModal() {
    const modal = document.getElementById("cropper-modal");
    if (modal && modal.open) {
      modal.close();
    }
    resetCropper();
  }

  async function openCustomCrop(field, sourceUrl) {
    const modal = document.getElementById("cropper-modal");
    const image = document.getElementById("cropper-image");
    const preset = CROP_PRESETS[field];
    if (!modal || !image || !preset) return;

    image.src = sourceUrl;
    activeCropField = field;
    modal.showModal();

    image.onload = () => {
      resetCropper();
      activeCropField = field;
      cropper = new window.Cropper(image, {
        aspectRatio: customCropAspectRatio(field),
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 0.9,
        responsive: true,
        background: false,
      });
    };
  }

  async function applyCustomCrop() {
    if (!cropper || !activeCropField) return;
    const preset = CROP_PRESETS[activeCropField];
    const canvas = cropper.getCroppedCanvas({
      width: preset.width,
      height: preset.height,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      fillColor: "#ffffff",
    });

    const result = await toLimitedDataUrl(canvas, preset);
    await applyCroppedValue(activeCropField, result);
    closeCropModal();
    window.appUi.showToast("Custom crop applied", "success");
  }

  function bindUploadCropTools() {
    const modeMap = new Map();

    function pick(field, mode) {
      const fileInput = document.getElementById(`file-${field}`);
      if (!fileInput) return;
      modeMap.set(field, mode);
      fileInput.value = "";
      fileInput.click();
    }

    ["photo", "aadhaarImage", "licenseImage"].forEach((field) => {
      document.querySelector(`[data-upload-auto=\"${field}\"]`)?.addEventListener("click", () => pick(field, "auto"));
      document.querySelector(`[data-upload-custom=\"${field}\"]`)?.addEventListener("click", () => pick(field, "custom"));
      document.querySelector(`[data-upload-clear=\"${field}\"]`)?.addEventListener("click", () => {
        const input = document.getElementById(`input-${field}`);
        if (!input) return;
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      document.getElementById(`file-${field}`)?.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const mode = modeMap.get(field) || "auto";
          const sourceUrl = isPdfFile(file)
            ? await pdfFileToImageDataUrl(file)
            : await readFileAsDataUrl(file);

          if (isPdfFile(file) && (field === "aadhaarImage" || field === "licenseImage")) {
            window.appUi.showToast("PDF converted to HQ image", "success");
          }

          if (mode === "custom") {
            await openCustomCrop(field, sourceUrl);
          } else {
            await runAutoCrop(field, sourceUrl);
          }
        } catch (error) {
          window.appUi.showToast(error.message || "Image crop failed", "error");
        } finally {
          event.target.value = "";
        }
      });
    });

    document.getElementById("btn-crop-apply")?.addEventListener("click", async () => {
      try {
        await applyCustomCrop();
      } catch (error) {
        window.appUi.showToast(error.message || "Unable to apply crop", "error");
      }
    });

    document.getElementById("btn-crop-cancel")?.addEventListener("click", closeCropModal);
    document.getElementById("cropper-modal")?.addEventListener("close", resetCropper);
  }

  function validate(data) {
    const errors = {};
    const required = [
      "fullName",
      "dob",
      "mobile",
      "address",
      "aadhaarNumber",
      "bloodGroup",
      "designation",
    ];

    for (const key of required) {
      if (!data[key]) {
        errors[key] = "This field is required";
      }
    }

    if (!/^\d{10}$/.test(String(data.mobile))) {
      errors.mobile = "Mobile must be 10 digits";
    }
    if (data.emergencyMobile && !/^\d{10}$/.test(String(data.emergencyMobile))) {
      errors.emergencyMobile = "Emergency mobile must be 10 digits";
    }
    if (!/^\d{12}$/.test(String(data.aadhaarNumber))) {
      errors.aadhaarNumber = "Aadhaar must be 12 digits";
    }
    if (!isImageSource(data.photo)) {
      errors.photo = "Enter a valid image URL or use upload";
    }
    if (data.aadhaarImage && !isImageSource(data.aadhaarImage)) {
      errors.aadhaarImage = "Enter a valid image URL or use upload";
    }
    if (data.licenseImage && !isImageSource(data.licenseImage)) {
      errors.licenseImage = "Enter a valid image URL or use upload";
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error("Please fix highlighted fields");
      err.fieldErrors = errors;
      throw err;
    }
  }

  function formToPayload(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    return {
      fullName: String(data.fullName || "").trim(),
      dob: String(data.dob || "").trim(),
      mobile: String(data.mobile || "").trim(),
      address: String(data.address || "").trim(),
      aadhaarNumber: String(data.aadhaarNumber || "").trim(),
      drivingLicense: String(data.drivingLicense || "").trim(),
      emergencyContactName: String(data.emergencyContactName || "").trim(),
      emergencyMobile: String(data.emergencyMobile || "").trim(),
      aadhaarImage: String(data.aadhaarImage || "").trim(),
      licenseImage: String(data.licenseImage || "").trim(),
      photo: String(data.photo || "").trim(),
      bloodGroup: String(data.bloodGroup || "").trim(),
      designation: String(data.designation || "").trim(),
    };
  }

  function fillForm(staff) {
    const form = document.getElementById("staff-form");
    if (!form || !staff) return;
    form.fullName.value = staff.fullName || "";

    // <input type="date"> strictly requires YYYY-MM-DD format
    let dobVal = staff.dob || "";
    if (dobVal) {
      const d = new Date(dobVal);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dobVal = `${yyyy}-${mm}-${dd}`;
      }
    }
    form.dob.value = dobVal;
    form.mobile.value = staff.mobile || "";
    form.address.value = staff.address || "";
    form.aadhaarNumber.value = staff.aadhaarNumber || "";
    form.drivingLicense.value = staff.drivingLicense || "";
    form.emergencyContactName.value = staff.emergencyContactName || "";
    form.emergencyMobile.value = staff.emergencyMobile || "";
    form.bloodGroup.value = staff.bloodGroup || "";
    form.designation.value = staff.designation || "";
    form.photo.value = staff.photo || "";
    form.aadhaarImage.value = staff.aadhaarImage || "";
    form.licenseImage.value = staff.licenseImage || "";

    // Trigger previews after filling
    if (updatePhotoPreview) updatePhotoPreview();
    if (updateAadhaarPreview) updateAadhaarPreview();
    if (updateLicensePreview) updateLicensePreview();
  }

  async function initEditMode() {
    const id = window.appUi.getQueryParam("id");
    if (!id) return;

    editingId = id;
    const submitLabel = document.getElementById("btn-submit-label");
    if (submitLabel) submitLabel.textContent = "Update Staff";

    const heading = document.querySelector("h1");
    if (heading) heading.textContent = "Edit Staff";

    setFormLoading(true);
    try {
      const res = await window.staffApi.getStaff({ id, page: 1, pageSize: 1 });
      const staff = (res.data || [])[0];
      if (!staff) {
        throw new Error("Staff not found");
      }
      fillForm(staff);
    } catch (error) {
      window.appUi.showToast(error.message, "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const btn = document.getElementById("btn-submit");

    try {
      clearFormErrors(form);
      window.appUi.setButtonLoading(btn, true, "Saving...");
      const payload = formToPayload(form);
      validate(payload);
      if (editingId) {
        await window.staffApi.updateStaff({ id: editingId, ...payload });
        window.appUi.showToast("Staff updated successfully", "success");
      } else {
        await window.staffApi.addStaff(payload);
        window.appUi.showToast("Staff added successfully", "success");
      }
      form.reset();
      setTimeout(() => {
        window.location.href = "staff-list.html";
      }, 900);
    } catch (error) {
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setInputError(form, field, message);
        });
      }
      window.appUi.showToast(error.message, "error");
    } finally {
      window.appUi.setButtonLoading(btn, false);
    }
  }

  if (window.location.pathname.endsWith("add-staff.html")) {
    const form = document.getElementById("staff-form");
    form?.addEventListener("submit", onSubmit);

    form?.querySelectorAll("[data-error-target]").forEach((input) => {
      input.addEventListener("input", () => window.appUi.clearFieldError(input));
      input.addEventListener("change", () => window.appUi.clearFieldError(input));
    });

    updatePhotoPreview = setupPreview("photo");
    updateAadhaarPreview = setupPreview("aadhaarImage");
    updateLicensePreview = setupPreview("licenseImage");

    bindUploadCropTools();

    initEditMode();
  }
})();
