var TaskService = (function () {
  function list(projectId) {
    var tasks = DataStore.list(Constants.SHEETS.TASKS);

    if (!projectId) return tasks;

    return tasks.filter(function (task) {
      return String(task['Project ID']) === String(projectId);
    });
  }

  function get(taskId) {
    var task = DataStore.findById(
      Constants.SHEETS.TASKS,
      'Task ID',
      taskId
    );

    if (!task) {
      throw new Error('Task not found: ' + taskId);
    }

    return task;
  }

  function create(payload) {
    Utils.requireFields(payload, ['projectId', 'taskName']);

    ProjectService.get(payload.projectId);

    var timestamp = Utils.nowIso();

    var status = payload.status
      ? Utils.normalizeEnum(payload.status, Constants.TASK_STATUSES, 'Task status')
      : 'TODO';

    var priority = payload.priority
      ? Utils.normalizeEnum(payload.priority, Constants.PRIORITIES, 'Task priority')
      : 'MEDIUM';

    var task = DataStore.create(Constants.SHEETS.TASKS, {
      'Task ID': Utils.newId('TSK'),
      'Project ID': payload.projectId,
      'Task Name': payload.taskName.trim(),
      'Status': status,
      'Priority': priority,
      'Assignee': payload.assignee || '',
      'Estimated Hours': Number(payload.estimatedHours || 0),
      'Due Date': payload.dueDate || '',
      'Created At': timestamp,
      'Updated At': timestamp
    });

    Logger.audit('TASK_CREATED', 'TASK', task['Task ID'], task);
    return task;
  }

  function update(taskId, payload) {
    get(taskId);

    var changes = {
      'Updated At': Utils.nowIso()
    };

    if (payload.taskName !== undefined) changes['Task Name'] = payload.taskName;
    if (payload.assignee !== undefined) changes['Assignee'] = payload.assignee;
    if (payload.estimatedHours !== undefined) {
      changes['Estimated Hours'] = Number(payload.estimatedHours);
    }
    if (payload.dueDate !== undefined) changes['Due Date'] = payload.dueDate;

    if (payload.status !== undefined) {
      changes['Status'] = Utils.normalizeEnum(
        payload.status,
        Constants.TASK_STATUSES,
        'Task status'
      );
    }

    if (payload.priority !== undefined) {
      changes['Priority'] = Utils.normalizeEnum(
        payload.priority,
        Constants.PRIORITIES,
        'Task priority'
      );
    }

    var task = DataStore.updateById(
      Constants.SHEETS.TASKS,
      'Task ID',
      taskId,
      changes
    );

    Logger.audit('TASK_UPDATED', 'TASK', taskId, changes);
    return task;
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create,
    update: update
  });
})();