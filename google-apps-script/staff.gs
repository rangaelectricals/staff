function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet ' + SHEET_NAME + ' not found');
  }
  return sheet;
}

function requiredHeaders_() {
  return [
    'Staff ID',
    'Timestamp',
    'Full Name',
    'Date of Birth',
    'Mobile',
    'Address',
    'Aadhaar Number',
    'Driving License',
    'Emergency Contact Name',
    'Emergency Mobile',
    'Aadhaar Image',
    'License Image',
    'Photo',
    'Blood Group',
    'Designation'
  ];
}

function ensureHeaders_() {
  var sheet = getSheet_();
  var existing = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  var required = requiredHeaders_();

  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
    return;
  }

  var mismatch = required.some(function (header, i) {
    return String(existing[i] || '').trim() !== header;
  });

  if (mismatch) {
    throw new Error('Sheet headers do not match required STAFF_DETAILS structure.');
  }
}

function rowsToObjects_(rows) {
  return rows.map(function (row) {
    return {
      id: row[0],
      timestamp: row[1],
      fullName: row[2],
      dob: row[3],
      mobile: row[4],
      address: row[5],
      aadhaarNumber: row[6],
      drivingLicense: row[7],
      emergencyContactName: row[8],
      emergencyMobile: row[9],
      aadhaarImage: row[10],
      licenseImage: row[11],
      photo: row[12],
      bloodGroup: row[13],
      designation: row[14]
    };
  });
}

function readAllObjects_() {
  ensureHeaders_();
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
  return rowsToObjects_(values);
}

function handleGetStaff_(payload) {
  var page = Math.max(1, Number(payload.page || 1));
  var pageSize = Math.max(1, Number(payload.pageSize || 10));
  var id = String(payload.id || '').trim().toLowerCase();
  var name = String(payload.name || '').trim().toLowerCase();
  var mobile = String(payload.mobile || '').trim().toLowerCase();
  var designation = String(payload.designation || '').trim().toLowerCase();

  var all = readAllObjects_();

  var filtered = all.filter(function (item) {
    if (id && String(item.id || '').toLowerCase() !== id) return false;
    if (name && String(item.fullName || '').toLowerCase().indexOf(name) === -1) return false;
    if (mobile && String(item.mobile || '').toLowerCase().indexOf(mobile) === -1) return false;
    if (designation && String(item.designation || '').toLowerCase().indexOf(designation) === -1) return false;
    return true;
  });

  var start = (page - 1) * pageSize;
  var paged = filtered.slice(start, start + pageSize);

  var now = new Date();
  var firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  var stats = {
    totalStaff: all.length,
    drivers: all.filter(function (x) { return String(x.designation || '').toLowerCase() === 'driver'; }).length,
    electricians: all.filter(function (x) { return String(x.designation || '').toLowerCase() === 'electrician'; }).length,
    newStaffAdded: all.filter(function (x) {
      var t = new Date(x.timestamp);
      return !isNaN(t.getTime()) && t >= firstOfMonth;
    }).length
  };

  return jsonResponse_(true, paged, 'Staff fetched', {
    page: page,
    pageSize: pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize)
  }, stats);
}

function generateStaffId_() {
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  var rand = Math.floor(Math.random() * 900 + 100);
  return 'STF-' + stamp + '-' + rand;
}

function validatePayload_(payload, options) {
  options = options || {};
  var allowMissingDocs = options.allowMissingDocs === true;
  var fields = [
    'fullName','dob','mobile','address','aadhaarNumber','drivingLicense',
    'emergencyContactName','emergencyMobile','photo','bloodGroup','designation'
  ];

  if (!allowMissingDocs) {
    fields.push('aadhaarImage');
    fields.push('licenseImage');
  }

  fields.forEach(function (key) {
    if (!String(payload[key] || '').trim()) {
      throw new Error('Missing required field: ' + key);
    }
  });

  if (!/^\d{10}$/.test(String(payload.mobile))) {
    throw new Error('Mobile must be 10 digits');
  }
  if (!/^\d{10}$/.test(String(payload.emergencyMobile))) {
    throw new Error('Emergency mobile must be 10 digits');
  }
}

function handleAddStaff_(payload) {
  validatePayload_(payload);
  ensureHeaders_();
  var sheet = getSheet_();

  var row = [
    generateStaffId_(),
    new Date(),
    payload.fullName,
    payload.dob,
    payload.mobile,
    payload.address,
    payload.aadhaarNumber,
    payload.drivingLicense,
    payload.emergencyContactName,
    payload.emergencyMobile,
    payload.aadhaarImage,
    payload.licenseImage,
    payload.photo,
    payload.bloodGroup,
    payload.designation
  ];

  sheet.appendRow(row);
  return jsonResponse_(true, { id: row[0] }, 'Staff added successfully');
}

function findRowById_(id) {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return i + 2;
    }
  }
  return -1;
}

function handleUpdateStaff_(payload) {
  if (!payload.id) throw new Error('id is required for update');
  validatePayload_(payload);

  var rowIndex = findRowById_(payload.id);
  if (rowIndex === -1) {
    throw new Error('Staff not found');
  }

  var sheet = getSheet_();
  sheet.getRange(rowIndex, 2, 1, 14).setValues([[
    new Date(),
    payload.fullName,
    payload.dob,
    payload.mobile,
    payload.address,
    payload.aadhaarNumber,
    payload.drivingLicense,
    payload.emergencyContactName,
    payload.emergencyMobile,
    payload.aadhaarImage,
    payload.licenseImage,
    payload.photo,
    payload.bloodGroup,
    payload.designation
  ]]);

  return jsonResponse_(true, { id: payload.id }, 'Staff updated successfully');
}

function handleDeleteStaff_(payload) {
  if (!payload.id) throw new Error('id is required for delete');

  var rowIndex = findRowById_(payload.id);
  if (rowIndex === -1) {
    throw new Error('Staff not found');
  }

  getSheet_().deleteRow(rowIndex);
  return jsonResponse_(true, { id: payload.id }, 'Staff deleted successfully');
}

function handleBulkAddStaff_(payload) {
  ensureHeaders_();
  var rows = (payload && payload.rows && payload.rows.length) ? payload.rows : [];
  if (!rows.length) {
    throw new Error('rows[] is required for bulk upload');
  }

  var sheet = getSheet_();
  var valuesToAppend = [];
  var results = [];

  rows.forEach(function (item, idx) {
    try {
      validatePayload_(item, { allowMissingDocs: true });

      valuesToAppend.push([
        generateStaffId_(),
        new Date(),
        item.fullName,
        item.dob,
        item.mobile,
        item.address,
        item.aadhaarNumber,
        item.drivingLicense,
        item.emergencyContactName,
        item.emergencyMobile,
        item.aadhaarImage || '',
        item.licenseImage || '',
        item.photo,
        item.bloodGroup,
        item.designation
      ]);

      results.push({ row: idx + 2, success: true, message: 'OK' });
    } catch (err) {
      results.push({ row: idx + 2, success: false, message: err.message || 'Invalid row' });
    }
  });

  if (valuesToAppend.length) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, valuesToAppend.length, 15).setValues(valuesToAppend);
  }

  return jsonResponse_(true, {
    total: rows.length,
    inserted: valuesToAppend.length,
    failed: rows.length - valuesToAppend.length,
    results: results
  }, 'Bulk upload processed');
}
