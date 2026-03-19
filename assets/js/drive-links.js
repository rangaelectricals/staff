(function () {
  function isGoogleDriveUrl(url) {
    return /(?:^|\/\/)(?:drive|docs)\.google\.com\//i.test(String(url || ""));
  }

  function isSupportedImageSource(url) {
    const src = String(url || "").trim();
    if (!src) return false;
    if (extractFileId(src)) return true;
    return /^https?:\/\//i.test(src) || /^data:image\//i.test(src);
  }

  function toDisplayUrl(url, size) {
    const src = String(url || "").trim();
    if (!src) return "";
    const id = extractFileId(src);
    if (id) {
      const side = Number(size || 240);
      return `https://drive.google.com/thumbnail?id=${id}&sz=w${side}-h${side}`;
    }
    return src;
  }

  function extractFileId(url) {
    if (!url) return "";
    var clean = String(url).trim();

    // Uploaded/cropped inline data should never be interpreted as a Drive file id.
    if (/^data:image\//i.test(clean)) return "";

    // Only parse IDs from actual Google Drive URLs.
    if (!isGoogleDriveUrl(clean)) return "";
    
    // Try to extract from new format: /file/d/{id}/view
    let idMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];
    
    // Try to extract from old format: open?id={id}
    idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];

    // Fallback: extract long id-like token, but only from a Drive URL.
    idMatch = clean.match(/[-_a-zA-Z0-9]{25,}/);
    return idMatch ? idMatch[0] : "";
  }

  function toIframeUrl(url) {
    // For iframe embeds - works with CORS
    const id = extractFileId(url);
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
  }

  function toPreviewUrl(url) {
    // For preview in new tab
    const id = extractFileId(url);
    return id ? `https://drive.google.com/file/d/${id}/view` : String(url || "").trim();
  }

  function toDownloadUrl(url) {
    // For download link
    const id = extractFileId(url);
    return id ? `https://drive.google.com/uc?export=download&id=${id}` : String(url || "").trim();
  }

  function toShareUrl(url) {
    // For sharing: returns preview URL
    return toPreviewUrl(url);
  }

  window.driveLinks = { extractFileId, toIframeUrl, toPreviewUrl, toDownloadUrl, toShareUrl, isSupportedImageSource, toDisplayUrl };
})();
