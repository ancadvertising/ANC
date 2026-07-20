var PortalService = (function() {
  function text_(value) {
    return String(value || '').trim();
  }

  function rows_(sheetName) {
    var sheet = Config.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() < 2) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function(header) {
      return text_(header);
    });

    return values.slice(1).map(function(row) {
      var item = {};

      headers.forEach(function(header, index) {
        item[header] = row[index];
      });

      return item;
    });
  }

  function currentEmployee_() {
    var identity = GoogleIdentity.resolve();

    if (identity.userType !== 'EMPLOYEE' && identity.userType !== 'ADMIN') {
      throw new Error('هذه الصفحة مخصصة للموظفين فقط.');
    }

    var employee = rows_('Employees').filter(function(item) {
      return text_(item.Email).toLowerCase() === identity.email;
    })[0] || {};

    return {
      identity: identity,
      employeeId: text_(employee['Employee ID']) || identity.employeeId,
      fullName: text_(employee['Full Name']) || identity.fullName,
      email: identity.email,
      role: text_(employee.Role) || identity.role
    };
  }

  function employeeDashboard() {
    var employee = currentEmployee_();
    var tasks = rows_('Tasks').filter(function(task) {
      var assigned = [
        task['Employee ID'], task['Assigned To'],
        task.Assignee, task['Assigned Email']
      ].map(text_);

      return assigned.indexOf(employee.employeeId) !== -1 ||
        assigned.indexOf(employee.email) !== -1 ||
        assigned.indexOf(employee.fullName) !== -1;
    }).map(function(task) {
      return {
        taskId: task['Task ID'],
        taskName: task['Task Name'] || task.Title,
        status: task.Status,
        priority: task.Priority,
        dueDate: task['Due Date'],
        description: task.Description || task.Brief
      };
    });

    var studioJobs = rows_('Studio Jobs').filter(function(job) {
      return text_(job['Employee ID']) === employee.employeeId ||
        text_(job['Assigned To']) === employee.email;
    });

    var updates = rows_('Task Work Updates').filter(function(update) {
      return text_(update['Employee ID']) === employee.employeeId;
    });

    return {
      profile: employee,
      tasks: tasks,
      studioJobs: studioJobs,
      updates: updates,
      summary: {
        tasksCount: tasks.length,
        activeTasksCount: tasks.filter(function(task) {
          return text_(task.status).toUpperCase() !== 'DONE';
        }).length,
        studioJobsCount: studioJobs.length
      }
    };
  }

  function addEmployeeUpdate(data) {
    var employee = currentEmployee_();
    data = data || {};

    var taskId = text_(data.taskId);

    if (!taskId) {
      throw new Error('اختر المهمة أولًا.');
    }

    var assigned = employeeDashboard().tasks.some(function(task) {
      return text_(task.taskId) === taskId;
    });

    if (!assigned) {
      throw new Error('لا يمكنك إضافة تحديث لمهمة غير مسندة إليك.');
    }

    var sheet = Config.getSpreadsheet().getSheetByName('Task Work Updates');

    if (!sheet) {
      sheet = Config.getSpreadsheet().insertSheet('Task Work Updates');
      sheet.appendRow([
        'Update ID', 'Task ID', 'Employee ID', 'Progress Percent',
        'Progress Details', 'Delivery URL', 'Created At'
      ]);
    }

    sheet.appendRow([
      'UPD-' + Utilities.getUuid(),
      taskId,
      employee.employeeId,
      Number(data.progressPercent || 0),
      text_(data.progressDetails),
      text_(data.deliveryUrl),
      new Date().toISOString()
    ]);

    return { ok: true };
  }

  return Object.freeze({
    employeeDashboard: employeeDashboard,
    addEmployeeUpdate: addEmployeeUpdate
  });
})();

function portalGetEmployeeDashboard() {
  return PortalService.employeeDashboard();
}

function portalAddEmployeeUpdate(data) {
  return PortalService.addEmployeeUpdate(data);
}