var Router = (function () {
  function parseRequest(event, method) {
    var query = (event && event.parameter) || {};
    var body = {};

    if (event && event.postData && event.postData.contents) {
      body = Utils.safeJsonParse(event.postData.contents, null);

      if (body === null) {
        throw new Error('Request body must contain valid JSON.');
      }
    }

    return {
      method: method,
      route: String(
        query.route || query.action || body.route || Constants.ROUTES.HEALTH
      ).trim().toLowerCase(),
      query: query,
      body: body
    };
  }

  function readOrCreate(request, service, listArgument) {
    if (request.method === 'GET') {
      return Response.success(
        request.query.id
          ? service.get(request.query.id)
          : service.list(listArgument)
      );
    }

    return Response.success(service.create(request.body));
  }

  function handle(event, method) {
    try {
      var request = parseRequest(event, method);

      Security.assertApiAccess(request.route, method);

      switch (request.route) {
        case 'health':
          return Response.success({
            status: 'healthy',
            application: Constants.APP.NAME,
            version: Constants.APP.VERSION
          });

        case 'bootstrap':
          return Config.initialize();

        case 'config':
          return Response.success(Config.snapshot());

        case 'meta':
          return Response.success({
            roles: Constants.ROLES,
            priorities: Constants.PRIORITIES,
            sheets: Template.getDefinitions()
          });

        case 'dashboard':
          return Response.success(DashboardService.summary());

        case 'clients':
          if (method === 'POST' && request.body.id) {
            return Response.success(
              ClientService.update(request.body.id, request.body)
            );
          }
          return readOrCreate(request, ClientService);

        case 'projects':
          if (method === 'POST' && request.body.id) {
            return Response.success(
              ProjectService.update(request.body.id, request.body)
            );
          }
          return readOrCreate(request, ProjectService);

        case 'tasks':
          if (method === 'POST' && request.body.id) {
            return Response.success(
              TaskService.update(request.body.id, request.body)
            );
          }
          return readOrCreate(request, TaskService, request.query.projectId);

        case 'employees':
          if (method === 'POST' && request.body.id) {
            return Response.success(
              EmployeeService.update(request.body.id, request.body)
            );
          }
          return readOrCreate(request, EmployeeService);

        case 'timesheets':
          if (method === 'POST' && request.body.approvalStatus) {
            return Response.success(
              TimesheetService.approve(
                request.body.id,
                request.body.approvalStatus
              )
            );
          }
          if (method === 'POST' && request.body.id) {
            return Response.success(
              TimesheetService.update(request.body.id, request.body)
            );
          }
          return readOrCreate(request, TimesheetService, request.query);

        case 'invoices':
          if (method === 'POST' && request.body.id && request.body.status) {
            return Response.success(
              InvoiceService.updateStatus(
                request.body.id,
                request.body.status
              )
            );
          }
          return readOrCreate(request, InvoiceService, request.query.clientId);

        case 'payments':
          return readOrCreate(request, PaymentService, request.query.invoiceId);

        case 'expenses':
          return readOrCreate(request, ExpenseService, request.query.projectId);

        default:
          return Response.error(
            'NOT_FOUND',
            'Unknown route: ' + request.route
          );
      }
    } catch (exception) {
      return Response.fromException(exception);
    }
  }

  return Object.freeze({
    handle: handle
  });
})();