var Template = (function () {
  var definitions = Object.freeze([
    {
      name: Constants.SHEETS.EMPLOYEES,
      headers: [
        'Employee ID', 'Full Name', 'Email', 'Role', 'Department',
        'Active', 'Start Date', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.ROLES,
      headers: [
        'Role ID', 'Role Code', 'Role Name', 'Description',
        'Active', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.PERMISSIONS,
      headers: [
        'Permission ID', 'Module', 'Action', 'Description', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.EMPLOYEE_PERMISSIONS,
      headers: [
        'Employee Permission ID', 'Employee ID', 'Permission ID',
        'Allowed', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.CLIENTS,
      headers: [
        'Client ID', 'Client Name', 'Status', 'Primary Contact',
        'Email', 'Phone', 'Industry', 'Account Manager',
        'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.CONTACTS,
      headers: [
        'Contact ID', 'Client ID', 'Full Name', 'Job Title',
        'Email', 'Phone', 'Primary Contact', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.CLIENT_ACTIVITIES,
      headers: [
        'Activity ID', 'Client ID', 'Employee ID', 'Activity Type',
        'Title', 'Details', 'Activity Date', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.PROJECTS,
      headers: [
        'Project ID', 'Client ID', 'Project Name', 'Status',
        'Priority', 'Account Manager', 'Start Date', 'Due Date',
        'Budget', 'Currency', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.TASKS,
      headers: [
        'Task ID', 'Project ID', 'Task Name', 'Status',
        'Priority', 'Assignee', 'Estimated Hours', 'Due Date',
        'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.TASK_COMMENTS,
      headers: [
        'Comment ID', 'Task ID', 'Employee ID', 'Comment',
        'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.TASK_ATTACHMENTS,
      headers: [
        'Attachment ID', 'Task ID', 'File ID', 'File Name',
        'File URL', 'Uploaded By', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.TIMESHEETS,
      headers: [
        'Timesheet ID', 'Employee ID', 'Project ID', 'Task ID',
        'Work Date', 'Hours', 'Description', 'Approval Status',
        'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.PAID_ADS,
      headers: [
        'Ad Spend ID', 'Client ID', 'Campaign ID', 'Platform',
        'Payment Method', 'Amount', 'Currency', 'Spend Date',
        'Receipt File ID', 'Receipt URL', 'Created By', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.CAMPAIGNS,
      headers: [
        'Campaign ID', 'Client ID', 'Project ID', 'Campaign Name',
        'Platform', 'Objective', 'Status', 'Budget', 'Currency',
        'Start Date', 'End Date', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.STUDIO_JOBS,
      headers: [
        'Studio Job ID', 'Client ID', 'Project ID', 'Job Type',
        'Title', 'Status', 'Assigned To', 'Due Date',
        'Delivery URL', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.STUDIO_ASSETS,
      headers: [
        'Asset ID', 'Studio Job ID', 'File ID', 'File Name',
        'File URL', 'Asset Type', 'Uploaded By', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.INVOICES,
      headers: [
        'Invoice ID', 'Client ID', 'Project ID', 'Invoice Number',
        'Issue Date', 'Due Date', 'Amount', 'Tax Amount',
        'Currency', 'Status', 'Created At', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.PAYMENTS,
      headers: [
        'Payment ID', 'Invoice ID', 'Client ID', 'Payment Date',
        'Amount', 'Currency', 'Method', 'Reference', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.STATEMENTS,
      headers: [
        'Statement ID', 'Client ID', 'Statement Date', 'From Date',
        'To Date', 'Total Invoiced', 'Total Paid', 'Balance',
        'PDF File ID', 'PDF URL', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.EXPENSES,
      headers: [
        'Expense ID', 'Expense Date', 'Category', 'Description',
        'Client ID', 'Project ID', 'Amount', 'Currency',
        'Vendor', 'Payment Method', 'Created By', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.SETTINGS,
      headers: [
        'Setting Key', 'Setting Value', 'Description', 'Updated At'
      ]
    },
    {
      name: Constants.SHEETS.NOTIFICATIONS,
      headers: [
        'Notification ID', 'Employee ID', 'Type', 'Title', 'Message',
        'Related Module', 'Related ID', 'Read', 'Created At'
      ]
    },
    {
      name: Constants.SHEETS.AUDIT_LOG,
      headers: [
        'Audit ID', 'Timestamp', 'Actor', 'Action',
        'Entity Type', 'Entity ID', 'Details'
      ]
    }
  ]);

  function getDefinitions() {
    return definitions.map(function (definition) {
      return {
        name: definition.name,
        headers: definition.headers.slice()
      };
    });
  }

  function apply(spreadsheet) {
    getDefinitions().forEach(function (definition) {
      var sheet = spreadsheet.getSheetByName(definition.name);

      if (!sheet) {
        sheet = spreadsheet.insertSheet(definition.name);
      }

      if (sheet.getLastRow() === 0) {
        sheet
          .getRange(1, 1, 1, definition.headers.length)
          .setValues([definition.headers]);
      }

      sheet.setFrozenRows(1);

      sheet
        .getRange(1, 1, 1, definition.headers.length)
        .setFontWeight('bold')
        .setBackground('#1F4E78')
        .setFontColor('#FFFFFF');

      sheet.autoResizeColumns(1, definition.headers.length);
    });

    return spreadsheet;
  }

  return Object.freeze({
    getDefinitions: getDefinitions,
    apply: apply
  });
})();