var InvoicePdfService = (function () {
  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value, currency) {
    return Number(value || 0).toFixed(2) + ' ' + (currency || 'EGP');
  }

  function createPdfFile(invoiceId) {
    var invoice = InvoiceService.get(invoiceId);
    var client = ClientService.get(invoice['Client ID']);
    var project = ProjectService.get(invoice['Project ID']);
    var payments = PaymentService.list(invoiceId);

    var total = Number(invoice['Amount']) +
      Number(invoice['Tax Amount']);

    var paid = payments.reduce(function (sum, payment) {
      return sum + Number(payment['Amount'] || 0);
    }, 0);

    var balance = total - paid;
    var currency = invoice['Currency'] || 'EGP';

    var paymentRows = payments.length
      ? payments.map(function (payment) {
        return '<tr>' +
          '<td>' + escapeHtml(payment['Payment Date']) + '</td>' +
          '<td>' + escapeHtml(payment['Method']) + '</td>' +
          '<td>' + escapeHtml(payment['Reference']) + '</td>' +
          '<td>' + money(payment['Amount'], currency) + '</td>' +
          '</tr>';
      }).join('')
      : '<tr><td colspan="4">لا توجد مدفوعات مسجلة.</td></tr>';

    var html =
      '<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">' +
      '<style>' +
      'body{font-family:Arial,Tahoma,sans-serif;color:#1f2937;padding:35px;}' +
      'h1{color:#173f67;margin:0 0 5px;}h2{color:#173f67;margin-top:30px;}' +
      '.header{display:flex;justify-content:space-between;border-bottom:2px solid #173f67;padding-bottom:18px;}' +
      '.muted{color:#64748b;}table{width:100%;border-collapse:collapse;margin-top:12px;}' +
      'th,td{border:1px solid #d1d5db;padding:9px;text-align:right;}' +
      'th{background:#173f67;color:#fff;}.total{font-size:16px;font-weight:bold;}' +
      '</style></head><body>' +
      '<div class="header">' +
      '<div><h1>ANC Advertising</h1><div class="muted">Marketing Agency ERP</div></div>' +
      '<div><strong>فاتورة: ' + escapeHtml(invoice['Invoice Number']) + '</strong><br>' +
      'الحالة: ' + escapeHtml(invoice['Status']) + '</div></div>' +
      '<h2>بيانات العميل</h2>' +
      '<table><tr><th>العميل</th><td>' + escapeHtml(client['Client Name']) + '</td></tr>' +
      '<tr><th>مسؤول التواصل</th><td>' + escapeHtml(client['Primary Contact']) + '</td></tr>' +
      '<tr><th>البريد</th><td>' + escapeHtml(client['Email']) + '</td></tr>' +
      '<tr><th>المشروع</th><td>' + escapeHtml(project['Project Name']) + '</td></tr></table>' +
      '<h2>تفاصيل الفاتورة</h2>' +
      '<table><tr><th>تاريخ الإصدار</th><td>' + escapeHtml(invoice['Issue Date']) + '</td></tr>' +
      '<tr><th>تاريخ الاستحقاق</th><td>' + escapeHtml(invoice['Due Date']) + '</td></tr>' +
      '<tr><th>القيمة قبل الضريبة</th><td>' + money(invoice['Amount'], currency) + '</td></tr>' +
      '<tr><th>الضريبة</th><td>' + money(invoice['Tax Amount'], currency) + '</td></tr>' +
      '<tr class="total"><th>الإجمالي</th><td>' + money(total, currency) + '</td></tr>' +
      '<tr><th>المدفوع</th><td>' + money(paid, currency) + '</td></tr>' +
      '<tr class="total"><th>الرصيد المتبقي</th><td>' + money(balance, currency) + '</td></tr></table>' +
      '<h2>المدفوعات</h2>' +
      '<table><tr><th>التاريخ</th><th>الطريقة</th><th>المرجع</th><th>المبلغ</th></tr>' +
      paymentRows +
      '</table><p class="muted">تم إنشاء هذا المستند بواسطة ANC Marketing Agency ERP.</p>' +
      '</body></html>';

    var pdfBlob = HtmlService
      .createHtmlOutput(html)
      .getBlob()
      .getAs(MimeType.PDF)
      .setName(invoice['Invoice Number'] + '.pdf');

    var file = DriveApp.createFile(pdfBlob);

    return {
      invoice: invoice,
      client: client,
      file: file
    };
  }

  function generate(invoiceId) {
    var result = createPdfFile(invoiceId);

    Logger.audit('INVOICE_PDF_GENERATED', 'INVOICE', invoiceId, {
      invoiceNumber: result.invoice['Invoice Number'],
      pdfUrl: result.file.getUrl()
    });

    return {
      fileId: result.file.getId(),
      fileName: result.file.getName(),
      fileUrl: result.file.getUrl()
    };
  }

  function sendEmail(invoiceId) {
    var result = createPdfFile(invoiceId);
    var recipient = String(result.client['Email'] || '').trim();

    if (!recipient) {
      throw new Error('Client email is required before sending an invoice.');
    }

    var invoice = result.invoice;
    var subject = 'فاتورة ' + invoice['Invoice Number'] + ' من ANC Advertising';

    var body =
      'مرحبًا ' + (result.client['Primary Contact'] || result.client['Client Name']) + ',\n\n' +
      'مرفق فاتورة رقم ' + invoice['Invoice Number'] + '.\n' +
      'تاريخ الاستحقاق: ' + invoice['Due Date'] + '.\n\n' +
      'شكرًا لكم,\nANC Advertising';

    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      attachments: [result.file.getBlob()]
    });

    Logger.audit('INVOICE_EMAIL_SENT', 'INVOICE', invoiceId, {
      invoiceNumber: invoice['Invoice Number'],
      recipient: recipient,
      pdfUrl: result.file.getUrl()
    });

    return {
      recipient: recipient,
      fileUrl: result.file.getUrl(),
      message: 'Invoice email sent successfully.'
    };
  }

  return Object.freeze({
    generate: generate,
    sendEmail: sendEmail
  });
})();

function getUiInvoiceDocumentsData() {
  return InvoiceService.list().map(function (invoice) {
    return {
      id: invoice['Invoice ID'],
      number: invoice['Invoice Number'],
      status: invoice['Status']
    };
  });
}

function uiGenerateInvoicePdf(invoiceId) {
  return InvoicePdfService.generate(invoiceId);
}

function uiSendInvoiceEmail(invoiceId) {
  return InvoicePdfService.sendEmail(invoiceId);
}