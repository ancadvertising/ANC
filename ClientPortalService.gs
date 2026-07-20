var ClientPortalService = (function () {
  function text_(value) { return String(value || '').trim(); }
  function number_(value) { var result = Number(value); return isNaN(result) ? 0 : result; }
  function rows_(sheetName) {
    var sheet = Config.getSpreadsheet().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return [];
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(text_);
    return values.slice(1).filter(function(row) {
      return row.some(function(value) { return value !== '' && value !== null; });
    }).map(function(row) {
      var item = {};
      headers.forEach(function(header, index) { item[header] = row[index]; });
      return item;
    });
  }

  function currentClient_() {
    var identity = GoogleIdentity.resolve();
    if (identity.userType !== 'CLIENT') throw new Error('بوابة العميل متاحة للعملاء فقط.');
    if (!identity.clientId) throw new Error('الحساب غير مربوط بملف عميل.');
    var client = rows_('Clients').filter(function(item) {
      return text_(item['Client ID']) === identity.clientId;
    })[0];
    if (!client) throw new Error('ملف العميل غير موجود.');
    return { identity: identity, client: client };
  }

  function dashboard() {
    var current = currentClient_();
    var clientId = current.identity.clientId;
    var projects = rows_('Projects').filter(function(item) { return text_(item['Client ID']) === clientId; }).map(function(item) {
      return { projectName: item['Project Name'] || item.Name || '', status: item.Status || '', dueDate: item['Due Date'] || '' };
    });
    var invoices = rows_('Invoices').filter(function(item) { return text_(item['Client ID']) === clientId; }).map(function(item) {
      return { invoiceNumber: item['Invoice Number'] || item['Invoice ID'] || '', amount: number_(item['Total Amount'] || item.Amount || item.Total), status: item.Status || '', currency: item.Currency || 'EGP', invoiceId: item['Invoice ID'] || '' };
    });
    var invoiceIds = invoices.map(function(item) { return item.invoiceId; });
    var payments = rows_('Payments').filter(function(item) { return invoiceIds.indexOf(text_(item['Invoice ID'])) !== -1 || text_(item['Client ID']) === clientId; }).map(function(item) {
      return { paymentDate: item['Payment Date'] || item.Date || '', amount: number_(item.Amount || item['Payment Amount']), method: item['Payment Method'] || item.Method || '', currency: item.Currency || 'EGP' };
    });
    var adCharges = rows_('Client Statements').filter(function(item) { return text_(item['Client ID']) === clientId; }).map(function(item) {
      return { description: item.Description || item['Reference Type'] || 'إعلان ممول', amount: number_(item.Amount || item.Debit), status: item.Status || 'ACTIVE', currency: item.Currency || 'EGP' };
    });
    var invoicesTotal = invoices.reduce(function(total, item) { return total + item.amount; }, 0);
    var paymentsTotal = payments.reduce(function(total, item) { return total + item.amount; }, 0);
    var adTotal = adCharges.reduce(function(total, item) { return total + item.amount; }, 0);
    return {
      profile: { fullName: current.identity.fullName, clientName: current.client['Client Name'] || current.identity.fullName },
      projects: projects,
      invoices: invoices,
      payments: payments,
      adCharges: adCharges,
      summary: { projectsCount: projects.length, invoicesTotal: invoicesTotal + adTotal, paymentsTotal: paymentsTotal, outstanding: Math.max(0, invoicesTotal + adTotal - paymentsTotal), currency: 'EGP' }
    };
  }
  return Object.freeze({ dashboard: dashboard });
})();
function portalGetClientDashboard() { return ClientPortalService.dashboard(); }
