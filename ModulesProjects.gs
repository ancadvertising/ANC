var ProjectService = (function () {
  function list() {
    return DataStore.list(Constants.SHEETS.PROJECTS);
  }

  function get(projectId) {
    var project = DataStore.findById(
      Constants.SHEETS.PROJECTS,
      'Project ID',
      projectId
    );

    if (!project) {
      throw new Error('Project not found: ' + projectId);
    }

    return project;
  }

  function create(payload) {
    Utils.requireFields(payload, ['clientId', 'projectName']);

    ClientService.get(payload.clientId);

    var timestamp = Utils.nowIso();
    var status = payload.status
      ? Utils.normalizeEnum(payload.status, Constants.PROJECT_STATUSES, 'Project status')
      : 'DRAFT';

    var priority = payload.priority
      ? Utils.normalizeEnum(payload.priority, Constants.PRIORITIES, 'Project priority')
      : 'MEDIUM';

    var project = DataStore.create(Constants.SHEETS.PROJECTS, {
      'Project ID': Utils.newId('PRJ'),
      'Client ID': payload.clientId,
      'Project Name': payload.projectName.trim(),
      'Status': status,
      'Priority': priority,
      'Account Manager': payload.accountManager || '',
      'Start Date': payload.startDate || '',
      'Due Date': payload.dueDate || '',
      'Budget': Number(payload.budget || 0),
      'Currency': payload.currency || 'EGP',
      'Created At': timestamp,
      'Updated At': timestamp
    });

    Logger.audit('PROJECT_CREATED', 'PROJECT', project['Project ID'], project);
    return project;
  }

  function update(projectId, payload) {
    get(projectId);

    var changes = {
      'Updated At': Utils.nowIso()
    };

    if (payload.projectName !== undefined) changes['Project Name'] = payload.projectName;
    if (payload.accountManager !== undefined) changes['Account Manager'] = payload.accountManager;
    if (payload.startDate !== undefined) changes['Start Date'] = payload.startDate;
    if (payload.dueDate !== undefined) changes['Due Date'] = payload.dueDate;
    if (payload.budget !== undefined) changes['Budget'] = Number(payload.budget);
    if (payload.currency !== undefined) changes['Currency'] = payload.currency;

    if (payload.status !== undefined) {
      changes['Status'] = Utils.normalizeEnum(
        payload.status,
        Constants.PROJECT_STATUSES,
        'Project status'
      );
    }

    if (payload.priority !== undefined) {
      changes['Priority'] = Utils.normalizeEnum(
        payload.priority,
        Constants.PRIORITIES,
        'Project priority'
      );
    }

    var project = DataStore.updateById(
      Constants.SHEETS.PROJECTS,
      'Project ID',
      projectId,
      changes
    );

    Logger.audit('PROJECT_UPDATED', 'PROJECT', projectId, changes);
    return project;
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create,
    update: update
  });
})();