var UserManagement = (function() {
  var HEADERS = [
    'User ID', 'Username', 'Password Salt', 'Password Hash', 'User Type',
    'Employee ID', 'Client ID', 'Role', 'Full Name', 'Email', 'Active',
    'Must Change Password', 'Last Login', 'Created At', 'Updated At'
  ];

  function assertAdmin_() {
    var user = GoogleIdentity.resolve();

    if (user.userType !== 'ADMIN' && user.role !== 'ADMIN') {
      throw new Error('ليس لديك صلاحية لإدارة المستخدمين.');
    }

    return user;
  }

  function sheet_() {
    var sheet = Config.getSpreadsheet().getSheetByName('Users');

    if (!sheet) {
      sheet = Config.getSpreadsheet().insertSheet('Users');
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    return sheet;
  }

  function rows_() {
    var sheet = sheet_();

    if (sheet.getLastRow() < 2) {
      return [];
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();

    return values.map(function(row, index) {
      var item = { rowNumber: index + 2 };

      HEADERS.forEach(function(header, column) {
        item[header] = row[column];
      });

      return item;
    });
  }

  function list() {
    assertAdmin_();

    return rows_().map(function(item) {
      return {
        userId: item['User ID'],
        fullName: item['Full Name'],
        email: item.Email,
        userType: item['User Type'],
        role: item.Role,
        employeeId: item['Employee ID'],
        clientId: item['Client ID'],
        active: String(item.Active).toUpperCase() === 'TRUE'
      };
    });
  }

  function create(data) {
    assertAdmin_();

    var email = String(data.email || '').trim().toLowerCase();
    var fullName = String(data.fullName || '').trim();
    var userType = String(data.userType || 'EMPLOYEE').trim().toUpperCase();
    var role = String(data.role || userType).trim().toUpperCase();

    if (!email || !fullName) {
      throw new Error('الاسم والبريد الإلكتروني مطلوبان.');
    }

    if (['ADMIN', 'EMPLOYEE', 'CLIENT'].indexOf(userType) === -1) {
      throw new Error('نوع الحساب غير صحيح.');
    }

    if (rows_().some(function(item) {
      return String(item.Email).trim().toLowerCase() === email;
    })) {
      throw new Error('هذا البريد مسجل بالفعل.');
    }

    var now = new Date().toISOString();
    var employeeId = userType === 'EMPLOYEE' ? 'EMP-' + Utilities.getUuid() : '';
    var clientId = userType === 'CLIENT' ? 'CLT-' + Utilities.getUuid() : '';

    sheet_().appendRow([
      'USR-' + Utilities.getUuid(),
      email.split('@')[0],
      '', '',
      userType,
      employeeId,
      clientId,
      role,
      fullName,
      email,
      true,
      false,
      '',
      now,
      now
    ]);

    Logger.audit('CREATE_GOOGLE_USER', 'USER', email, {
      userType: userType,
      role: role
    });

    return { ok: true, email: email, employeeId: employeeId, clientId: clientId };
  }

  function setActive(email, active) {
    assertAdmin_();

    var user = rows_().filter(function(item) {
      return String(item.Email).trim().toLowerCase() === String(email).trim().toLowerCase();
    })[0];

    if (!user) {
      throw new Error('الحساب غير موجود.');
    }

    sheet_().getRange(user.rowNumber, 11).setValue(active === true);
    sheet_().getRange(user.rowNumber, 15).setValue(new Date().toISOString());

    return { ok: true };
  }

  return Object.freeze({
    list: list,
    create: create,
    setActive: setActive
  });
})();

function userManagementList() {
  return UserManagement.list();
}

function userManagementCreate(data) {
  return UserManagement.create(data);
}

function userManagementSetActive(email, active) {
  return UserManagement.setActive(email, active);
}