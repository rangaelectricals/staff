(function () {
  let editingId = null;

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
      "photo",
      "aadhaarImage",
      "licenseImage",
    ];

    for (const key of required) {
      if (!data[key]) {
        throw new Error(`Field ${key} is required`);
      }
    }

    if (!/^\d{10}$/.test(String(data.mobile))) {
      throw new Error("Mobile must be 10 digits");
    }
    if (!/^\d{10}$/.test(String(data.emergencyMobile))) {
      throw new Error("Emergency mobile must be 10 digits");
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
    document.getElementById("btn-submit").textContent = "Update Staff";

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
      btn.disabled = true;
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
      window.appUi.showToast(error.message, "error");
    } finally {
      btn.disabled = false;
    }
  }

  if (window.location.pathname.endsWith("add-staff.html")) {
    document.getElementById("staff-form")?.addEventListener("submit", onSubmit);

    updatePhotoPreview = setupPreview("photo");
    updateAadhaarPreview = setupPreview("aadhaarImage");
    updateLicensePreview = setupPreview("licenseImage");

    initEditMode();
  }
})();
