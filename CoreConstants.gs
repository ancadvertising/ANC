var Constants = (function () {
  var APP = Object.freeze({
    NAME: 'ANC Marketing Agency ERP',
    VERSION: '1.0.0',
    TIME_ZONE: 'Africa/Cairo',
    PROPERTY_PREFIX: 'ANC_ERP_',
    CACHE_PREFIX: 'anc_erp_v1:'
  });

  return Object.freeze({
    APP: APP,

    ROLES: Object.freeze([
      'ADMIN',
      'MANAGER',
      'ACCOUNT_MANAGER',
      'FINANCE',
      'HR',
      'CREATIVE',
      'VIEWER'
    ]),

    CLIENT_STATUSES: Object.freeze([
      'LEAD',
      'ACTIVE',
      'INACTIVE',
      'ARCHIVED'
    ]),

    PROJECT_STATUSES: Object.freeze([
      'DRAFT',
      'ACTIVE',
      'ON_HOLD',
      'COMPLETED',
      'CANCELLED'
    ]),

    TASK_STATUSES: Object.freeze([
      'TODO',
      'IN_PROGRESS',
      'IN_REVIEW',
      'DONE',
      'BLOCKED'
    ]),

    PRIORITIES: Object.freeze([
      'LOW',
      'MEDIUM',
      'HIGH',
      'URGENT'
    ]),

    SHEETS: Object.freeze({
      EMPLOYEES: 'Employees',
      ROLES: 'Roles',
      PERMISSIONS: 'Permissions',
      EMPLOYEE_PERMISSIONS: 'EmployeePermissions',
      CLIENTS: 'Clients',
      CONTACTS: 'Contacts',
      CLIENT_ACTIVITIES: 'ClientActivities',
      PROJECTS: 'Projects',
      TASKS: 'Tasks',
      TASK_COMMENTS: 'TaskComments',
      TASK_ATTACHMENTS: 'TaskAttachments',
      TIMESHEETS: 'Timesheets',
      PAID_ADS: 'PaidAds',
      CAMPAIGNS: 'Campaigns',
      STUDIO_JOBS: 'StudioJobs',
      STUDIO_ASSETS: 'StudioAssets',
      INVOICES: 'Invoices',
      PAYMENTS: 'Payments',
      STATEMENTS: 'Statements',
      EXPENSES: 'Expenses',
      SETTINGS: 'Settings',
      NOTIFICATIONS: 'Notifications',
      AUDIT_LOG: 'Audit Log'
    }),

    ROUTES: Object.freeze({
      HEALTH: 'health',
      BOOTSTRAP: 'bootstrap',
      CONFIG: 'config',
      META: 'meta'
    })
  });
})();