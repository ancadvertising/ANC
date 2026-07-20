var InvoiceService = (function () {
  var STATUSES = [
    'DRAFT',
    'ISSUED',
    'PARTIALLY_PAID',
    'PAID',
    'CANCELLED'
  ];

  function list(clientId) {
    var invoices = DataStore.list(Constants.SHEETS.INVOICES);

    return clientId
      ? invoices.filter(function (invoice) {
          return String(invoice['Client ID']) === String(clientId);
        })
      : invoices;
  }

  function get(invoiceId) {
    var invoice = DataStore.findById(
      Constants.SHEETS.INVOICES,
      'Invoice ID',
      invoiceId
    );

    if (!invoice) throw new Error('Invoice not found: ' + invoiceId);
    return invoice;
  }

  function nextInvoiceNumber() {
    var year = Utilities.formatDate(
      new Date(),
      Constants.APP.TIME_ZONE,
      'yyyy'
    );

    var count = DataStore.list(Constants.SHEETS.INVOICES)
      .filter(function (invoice) {
        return String(invoice['Invoice Number']).indexOf('INV-' + year + '-') === 0;
      })
      .length + 1;

    return 'INV-' + year + '-' + ('0000' + count).slice(-4);
  }

  function create(payload) {
    Utils.requireFields(payload, [
      'clientId',
      'projectId',
      'issueDate',
      'dueDate',
      'amount'
    ]);

    var client = ClientService.get(payload.clientId);
    var project = ProjectService.get(payload.projectId);

    if (String(project['Client ID']) !== String(client['Client ID'])) {
      throw new Error('Project does not belong to the selected client.');
    }

    var amount = Number(payload.amount);
    var taxAmount = Number(payload.taxAmount || 0);

    if (!isFinite(amount) || amount <= 0) {
      throw new Error('Invoice amount must be greater than zero.');
    }

    if (!isFinite(taxAmount) || taxAmount < 0) {
      throw new Error('Tax amount cannot be negative.');
    }

    var status = payload.status
      ? Utils.normalizeEnum(payload.status, STATUSES, 'Invoice status')
      : 'DRAFT';

    var timestamp = Utils.nowIso();

    var invoice = DataStore.create(Constants.SHEETS.INVOICES, {
      'Invoice ID': Utils.newId('INV'),
      'Client ID': payload.clientId,
      'Project ID': payload.projectId,
      'Invoice Number': nextInvoiceNumber(),
      'Issue Date': payload.issueDate,
      'Due Date': payload.dueDate,
      'Amount': amount,
      'Tax Amount': taxAmount,
      'Currency': payload.currency || 'EGP',
      'Status': status,
      'Created At': timestamp,
      'Updated At': timestamp
    });

    Logger.audit('INVOICE_CREATED', 'INVOICE', invoice['Invoice ID'], invoice);
    return invoice;
  }

  function updateStatus(invoiceId, status) {
    var invoice = get(invoiceId);

    if (String(invoice['Status']) === 'CANCELLED') {
      throw new Error('A cancelled invoice cannot be updated.');
    }

    var normalized = Utils.normalizeEnum(
      status,
      STATUSES,
      'Invoice status'
    );

    var updated = DataStore.updateById(
      Constants.SHEETS.INVOICES,
      'Invoice ID',
      invoiceId,
      {
        'Status': normalized,
        'Updated At': Utils.nowIso()
      }
    );

    Logger.audit('INVOICE_STATUS_UPDATED', 'INVOICE', invoiceId, {
      status: normalized
    });

    return updated;
  }

  function totalWithTax(invoice) {
    return Number(invoice['Amount']) + Number(invoice['Tax Amount']);
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create,
    updateStatus: updateStatus,
    totalWithTax: totalWithTax
  });
})();

var PaymentService = (function () {
  function list(invoiceId) {
    var payments = DataStore.list(Constants.SHEETS.PAYMENTS);

    return invoiceId
      ? payments.filter(function (payment) {
          return String(payment['Invoice ID']) === String(invoiceId);
        })
      : payments;
  }

  function totalPaid(invoiceId) {
    return list(invoiceId).reduce(function (total, payment) {
      return total + Number(payment['Amount'] || 0);
    }, 0);
  }

  function create(payload) {
    Utils.requireFields(payload, [
      'invoiceId',
      'paymentDate',
      'amount',
      'method'
    ]);

    var invoice = InvoiceService.get(payload.invoiceId);

    if (String(invoice['Status']) === 'CANCELLED') {
      throw new Error('Payments cannot be added to a cancelled invoice.');
    }

    var amount = Number(payload.amount);

    if (!isFinite(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    var totalInvoice = InvoiceService.totalWithTax(invoice);
    var paidBefore = totalPaid(payload.invoiceId);

    if (paidBefore + amount > totalInvoice) {
      throw new Error('Payment amount exceeds the outstanding invoice balance.');
    }

    var timestamp = Utils.nowIso();

    var payment = DataStore.create(Constants.SHEETS.PAYMENTS, {
      'Payment ID': Utils.newId('PAY'),
      'Invoice ID': payload.invoiceId,
      'Client ID': invoice['Client ID'],
      'Payment Date': payload.paymentDate,
      'Amount': amount,
      'Currency': payload.currency || invoice['Currency'],
      'Method': payload.method.trim(),
      'Reference': payload.reference || '',
      'Created At': timestamp
    });

    var paidAfter = paidBefore + amount;
    var status = paidAfter >= totalInvoice ? 'PAID' : 'PARTIALLY_PAID';

    InvoiceService.updateStatus(payload.invoiceId, status);

    Logger.audit('PAYMENT_CREATED', 'PAYMENT', payment['Payment ID'], {
      payment: payment,
      invoiceStatus: status,
      paidAmount: paidAfter,
      invoiceTotal: totalInvoice
    });

    return {
      payment: payment,
      invoiceStatus: status,
      paidAmount: paidAfter,
      outstandingBalance: totalInvoice - paidAfter
    };
  }

  return Object.freeze({
    list: list,
    totalPaid: totalPaid,
    create: create
  });
})();