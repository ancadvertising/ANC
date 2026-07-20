var EmployeeService = (function () {
  function list() {
    return DataStore.list(Constants.SHEETS.EMPLOYEES);
  }

  function get(employeeId) {
    var employee = DataStore.findById(
      Constants.SHEETS.EMPLOYEES,
      'Employee ID',
      employeeId
    );

    if (!employee) {
      throw new Error('Employee not found: ' + employeeId);
    }

    return employee;
  }

  function create(payload) {
    Utils.requireFields(payload, ['fullName', 'email', 'role']);

    var role = Utils.normalizeEnum(
      payload.role,
      Constants.ROLES,
      'Employee role'
    );

    var timestamp = Utils.nowIso();

    var employee = DataStore.create(Constants.SHEETS.EMPLOYEES, {
      'Employee ID': Utils.newId('EMP'),
      'Full Name': payload.fullName.trim(),
      'Email': payload.email.trim().toLowerCase(),
      'Role': role,
      'Department': payload.department || '',
      'Active': payload.active === false ? false : true,
      'Start Date': payload.startDate || '',
      'Created At': timestamp,
      'Updated At': timestamp
    });

    Logger.audit('EMPLOYEE_CREATED', 'EMPLOYEE', employee['Employee ID'], employee);
    return employee;
  }

  function update(employeeId, payload) {
    get(employeeId);

    var changes = {
      'Updated At': Utils.nowIso()
    };

    if (payload.fullName !== undefined) changes['Full Name'] = payload.fullName;
    if (payload.email !== undefined) changes['Email'] = payload.email.toLowerCase();
    if (payload.department !== undefined) changes['Department'] = payload.department;
    if (payload.active !== undefined) changes['Active'] = Boolean(payload.active);
    if (payload.startDate !== undefined) changes['Start Date'] = payload.startDate;

    if (payload.role !== undefined) {
      changes['Role'] = Utils.normalizeEnum(
        payload.role,
        Constants.ROLES,
        'Employee role'
      );
    }

    var employee = DataStore.updateById(
      Constants.SHEETS.EMPLOYEES,
      'Employee ID',
      employeeId,
      changes
    );

    Logger.audit('EMPLOYEE_UPDATED', 'EMPLOYEE', employeeId, changes);
    return employee;
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create,
    update: update
  });
})();
