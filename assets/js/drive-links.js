(function () {
  function extractFileId(url) {
    if (!url) return "";
    
    // Try to extract from new format: /file/d/{id}/view
    let idMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];
    
    // Try to extract from old format: open?id={id}
    idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) return idMatch[1];
    
    // Fallback: extract any long alphanumeric string with hyphens/underscores
    idMatch = url.match(/[-_a-zA-Z0-9]{25,}/);
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
    return id ? `https://drive.google.com/file/d/${id}/view` : url;
  }

  function toDownloadUrl(url) {
    // For download link
    const id = extractFileId(url);
    return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
  }

  function toShareUrl(url) {
    // For sharing: returns preview URL
    return toPreviewUrl(url);
  }

  window.driveLinks = { extractFileId, toIframeUrl, toPreviewUrl, toDownloadUrl, toShareUrl };
})();
