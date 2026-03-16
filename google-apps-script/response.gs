function jsonResponse_(success, data, message, pagination, stats) {
  var body = {
    success: success,
    data: data || null,
    message: message || ''
  };

  if (pagination) body.pagination = pagination;
  if (stats) body.stats = stats;

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
