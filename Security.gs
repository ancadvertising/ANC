var Security = (function () {
  'use strict';

  var ADMIN_PROPERTY = 'ANC_ERP_ADMIN_EMAIL';
  var CACHE_SECONDS = 300;

  var ACTIONS = {
    VIEW: 'VIEW',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    APPROVE: 'APPROVE',
    EXPORT: 'EXPORT',
    PRINT: 'PRINT'
  };

  var MODULES = {
    DASHBOARD: 'DASHBOARD',
    CRM: 'CRM',
    ADS: 'ADS',
    STUDIO: 'STUDIO',
    TASKS: 'TASKS',
    BILLING: 'BILLING',
    REPORTS: 'REPORTS',
    SETTINGS: 'SETTINGS',
    NOTIFICATIONS: 'NOTIFICATIONS'
  };

  var ROLE_PERMISSIONS = {
    ADMIN: ['*'],
    MANAGER: ['*'],

    ACCOUNT_MANAGER: [
      'DASHBOARD:VIEW',
      'CRM:VIEW', 'CRM:CREATE', 'CRM:EDIT', 'CRM:EXPORT', 'CRM:PRINT',
      'TASKS:VIEW', 'TASKS:CREATE', 'TASKS:EDIT', 'TASKS:APPROVE',
      'ADS:VIEW', 'ADS:CREATE', 'ADS:EDIT',
      'STUDIO:VIEW', 'STUDIO:CREATE', 'STUDIO:EDIT',
      'BILLING:VIEW', 'BILLING:CREATE', 'BILLING:PRINT',
      'REPORTS:VIEW', 'REPORTS:EXPORT',
      'NOTIFICATIONS:VIEW'
    ],

    FINANCE: [
      'DASHBOARD:VIEW',
      'CRM:VIEW',
      'TASKS:VIEW',
      'BILLING:VIEW', 'BILLING:CREATE', 'BILLING:EDIT',
      'BILLING:APPROVE', 'BILLING:EXPORT', 'BILLING:PRINT',
      'REPORTS:VIEW', 'REPORTS:EXPORT',
      'NOTIFICATIONS:VIEW'
    ],

    MEDIA_BUYER: [
      'DASHBOARD:VIEW',
      'CRM:VIEW',
      'ADS:VIEW', 'ADS:CREATE', 'ADS:EDIT', 'ADS:EXPORT',
      'TASKS:VIEW', 'TASKS:CREATE', 'TASKS:EDIT',
      'REPORTS:VIEW',
      'NOTIFICATIONS:VIEW'
    ],

    CREATIVE: [
      'DASHBOARD:VIEW',
      'CRM:VIEW',
      'STUDIO:VIEW', 'STUDIO:CREATE', 'STUDIO:EDIT',
      'TASKS:VIEW', 'TASKS:CREATE', 'TASKS:EDIT',
      'NOTIFICATIONS:VIEW'
    ],

    EMPLOYEE: [
      'DASHBOARD:VIEW',
      'TASKS:VIEW', 'TASKS:EDIT',
      'NOTIFICATIONS:VIEW'
    ]
  };

  var PAGE_ACCESS = {
    dashboard: { module: MODULES.DASHBOARD, action: ACTIONS.VIEW },
    crm: { module: MODULES.CRM, action: ACTIONS.VIEW },
    operations: { module: MODULES.TASKS, action: ACTIONS.VIEW },
    finance: { module: MODULES.BILLING, action: ACTIONS.VIEW },
    reports: { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    alerts: { module: MODULES.NOTIFICATIONS, action: ACTIONS.VIEW },
    profitability: { module: MODULES.REPORTS, action: ACTIONS.VIEW },
    documents: { module: MODULES.BILLING, action: ACTIONS.VIEW },
    status: { module: MODULES.SETTINGS, action: ACTIONS.VIEW },
    audit: { module: MODULES.SETTINGS, action: ACTIONS.VIEW },
    ads: { module: MODULES.ADS, action: ACTIONS.VIEW },
    studio: { module: MODULES.STUDIO, action: ACTIONS.VIEW },
    settings: { module: MODULES.SETTINGS, action: ACTIONS.VIEW }
  };

  var ROUTE_MODULES = {
    health: MODULES.DASHBOARD,
    dashboard: MODULES.DASHBOARD,
    clients: MODULES.CRM,
    projects: MODULES.CRM,
    contacts: MODULES.CRM,
    activities: MODULES.CRM,
    tasks: MODULES.TASKS,
    taskcomments: MODULES.TASKS,
    taskattachments: MODULES.TASKS,
    timesheets: MODULES.TASKS,
    paidads: MODULES.ADS,
    campaigns: MODULES.ADS,
    studiojobs: MODULES.STUDIO,
    studioassets: MODULES.STUDIO,
    invoices: MODULES.BILLING,
    payments: MODULES.BILLING,
    expenses: MODULES.BILLING,
    statements: MODULES.BILLING,
    invoicepdf: MODULES.BILLING,
    invoiceemail: MODULES.BILLING,
    reports: MODULES.REPORTS,
    profitability: MODULES.REPORTS,
    employees: MODULES.SETTINGS,
    permissions: MODULES.SETTINGS,
    settings: MODULES.SETTINGS,
    audit: MODULES.SETTINGS,
    logs: MODULES.SETTINGS,
    backup: MODULES.SETTINGS,
    diagnostics: MODULES.SETTINGS,
    status: MODULES.SETTINGS,
    notifications: MODULES.NOTIFICATIONS
  };

  function getSheetName(key, fallbackName) {
    if (
      typeof Constants !== 'undefined' &&
      Constants.SHEETS &&
      Constants.SHEETS[key]
    ) {
      return Constants.SHEETS[key];
    }

    return fallbackName;
  }

  var SHEETS = {
    EMPLOYEES: getSheetName('EMPLOYEES', 'Employees'),
    EMPLOYEE_PERMISSIONS: getSheetName(
      'EMPLOYEE_PERMISSIONS',
      'Employee Permissions'
    )
  };

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[\s_-]/g, '');
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function createSecurityError(code, message) {
    var error = new Error(message);
    error.name = code;
    error.code = code;
    return error;
  }

  function getSpreadsheet() {
    return Config.getSpreadsheet();
  }

  function getCacheKey(sheetName) {
    return 'security_sheet_' + String(sheetName || '').replace(/\s+/g, '_');
  }

  function getSheetObjects(sheetName) {
    var cache = CacheService.getScriptCache();
    var cacheKey = getCacheKey(sheetName);
    var cached = cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    var sheet = getSpreadsheet().getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() < 2) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (header) {
      return String(header || '').trim();
    });

    var rows = values.slice(1)
      .filter(function (row) {
        return row.some(function (value) {
          return value !== '' && value !== null;
        });
      })
      .map(function (row) {
        var object = {};

        headers.forEach(function (header, index) {
          object[header] = row[index];
        });

        return object;
      });

    cache.put(cacheKey, JSON.stringify(rows), CACHE_SECONDS);
    return rows;
  }

  function clearSecurityCache() {
    var cache = CacheService.getScriptCache();

    cache.remove(getCacheKey(SHEETS.EMPLOYEES));
    cache.remove(getCacheKey(SHEETS.EMPLOYEE_PERMISSIONS));
  }

  function getCurrentEmail() {
    var activeEmail = normalizeEmail(Session.getActiveUser().getEmail());

    if (activeEmail) {
      return activeEmail;
    }

    var effectiveEmail = normalizeEmail(Session.getEffectiveUser().getEmail());

    if (effectiveEmail) {
      return effectiveEmail;
    }

    throw createSecurityError(
      'AUTHENTICATION_REQUIRED',
      'تعذر تحديد بريد Google الحالي. تأكد من النشر بإعداد User accessing the web app.'
    );
  }

  function getAdminEmail() {
    return normalizeEmail(
      PropertiesService.getScriptProperties().getProperty(ADMIN_PROPERTY)
    );
  }

  function isActiveEmployee(employee) {
    var activeValue = employee['Active'];

    if (
      activeValue === '' ||
      activeValue === null ||
      typeof activeValue === 'undefined'
    ) {
      return true;
    }

    return activeValue === true ||
      normalizeText(activeValue) === 'TRUE' ||
      normalizeText(activeValue) === 'YES' ||
      normalizeText(activeValue) === 'ACTIVE';
  }

  function findEmployeeByEmail(email) {
    var normalized = normalizeEmail(email);

    return getSheetObjects(SHEETS.EMPLOYEES).find(function (employee) {
      return normalizeEmail(employee['Email']) === normalized &&
        isActiveEmployee(employee);
    }) || null;
  }

  function getEmployeeOverrides(email) {
    var normalizedEmail = normalizeEmail(email);

    return getSheetObjects(SHEETS.EMPLOYEE_PERMISSIONS)
      .filter(function (permission) {
        return normalizeEmail(permission['Employee Email']) === normalizedEmail;
      })
      .map(function (permission) {
        return {
          module: normalizeText(permission['Module']),
          action: normalizeText(permission['Action']),
          allowed: permission['Allowed'] === true ||
            normalizeText(permission['Allowed']) === 'TRUE' ||
            normalizeText(permission['Allowed']) === 'YES'
        };
      });
  }

  function getUserProfile() {
    var email = getCurrentEmail();
    var adminEmail = getAdminEmail();

    if (adminEmail && email === adminEmail) {
      return {
        authenticated: true,
        email: email,
        fullName: 'System Administrator',
        role: 'ADMIN',
        employeeId: '',
        department: 'Administration',
        isAdmin: true
      };
    }

    var employee = findEmployeeByEmail(email);

    if (!employee) {
      throw createSecurityError(
        'ACCESS_DENIED',
        'هذا الحساب غير مسجل كموظف نشط. أضف بريده إلى جدول Employees.'
      );
    }

    var role = normalizeText(employee['Role']) || 'EMPLOYEE';

    if (!ROLE_PERMISSIONS[role]) {
      role = 'EMPLOYEE';
    }

    return {
      authenticated: true,
      email: email,
      fullName: employee['Full Name'] || employee['Name'] || email,
      role: role,
      employeeId: employee['Employee ID'] || '',
      department: employee['Department'] || '',
      isAdmin: false
    };
  }

  function hasRolePermission(role, moduleName, action) {
    var permissions = ROLE_PERMISSIONS[normalizeText(role)] || [];
    var permissionKey = normalizeText(moduleName) + ':' + normalizeText(action);

    return permissions.indexOf('*') !== -1 ||
      permissions.indexOf(permissionKey) !== -1;
  }

  function getEmployeeOverride(email, moduleName, action) {
    var moduleKey = normalizeText(moduleName);
    var actionKey = normalizeText(action);

    var overrides = getEmployeeOverrides(email).filter(function (override) {
      return (override.module === moduleKey || override.module === '*') &&
        (override.action === actionKey || override.action === '*');
    });

    return overrides.length ? overrides[overrides.length - 1].allowed : null;
  }

  function hasPermission(moduleName, action, profile) {
    var currentProfile = profile || getUserProfile();

    if (currentProfile.isAdmin) {
      return true;
    }

    var override = getEmployeeOverride(
      currentProfile.email,
      moduleName,
      action
    );

    if (override !== null) {
      return override;
    }

    return hasRolePermission(currentProfile.role, moduleName, action);
  }

  function assertPermission(moduleName, action) {
    var profile = getUserProfile();

    if (!hasPermission(moduleName, action, profile)) {
      throw createSecurityError(
        'PERMISSION_DENIED',
        'ليس لديك صلاحية ' + action + ' في وحدة ' + moduleName + '.'
      );
    }

    return profile;
  }

  function assertPageAccess(pageName) {
    var page = String(pageName || 'dashboard').trim().toLowerCase();
    var requirement = PAGE_ACCESS[page];

    if (!requirement) {
      throw createSecurityError('PAGE_NOT_FOUND', 'الصفحة المطلوبة غير موجودة.');
    }

    return assertPermission(requirement.module, requirement.action);
  }

  function inferAction(route, method) {
    var routeKey = normalizeText(route);
    var methodKey = normalizeText(method);

    if (routeKey.indexOf('PDF') !== -1 || routeKey.indexOf('PRINT') !== -1) {
      return ACTIONS.PRINT;
    }

    if (routeKey.indexOf('EXPORT') !== -1 || routeKey.indexOf('EMAIL') !== -1) {
      return ACTIONS.EXPORT;
    }

    if (routeKey.indexOf('APPROVE') !== -1 || routeKey.indexOf('STATUS') !== -1) {
      return ACTIONS.APPROVE;
    }

    if (methodKey === 'POST') {
      return ACTIONS.CREATE;
    }

    if (methodKey === 'PUT' || methodKey === 'PATCH') {
      return ACTIONS.EDIT;
    }

    if (methodKey === 'DELETE') {
      return ACTIONS.DELETE;
    }

    return ACTIONS.VIEW;
  }

  function getRouteModule(route) {
    var routeKey = normalizeText(route).toLowerCase();

    if (ROUTE_MODULES[routeKey]) {
      return ROUTE_MODULES[routeKey];
    }

    if (routeKey.indexOf('client') !== -1 || routeKey.indexOf('contact') !== -1) {
      return MODULES.CRM;
    }

    if (routeKey.indexOf('task') !== -1 || routeKey.indexOf('time') !== -1) {
      return MODULES.TASKS;
    }

    if (
      routeKey.indexOf('invoice') !== -1 ||
      routeKey.indexOf('payment') !== -1 ||
      routeKey.indexOf('expense') !== -1
    ) {
      return MODULES.BILLING;
    }

    if (routeKey.indexOf('campaign') !== -1 || routeKey.indexOf('ad') !== -1) {
      return MODULES.ADS;
    }

    if (routeKey.indexOf('studio') !== -1 || routeKey.indexOf('asset') !== -1) {
      return MODULES.STUDIO;
    }

    if (routeKey.indexOf('report') !== -1) {
      return MODULES.REPORTS;
    }

    return MODULES.SETTINGS;
  }

  function assertApiAccess(route, method) {
    var routeKey = String(route || '').trim().toLowerCase();

    if (routeKey === 'health') {
      return {
        authenticated: true,
        email: 'health-check',
        role: 'PUBLIC'
      };
    }

    return assertPermission(
      getRouteModule(routeKey),
      inferAction(routeKey, method)
    );
  }

  function listUserPermissions() {
    var profile = getUserProfile();
    var permissions = {};

    Object.keys(MODULES).forEach(function (moduleKey) {
      var moduleName = MODULES[moduleKey];
      permissions[moduleName] = {};

      Object.keys(ACTIONS).forEach(function (actionKey) {
        var action = ACTIONS[actionKey];
        permissions[moduleName][action] = hasPermission(
          moduleName,
          action,
          profile
        );
      });
    });

    return {
      profile: profile,
      permissions: permissions
    };
  }

  function ensureEmployeePermissionsSheet() {
    var spreadsheet = getSpreadsheet();
    var sheet = spreadsheet.getSheetByName(SHEETS.EMPLOYEE_PERMISSIONS);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEETS.EMPLOYEE_PERMISSIONS);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Permission Override ID',
        'Employee Email',
        'Module',
        'Action',
        'Allowed',
        'Reason',
        'Created At',
        'Updated At'
      ]);
      sheet.setFrozenRows(1);
    }

    return sheet;
  }

  function setEmployeePermission(employeeEmail, moduleName, action, allowed, reason) {
    assertPermission(MODULES.SETTINGS, ACTIONS.EDIT);

    var email = normalizeEmail(employeeEmail);

    if (!email) {
      throw createSecurityError('VALIDATION_ERROR', 'بريد الموظف مطلوب.');
    }

    if (!findEmployeeByEmail(email)) {
      throw createSecurityError(
        'EMPLOYEE_NOT_FOUND',
        'لا يوجد موظف نشط بهذا البريد الإلكتروني.'
      );
    }

    var sheet = ensureEmployeePermissionsSheet();
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var emailIndex = headers.indexOf('Employee Email');
    var moduleIndex = headers.indexOf('Module');
    var actionIndex = headers.indexOf('Action');
    var allowedIndex = headers.indexOf('Allowed');
    var reasonIndex = headers.indexOf('Reason');
    var updatedAtIndex = headers.indexOf('Updated At');
    var now = new Date().toISOString();
    var rowNumber = -1;

    for (var index = 1; index < values.length; index++) {
      if (
        normalizeEmail(values[index][emailIndex]) === email &&
        normalizeText(values[index][moduleIndex]) === normalizeText(moduleName) &&
        normalizeText(values[index][actionIndex]) === normalizeText(action)
      ) {
        rowNumber = index + 1;
        break;
      }
    }

    if (rowNumber > 0) {
      sheet.getRange(rowNumber, allowedIndex + 1).setValue(Boolean(allowed));
      sheet.getRange(rowNumber, reasonIndex + 1).setValue(reason || '');
      sheet.getRange(rowNumber, updatedAtIndex + 1).setValue(now);
    } else {
      sheet.appendRow([
        'EPR-' + Utilities.getUuid(),
        email,
        normalizeText(moduleName),
        normalizeText(action),
        Boolean(allowed),
        reason || '',
        now,
        now
      ]);
    }

    clearSecurityCache();

    return {
      ok: true,
      employeeEmail: email,
      module: normalizeText(moduleName),
      action: normalizeText(action),
      allowed: Boolean(allowed)
    };
  }

  function setupAccessControl() {
    var email = getCurrentEmail();

    PropertiesService.getScriptProperties().setProperty(ADMIN_PROPERTY, email);
    clearSecurityCache();

    return {
      ok: true,
      message: 'تم تعيين مدير النظام بنجاح.',
      adminEmail: email
    };
  }

  return {
    ACTIONS: ACTIONS,
    MODULES: MODULES,
    getCurrentEmail: getCurrentEmail,
    getUserProfile: getUserProfile,
    getUserPermissions: listUserPermissions,
    hasPermission: hasPermission,
    assertPermission: assertPermission,
    assertPageAccess: assertPageAccess,
    assertApiAccess: assertApiAccess,
    setEmployeePermission: setEmployeePermission,
    setupAccessControl: setupAccessControl,
    clearCache: clearSecurityCache
  };
})();

function setupAccessControl() {
  return Security.setupAccessControl();
}

function getCurrentUserProfile() {
  return Security.getUserProfile();
}

function getMyPermissions() {
  return Security.getUserPermissions();
}

function grantEmployeePermission(employeeEmail, moduleName, action, reason) {
  return Security.setEmployeePermission(
    employeeEmail,
    moduleName,
    action,
    true,
    reason || 'صلاحية إضافية منحها مدير النظام'
  );
}

function denyEmployeePermission(employeeEmail, moduleName, action, reason) {
  return Security.setEmployeePermission(
    employeeEmail,
    moduleName,
    action,
    false,
    reason || 'تقييد صلاحية بواسطة مدير النظام'
  );
}