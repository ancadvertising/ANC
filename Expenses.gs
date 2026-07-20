var ExpenseService = (function () {
  function list(projectId) {
    var expenses = DataStore.list(Constants.SHEETS.EXPENSES);

    if (!projectId) return expenses;

    return expenses.filter(function (expense) {
      return String(expense['Project ID']) === String(projectId);
    });
  }

  function get(expenseId) {
    var expense = DataStore.findById(
      Constants.SHEETS.EXPENSES,
      'Expense ID',
      expenseId
    );

    if (!expense) {
      throw new Error('Expense not found: ' + expenseId);
    }

    return expense;
  }

  function create(payload) {
    Utils.requireFields(payload, [
      'expenseDate',
      'category',
      'description',
      'amount'
    ]);

    var amount = Number(payload.amount);

    if (!isFinite(amount) || amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    var clientId = payload.clientId || '';
    var projectId = payload.projectId || '';

    if (clientId) {
      ClientService.get(clientId);
    }

    if (projectId) {
      var project = ProjectService.get(projectId);

      if (!clientId) {
        clientId = project['Client ID'];
      }

      if (String(project['Client ID']) !== String(clientId)) {
        throw new Error('Project does not belong to the selected client.');
      }
    }

    var expense = DataStore.create(Constants.SHEETS.EXPENSES, {
      'Expense ID': Utils.newId('EXP'),
      'Expense Date': payload.expenseDate,
      'Category': payload.category.trim(),
      'Description': payload.description.trim(),
      'Client ID': clientId,
      'Project ID': projectId,
      'Amount': amount,
      'Currency': payload.currency || 'EGP',
      'Vendor': payload.vendor || '',
      'Payment Method': payload.paymentMethod || '',
      'Created By': Utils.actorEmail(),
      'Created At': Utils.nowIso()
    });

    Logger.audit(
      'EXPENSE_CREATED',
      'EXPENSE',
      expense['Expense ID'],
      expense
    );

    return expense;
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create
  });
})();