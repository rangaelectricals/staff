var SHEET_NAME = 'STAFF_DETAILS';

function doGet(e) {
  return routeRequest_(e);
}

function doPost(e) {
  return routeRequest_(e);
}

function routeRequest_(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : '';
    var payload = parsePayload_(e);

    if (!action) {
      return jsonResponse_(false, null, 'Missing action');
    }

    if (action === 'getStaff') {
      return handleGetStaff_(payload);
    }
    if (action === 'addStaff') {
      return handleAddStaff_(payload);
    }
    if (action === 'updateStaff') {
      return handleUpdateStaff_(payload);
    }
    if (action === 'deleteStaff') {
      return handleDeleteStaff_(payload);
    }
    if (action === 'bulkAddStaff') {
      return handleBulkAddStaff_(payload);
    }

    return jsonResponse_(false, null, 'Unsupported action: ' + action);
  } catch (error) {
    return jsonResponse_(false, null, error.message || 'Unexpected error');
  }
}

function parsePayload_(e) {
  if (!e || !e.parameter) return {};

  if (e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      throw new Error('Invalid payload JSON');
    }
  }

  var payload = {};
  Object.keys(e.parameter).forEach(function (key) {
    if (key !== 'action') {
      payload[key] = e.parameter[key];
    }
  });
  return payload;
}
