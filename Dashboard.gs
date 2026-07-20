var DashboardService = (function () {
  function number(value) {
    return Number(value || 0);
  }

  function dateKey(value) {
    if (!value) return '';

    var date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) return '';

    return Utilities.formatDate(
      date,
      Constants.APP.TIME_ZONE,
      'yyyy-MM'
    );
  }

  function recentMonths(count) {
    var result = [];
    var now = new Date();

    for (var i = count - 1; i >= 0; i -= 1) {
      var date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      result.push({
        key: Utilities.formatDate(date, Constants.APP.TIME_ZONE, 'yyyy-MM'),
        label: Utilities.formatDate(date, Constants.APP.TIME_ZONE, 'MMM')
      });
    }

    return result;
  }

  function countBy(records, fieldName) {
    return records.reduce(function (result, record) {
      var key = String(record[fieldName] || 'UNKNOWN');

      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }

  function summary() {
    var clients = DataStore.list(Constants.SHEETS.CLIENTS);
    var projects = DataStore.list(Constants.SHEETS.PROJECTS);
    var tasks = DataStore.list(Constants.SHEETS.TASKS);
    var employees = DataStore.list(Constants.SHEETS.EMPLOYEES);
    var timesheets = DataStore.list(Constants.SHEETS.TIMESHEETS);
    var invoices = DataStore.list(Constants.SHEETS.INVOICES);
    var payments = DataStore.list(Constants.SHEETS.PAYMENTS);
    var expenses = DataStore.list(Constants.SHEETS.EXPENSES);

    var validInvoices = invoices.filter(function (invoice) {
      return String(invoice['Status']) !== 'CANCELLED';
    });

    var revenue = validInvoices.reduce(function (total, invoice) {
      return total + number(invoice['Amount']);
    }, 0);

    var taxes = validInvoices.reduce(function (total, invoice) {
      return total + number(invoice['Tax Amount']);
    }, 0);

    var invoiceTotal = revenue + taxes;

    var paid = payments.reduce(function (total, payment) {
      return total + number(payment['Amount']);
    }, 0);

    var totalExpenses = expenses.reduce(function (total, expense) {
      return total + number(expense['Amount']);
    }, 0);

    var netProfit = revenue - totalExpenses;
    var profitMargin = revenue ? netProfit / revenue * 100 : 0;
    var collectionRate = invoiceTotal ? paid / invoiceTotal * 100 : 0;

    var approvedHours = timesheets
      .filter(function (record) {
        return String(record['Approval Status']) === 'APPROVED';
      })
      .reduce(function (total, record) {
        return total + number(record['Hours']);
      }, 0);

    var pendingHours = timesheets
      .filter(function (record) {
        return String(record['Approval Status']) === 'PENDING';
      })
      .reduce(function (total, record) {
        return total + number(record['Hours']);
      }, 0);

    var doneTasks = tasks.filter(function (task) {
      return String(task['Status']) === 'DONE';
    }).length;

    var activeEmployees = employees.filter(function (employee) {
      return String(employee['Active']).toLowerCase() !== 'false';
    }).length;

    var months = recentMonths(6);

    var monthly = months.map(function (month) {
      var monthRevenue = validInvoices
        .filter(function (invoice) {
          return dateKey(invoice['Issue Date']) === month.key;
        })
        .reduce(function (total, invoice) {
          return total + number(invoice['Amount']);
        }, 0);

      var monthExpenses = expenses
        .filter(function (expense) {
          return dateKey(expense['Expense Date']) === month.key;
        })
        .reduce(function (total, expense) {
          return total + number(expense['Amount']);
        }, 0);

      var monthPayments = payments
        .filter(function (payment) {
          return dateKey(payment['Payment Date']) === month.key;
        })
        .reduce(function (total, payment) {
          return total + number(payment['Amount']);
        }, 0);

      return {
        label: month.label,
        revenue: monthRevenue,
        expenses: monthExpenses,
        payments: monthPayments,
        profit: monthRevenue - monthExpenses
      };
    });

    return {
      generatedAt: Utils.nowIso(),

      kpis: {
        revenue: revenue,
        tax: taxes,
        invoiceTotal: invoiceTotal,
        paid: paid,
        outstanding: invoiceTotal - paid,
        expenses: totalExpenses,
        netProfit: netProfit,
        profitMargin: profitMargin,
        collectionRate: collectionRate,
        activeClients: clients.filter(function (client) {
          return String(client['Status']) === 'ACTIVE';
        }).length,
        activeProjects: projects.filter(function (project) {
          return String(project['Status']) === 'ACTIVE';
        }).length,
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: doneTasks,
        taskCompletionRate: tasks.length ? doneTasks / tasks.length * 100 : 0,
        activeEmployees: activeEmployees,
        approvedHours: approvedHours,
        pendingHours: pendingHours
      },

      projectStatuses: countBy(projects, 'Status'),
      taskStatuses: countBy(tasks, 'Status'),
      invoiceStatuses: countBy(invoices, 'Status'),
      monthly: monthly
    };
  }

  return Object.freeze({
    summary: summary
  });
})();