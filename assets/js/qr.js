(function () {
  function renderQr(targetId, text) {
    const target = document.getElementById(targetId);
    if (!target || !text || typeof QRCode === "undefined") return;
    target.innerHTML = "";
    new QRCode(target, {
      text,
      width: 120,
      height: 120,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  window.qrUtil = { renderQr };
})();
