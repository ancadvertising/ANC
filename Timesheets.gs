var TimesheetService = (function () {
  var APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

  function list(filters) {
    var records = DataStore.list(Constants.SHEETS.TIMESHEETS);
    filters = filters || {};

    return records.filter(function (record) {
      if (
        filters.employeeId &&
        String(record['Employee ID']) !== String(filters.employeeId)
      ) {
        return false;
      }

      if (
        filters.projectId &&
        String(record['Project ID']) !== String(filters.projectId)
      ) {
        return false;
      }

      return true;
    });
  }

  function get(timesheetId) {
    var record = DataStore.findById(
      Constants.SHEETS.TIMESHEETS,
      'Timesheet ID',
      timesheetId
    );

    if (!record) {
      throw new Error('Timesheet entry not found: ' + timesheetId);
    }

    return record;
  }

  function create(payload) {
    Utils.requireFields(payload, [
      'employeeId',
      'projectId',
      'workDate',
      'hours'
    ]);

    EmployeeService.get(payload.employeeId);
    ProjectService.get(payload.projectId);

    var hours = Number(payload.hours);

    if (!isFinite(hours) || hours <= 0 || hours > 24) {
      throw new Error('Hours must be a number greater than 0 and no more than 24.');
    }

    if (payload.taskId) {
      var task = TaskService.get(payload.taskId);

      if (String(task['Project ID']) !== String(payload.projectId)) {
        throw new Error('Task does not belong to the selected project.');
      }
    }

    var timestamp = Utils.nowIso();

    var timesheet = DataStore.create(Constants.SHEETS.TIMESHEETS, {
      'Timesheet ID': Utils.newId('TIM'),
      'Employee ID': payload.employeeId,
      'Project ID': payload.projectId,
      'Task ID': payload.taskId || '',
      'Work Date': payload.workDate,
      'Hours': hours,
      'Description': payload.description || '',
      'Approval Status': 'PENDING',
      'Created At': timestamp,
      'Updated At': timestamp
    });

    Logger.audit(
      'TIMESHEET_CREATED',
      'TIMESHEET',
      timesheet['Timesheet ID'],
      timesheet
    );

    return timesheet;
  }

  function update(timesheetId, payload) {
    var current = get(timesheetId);

    if (String(current['Approval Status']) !== 'PENDING') {
      throw new Error('Only pending timesheet entries can be edited.');
    }

    var changes = {
      'Updated At': Utils.nowIso()
    };

    if (payload.workDate !== undefined) changes['Work Date'] = payload.workDate;
    if (payload.description !== undefined) changes['Description'] = payload.description;

    if (payload.hours !== undefined) {
      var hours = Number(payload.hours);

      if (!isFinite(hours) || hours <= 0 || hours > 24) {
        throw new Error('Hours must be a number greater than 0 and no more than 24.');
      }

      changes['Hours'] = hours;
    }

    var updated = DataStore.updateById(
      Constants.SHEETS.TIMESHEETS,
      'Timesheet ID',
      timesheetId,
      changes
    );

    Logger.audit('TIMESHEET_UPDATED', 'TIMESHEET', timesheetId, changes);
    return updated;
  }

  function approve(timesheetId, status) {
    var approvalStatus = Utils.normalizeEnum(
      status,
      APPROVAL_STATUSES,
      'Approval status'
    );

    var updated = DataStore.updateById(
      Constants.SHEETS.TIMESHEETS,
      'Timesheet ID',
      timesheetId,
      {
        'Approval Status': approvalStatus,
        'Updated At': Utils.nowIso()
      }
    );

    if (!updated) {
      throw new Error('Timesheet entry not found: ' + timesheetId);
    }

    Logger.audit(
      'TIMESHEET_STATUS_UPDATED',
      'TIMESHEET',
      timesheetId,
      { approvalStatus: approvalStatus }
    );

    return updated;
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create,
    update: update,
    approve: approve
  });
})();