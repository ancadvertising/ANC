function getUiStatusData() {
  return {
    projects: ProjectService.list().map(function (project) {
      return {
        id: project['Project ID'],
        name: project['Project Name'],
        status: project['Status']
      };
    }),

    tasks: TaskService.list().map(function (task) {
      return {
        id: task['Task ID'],
        name: task['Task Name'],
        status: task['Status']
      };
    }),

    invoices: InvoiceService.list().map(function (invoice) {
      return {
        id: invoice['Invoice ID'],
        name: invoice['Invoice Number'],
        status: invoice['Status']
      };
    })
  };
}

function uiUpdateEntityStatus(payload) {
  if (!payload || !payload.type || !payload.id || !payload.status) {
    throw new Error('Type, ID, and status are required.');
  }

  switch (payload.type) {
    case 'PROJECT':
      return ProjectService.update(payload.id, {
        status: payload.status
      });

    case 'TASK':
      return TaskService.update(payload.id, {
        status: payload.status
      });

    case 'INVOICE':
      return InvoiceService.updateStatus(
        payload.id,
        payload.status
      );

    default:
      throw new Error('Unsupported entity type: ' + payload.type);
  }
}