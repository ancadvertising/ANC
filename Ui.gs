var UiService = (function () {
  function toClientValue(value) {
    if (value instanceof Date) {
      return Utilities.formatDate(
        value,
        Constants.APP.TIME_ZONE,
        'yyyy-MM-dd HH:mm:ss'
      );
    }

    if (Array.isArray(value)) {
      return value.map(toClientValue);
    }

    if (value && typeof value === 'object') {
      return Object.keys(value).reduce(function (result, key) {
        result[key] = toClientValue(value[key]);
        return result;
      }, {});
    }

    return value;
  }

  function getBootstrapData() {
    return toClientValue({
      dashboard: DashboardService.summary(),
      clients: ClientService.list(),
      projects: ProjectService.list(),
      tasks: TaskService.list(),
      employees: EmployeeService.list(),
      invoices: InvoiceService.list(),
      payments: PaymentService.list(),
      timesheets: TimesheetService.list({})
    });
  }

  function getOperationsData() {
    return toClientValue({
      projects: ProjectService.list(),
      tasks: TaskService.list(),
      employees: EmployeeService.list(),
      timesheets: TimesheetService.list({})
    });
  }

  function getFinanceData() {
    return toClientValue({
      clients: ClientService.list(),
      projects: ProjectService.list(),
      invoices: InvoiceService.list(),
      payments: PaymentService.list(),
      dashboard: DashboardService.summary()
    });
  }

  function getAuditData() {
    var entries = DataStore.list(Constants.SHEETS.AUDIT_LOG);

    entries.sort(function (a, b) {
      return String(b['Timestamp']).localeCompare(String(a['Timestamp']));
    });

    return toClientValue(entries);
  }

  function getProfitabilityData() {
    return toClientValue({
      clients: ClientService.list(),
      projects: ProjectService.list(),
      invoices: InvoiceService.list(),
      expenses: ExpenseService.list()
    });
  }

  function createClient(payload) {
    return toClientValue(ClientService.create(payload));
  }

  function createProject(payload) {
    return toClientValue(ProjectService.create(payload));
  }

  function createTask(payload) {
    return toClientValue(TaskService.create(payload));
  }

  function createEmployee(payload) {
    return toClientValue(EmployeeService.create(payload));
  }

  function createTimesheet(payload) {
    return toClientValue(TimesheetService.create(payload));
  }

  function createInvoice(payload) {
    return toClientValue(InvoiceService.create(payload));
  }

  function createPayment(payload) {
    return toClientValue(PaymentService.create(payload));
  }

  function createExpense(payload) {
    return toClientValue(ExpenseService.create(payload));
  }

  function approveTimesheet(timesheetId) {
    return toClientValue(
      TimesheetService.approve(timesheetId, 'APPROVED')
    );
  }

  return Object.freeze({
    getBootstrapData: getBootstrapData,
    getOperationsData: getOperationsData,
    getFinanceData: getFinanceData,
    getAuditData: getAuditData,
    getProfitabilityData: getProfitabilityData,
    createClient: createClient,
    createProject: createProject,
    createTask: createTask,
    createEmployee: createEmployee,
    createTimesheet: createTimesheet,
    createInvoice: createInvoice,
    createPayment: createPayment,
    createExpense: createExpense,
    approveTimesheet: approveTimesheet
  });
})();

function getUiBootstrapData() {
  return UiService.getBootstrapData();
}

function getUiOperationsData() {
  return UiService.getOperationsData();
}

function getUiFinanceData() {
  return UiService.getFinanceData();
}

function getUiAuditData() {
  return UiService.getAuditData();
}

function getUiProfitabilityData() {
  return UiService.getProfitabilityData();
}

function uiCreateClient(payload) {
  return UiService.createClient(payload);
}

function uiCreateProject(payload) {
  return UiService.createProject(payload);
}

function uiCreateTask(payload) {
  return UiService.createTask(payload);
}

function uiCreateEmployee(payload) {
  return UiService.createEmployee(payload);
}

function uiCreateTimesheet(payload) {
  return UiService.createTimesheet(payload);
}

function uiCreateInvoice(payload) {
  return UiService.createInvoice(payload);
}

function uiCreatePayment(payload) {
  return UiService.createPayment(payload);
}

function uiCreateExpense(payload) {
  return UiService.createExpense(payload);
}

function uiApproveTimesheet(timesheetId) {
  return UiService.approveTimesheet(timesheetId);
}