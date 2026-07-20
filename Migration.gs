var Migration = (function () {
  function seedRows(sheetName, rows) {
    var sheet = Config.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Missing sheet: ' + sheetName);
    }

    if (sheet.getLastRow() > 1) {
      return 0;
    }

    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    return rows.length;
  }

  function seedRoles() {
    var timestamp = Utils.nowIso();

    var rows = [
      ['ROL-ADMIN', 'ADMIN', 'Administrator', 'Full system access', true, timestamp],
      ['ROL-MANAGER', 'MANAGER', 'Manager', 'Operational management access', true, timestamp],
      ['ROL-ACCOUNT', 'ACCOUNT_MANAGER', 'Account Manager', 'CRM and project management access', true, timestamp],
      ['ROL-FINANCE', 'FINANCE', 'Finance', 'Billing and financial reporting access', true, timestamp],
      ['ROL-HR', 'HR', 'Human Resources', 'Employee administration access', true, timestamp],
      ['ROL-CREATIVE', 'CREATIVE', 'Creative', 'Tasks and studio execution access', true, timestamp],
      ['ROL-VIEWER', 'VIEWER', 'Viewer', 'Read-only dashboard access', true, timestamp]
    ];

    return seedRows(Constants.SHEETS.ROLES, rows);
  }

  function seedPermissions() {
    var timestamp = Utils.nowIso();

    var modules = [
      'DASHBOARD',
      'CRM',
      'ADS',
      'STUDIO',
      'TASKS',
      'BILLING',
      'REPORTS',
      'SETTINGS',
      'NOTIFICATIONS'
    ];

    var actions = [
      'VIEW',
      'CREATE',
      'EDIT',
      'DELETE',
      'APPROVE',
      'EXPORT',
      'PRINT'
    ];

    var rows = [];

    modules.forEach(function (moduleName) {
      actions.forEach(function (action) {
        rows.push([
          'PER-' + moduleName + '-' + action,
          moduleName,
          action,
          moduleName + ' ' + action + ' permission',
          timestamp
        ]);
      });
    });

    return seedRows(Constants.SHEETS.PERMISSIONS, rows);
  }

  function upgrade() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = Config.getSpreadsheet();

      Template.apply(spreadsheet);

      var rolesAdded = seedRoles();
      var permissionsAdded = seedPermissions();

      PropertiesService.getScriptProperties().setProperty(
        Constants.APP.PROPERTY_PREFIX + 'SCHEMA_VERSION',
        Constants.APP.VERSION
      );

      Logger.audit('SCHEMA_MIGRATED', 'SYSTEM', spreadsheet.getId(), {
        version: Constants.APP.VERSION,
        rolesAdded: rolesAdded,
        permissionsAdded: permissionsAdded
      });

      return {
        version: Constants.APP.VERSION,
        rolesAdded: rolesAdded,
        permissionsAdded: permissionsAdded,
        spreadsheetUrl: spreadsheet.getUrl()
      };
    } finally {
      lock.releaseLock();
    }
  }

  return Object.freeze({
    upgrade: upgrade
  });
})();

function upgradeToSpecificationV1() {
  return Migration.upgrade();
}