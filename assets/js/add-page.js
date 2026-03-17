(function () {
  let editingId = null;

  function isDriveLink(value) {
    if (!value) return true;
    const fileId = window.driveLinks ? window.driveLinks.extractFileId(value) : "";
    return Boolean(fileId);
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

  function getThumbUrl(driveUrl, size = 200) {
    if (!driveUrl) return "";
    const id = window.driveLinks ? window.driveLinks.extractFileId(driveUrl) : null;
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}-h${size}` : "";
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

  function validate(data) {
    const errors = {};
    const required = [
      "fullName",
      "dob",
      "mobile",
      "address",
      "aadhaarNumber",
      "drivingLicense",
      "emergencyContactName",
      "emergencyMobile",
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
    if (!/^\d{10}$/.test(String(data.emergencyMobile))) {
      errors.emergencyMobile = "Emergency mobile must be 10 digits";
    }
    if (!/^\d{12}$/.test(String(data.aadhaarNumber))) {
      errors.aadhaarNumber = "Aadhaar must be 12 digits";
    }
    if (!isDriveLink(data.photo)) {
      errors.photo = "Enter a valid Google Drive link";
    }
    if (!isDriveLink(data.aadhaarImage)) {
      errors.aadhaarImage = "Enter a valid Google Drive link";
    }
    if (!isDriveLink(data.licenseImage)) {
      errors.licenseImage = "Enter a valid Google Drive link";
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

    try {
      const res = await window.staffApi.getStaff({ id, page: 1, pageSize: 1 });
      const staff = (res.data || [])[0];
      if (!staff) {
        throw new Error("Staff not found");
      }
      fillForm(staff);
    } catch (error) {
      window.appUi.showToast(error.message, "error");
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

    initEditMode();
  }
})();
