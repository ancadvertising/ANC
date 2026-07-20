var GoogleIdentity = (function() {
  function value_(value) {
    return String(value || '').trim();
  }

  function getRows_(sheetName) {
    var sheet = Config.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() < 2) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function(header) {
      return value_(header);
    });

    return values.slice(1).map(function(row) {
      var record = {};
      headers.forEach(function(header, index) {
        record[header] = row[index];
      });
      return record;
    });
  }

  function currentEmail() {
    return value_(Session.getActiveUser().getEmail()).toLowerCase();
  }

  function resolve() {
    var email = currentEmail();

    if (!email) {
      throw new Error('تعذر قراءة بريد حساب Google الحالي.');
    }

    var users = getRows_('Users');
    var user = users.filter(function(item) {
      return value_(item.Email).toLowerCase() === email &&
        String(item.Active).toUpperCase() === 'TRUE';
    })[0];

    if (!user) {
      throw new Error('هذا البريد غير مسجل أو أن الحساب موقوف: ' + email);
    }

    return {
      email: email,
      userType: value_(user['User Type']).toUpperCase(),
      role: value_(user.Role).toUpperCase(),
      fullName: value_(user['Full Name']),
      employeeId: value_(user['Employee ID']),
      clientId: value_(user['Client ID'])
    };
  }

  return Object.freeze({
    currentEmail: currentEmail,
    resolve: resolve
  });
})();

function getCurrentGoogleUser() {
  return GoogleIdentity.resolve();
}