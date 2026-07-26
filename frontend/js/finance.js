(() => {
  const esc = UI.escape;
  const isManagement = () => {
    const user = window.ANC_CURRENT_USER || {};
    const role = String(user.role || '').toUpperCase();
    return user.userType === 'ADMIN' || ['ADMIN','MANAGER','ASSISTANT_MANAGER'].includes(role);
  };

  function option(value, label, selected, extra) {
    return "<option value='" + esc(value) + "'" + (selected ? " selected" : "") + (extra || '') + ">" + esc(label) + "</option>";
  }

  function accountForm() {
    return "<form class='form-grid'><div class='field'><label>اسم الحساب</label><input name='accountName' required></div><div class='field'><label>البنك</label><input name='bankName' required></div><div class='field'><label>رقم الحساب المقنّع</label><input name='accountNumberMasked' placeholder='**** 1234'></div><div class='field'><label>الرصيد الافتتاحي</label><input name='openingBalance' type='number' step='.01' value='0'></div><div class='wide actions'><button class='btn btn-primary' type='submit'>إنشاء الحساب</button></div></form>";
  }

  function depositForm(accounts) {
    return "<form class='form-grid'><div class='field'><label>الحساب</label><select name='bankAccountId' required>" +
      accounts.map(row => option(row['Bank Account ID'], row['Account Name'] + ' — ' + UI.money(row['Current Balance']), false)).join('') +
      "</select></div><div class='field'><label>القيمة</label><input name='amount' type='number' min='.01' step='.01' required></div><div class='field wide'><label>الوصف</label><input name='description' value='إيداع بنكي'></div><div class='wide actions'><button class='btn btn-primary' type='submit'>تسجيل الإيداع</button></div></form>";
  }

  function expenseForm(expense, clients, projects, accounts) {
    expense = expense || {};
    const today = new Date().toISOString().slice(0,10);
    const clientId = expense['Client ID'] || '';
    const projectId = expense['Project ID'] || '';
    const clientsHtml = ["<option value=''>غير مرتبط بعميل</option>"].concat(clients.map(row => option(row['Client ID'],row['Client Name'],row['Client ID'] === clientId))).join('');
    const projectsHtml = ["<option value=''>غير مرتبط بمشروع</option>"].concat(projects.map(row => option(row['Project ID'],row['Project Name'],row['Project ID'] === projectId," data-client='" + esc(row['Client ID']) + "'"))).join('');
    const accountsHtml = ["<option value=''>اختر الحساب</option>"].concat(accounts.filter(row => String(row.Active).toLowerCase() !== 'false').map(row => option(row['Bank Account ID'],row['Account Name'] + ' — ' + UI.money(row['Current Balance']),false))).join('');
    return [
      "<form class='form-grid expense-form'>",
      "<div class='field'><label>التاريخ</label><input name='expenseDate' type='date' required value='" + esc(String(expense['Expense Date'] || today).slice(0,10)) + "'></div>",
      "<div class='field'><label>التصنيف</label><input name='category' required value='" + esc(expense.Category || '') + "' placeholder='تشغيل / استوديو / أدوات'></div>",
      "<div class='field wide'><label>الوصف</label><input name='description' required value='" + esc(expense.Description || '') + "'></div>",
      "<div class='field'><label>المبلغ</label><input name='amount' type='number' min='.01' step='.01' required value='" + esc(expense.Amount || '') + "'></div>",
      "<div class='field'><label>العملة</label><input name='currency' value='" + esc(expense.Currency || 'EGP') + "'></div>",
      "<div class='field'><label>العميل</label><select name='clientId'>" + clientsHtml + "</select></div>",
      "<div class='field'><label>المشروع</label><select name='projectId'>" + projectsHtml + "</select></div>",
      "<div class='field'><label>المورد</label><input name='vendor' value='" + esc(expense.Vendor || '') + "'></div>",
      "<div class='field'><label>طريقة الدفع</label><input name='paymentMethod' value='" + esc(expense['Payment Method'] || '') + "'></div>",
      expense['Expense ID'] ? '' : "<div class='field'><label>الحساب البنكي</label><select name='bankAccountId'>" + accountsHtml + "</select></div>",
      expense['Expense ID'] ? '' : "<div class='field wide'><label class='check-row'><input type='checkbox' name='autoDebit'> خصم المبلغ تلقائياً من الحساب البنكي المحدد</label></div>",
      "<div class='wide actions'><button class='btn btn-primary' type='submit'>" + (expense['Expense ID'] ? 'إرسال التعديل للاعتماد' : 'تسجيل المصروف') + "</button></div>",
      "</form>"
    ].join('');
  }

  function bindExpenseProject(form) {
    const client = form.elements.clientId;
    const project = form.elements.projectId;
    const update = () => {
      Array.from(project.options).forEach(item => {
        if (!item.value) return;
        item.hidden = !!client.value && item.dataset.client !== client.value;
        item.disabled = item.hidden;
      });
      if (project.selectedOptions[0]?.disabled) project.value = '';
    };
    client.addEventListener('change',update);
    update();
  }

  function expenseActions(_, row) {
    return "<div class='table-actions'>" +
      "<button class='btn' data-expense-edit='" + esc(row['Expense ID']) + "'>تعديل</button>" +
      "<button class='btn danger-button' data-expense-archive='" + esc(row['Expense ID']) + "'>أرشفة</button>" +
    "</div>";
  }
  function projectInvoiceForm(clients, projects) {
    const today = new Date().toISOString().slice(0,10);
    const clientOptions = ["<option value=''>اختر العميل</option>"].concat(clients.map(row => option(row['Client ID'],row['Client Name'],false))).join('');
    const projectOptions = ["<option value=''>اختر المشروع</option>"].concat(projects.map(row => option(row['Project ID'],row['Project Name'],false," data-client='" + esc(row['Client ID']) + "'"))).join('');
    return [
      "<form class='form-grid project-invoice-form'>",
      "<div class='field'><label>العميل</label><select name='clientId' required>" + clientOptions + "</select></div>",
      "<div class='field'><label>المشروع</label><select name='projectId' required>" + projectOptions + "</select></div>",
      "<div class='field'><label>تاريخ الإصدار</label><input name='issueDate' type='date' value='" + today + "' required></div>",
      "<div class='field'><label>تاريخ الاستحقاق</label><input name='dueDate' type='date'><small>يُحسب تلقائيًا من الإعدادات عند تركه فارغًا.</small></div>",
      "<div class='field'><label>نسبة الضريبة %</label><input name='taxRate' type='number' min='0' max='100' step='.01' placeholder='من الإعدادات'></div>",
      "<div class='field'><label>حالة الفاتورة</label><select name='status'><option>DRAFT</option><option>SENT</option></select></div>",
      "<div class='field wide'><label>ملاحظات الفاتورة</label><textarea name='notes'></textarea></div>",
      "<div id='project-invoice-preview' class='wide'><div class='empty'>اختر العميل والمشروع لعرض البنود غير المفوترة.</div></div>",
      "<div class='wide actions'><button class='btn btn-primary' type='submit' disabled>إنشاء فاتورة المشروع وPDF</button></div>",
      "</form>"
    ].join('');
  }

  function paymentForm(invoice) {
    const today = new Date().toISOString().slice(0,10);
    return [
      "<form class='form-grid'>",
      "<div class='field'><label>الفاتورة</label><input value='" + esc(invoice['Invoice Number']) + "' disabled></div>",
      "<div class='field'><label>المبلغ المتبقي</label><input value='" + esc(invoice['Balance Due']) + "' disabled></div>",
      "<div class='field'><label>تاريخ الدفع</label><input name='paymentDate' type='date' required value='" + today + "'></div>",
      "<div class='field'><label>المبلغ</label><input name='amount' type='number' min='.01' max='" + esc(Math.max(0,Number(invoice['Balance Due'] || 0))) + "' step='.01' required value='" + esc(Math.max(0,Number(invoice['Balance Due'] || 0))) + "'></div>",
      "<div class='field'><label>طريقة الدفع</label><select name='method'><option>Bank Transfer</option><option>Cash</option><option>Card</option><option>Other</option></select></div>",
      "<div class='field'><label>المرجع</label><input name='reference'></div>",
      "<div class='wide actions'><button class='btn btn-primary' type='submit'>تسجيل الدفعة</button></div>",
      "</form>"
    ].join('');
  }

  function bindInvoiceProject(form) {
    const client = form.elements.clientId;
    const project = form.elements.projectId;
    const preview = form.querySelector('#project-invoice-preview');
    const submit = form.querySelector('[type=submit]');
    let lastPreview = null;

    const filterProjects = () => {
      Array.from(project.options).forEach(item => {
        if (!item.value) return;
        const visible = item.dataset.client === client.value;
        item.hidden = !visible;
        item.disabled = !visible;
      });
      if (project.selectedOptions[0] && project.selectedOptions[0].disabled) project.value = '';
      preview.innerHTML = "<div class='empty'>اختر المشروع لعرض بنوده.</div>";
      submit.disabled = true;
      lastPreview = null;
    };

    const loadPreview = async () => {
      if (!client.value || !project.value) return;
      preview.innerHTML = UI.loading(2);
      submit.disabled = true;
      try {
        lastPreview = await API.get('invoices.projectPreview', { clientId:client.value, projectId:project.value });
        const items = lastPreview.items || [];
        preview.innerHTML =
          "<div class='invoice-preview-summary'>" +
            UI.metric('البنود غير المفوترة',items.length) +
            UI.metric('الإجمالي',UI.money(lastPreview.subtotal)) +
            UI.metric('الضريبة',UI.money(lastPreview.taxAmount),UI.number(lastPreview.taxRate) + '%') +
            UI.metric('المطلوب',UI.money(lastPreview.total)) +
          "</div>" +
          UI.table(items,[
            {key:'Description',label:'البيان'},
            {key:'Reference Type',label:'المصدر',render:UI.badge},
            {key:'Amount',label:'القيمة',render:UI.money}
          ]);
        submit.disabled = !items.length;
      } catch (error) {
        preview.innerHTML = "<div class='alert danger'>" + esc(error.message) + "</div>";
        submit.disabled = true;
      }
    };

    client.addEventListener('change', filterProjects);
    project.addEventListener('change', loadPreview);
    filterProjects();
    return () => lastPreview;
  }

  function invoiceActions(_, row) {
    const balance = Number(row['Balance Due'] || 0);
    return "<div class='table-actions'>" +
      "<button class='btn' data-invoice-pdf='" + esc(row['Invoice ID']) + "'>PDF</button>" +
      (balance > 0 ? "<button class='btn btn-primary' data-invoice-payment='" + esc(row['Invoice ID']) + "'>تسجيل دفع</button>" : '') +
    "</div>";
  }

  function openSimple(title, html, route, reload) {
    const modal = UI.modal(title, html);
    const form = modal.querySelector('form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      UI.submit(form, async data => {
        await API.post(route,data);
        UI.toast('تم حفظ العملية المالية.');
        modal.remove();
        await reload();
      });
    });
  }

  async function load() {
    const canManage = isManagement();
    const results = await Promise.all([
      API.get('invoices'),
      API.get('payments'),
      canManage ? API.get('expenses') : Promise.resolve({ expenses: [] }),
      canManage ? API.get('bank.accounts') : Promise.resolve({ accounts: [] }),
      canManage ? API.get('clients') : Promise.resolve({ clients: [] }),
      canManage ? API.get('projects') : Promise.resolve({ projects: [] })
    ]);
    const invoices = UI.filterRows(results[0].invoices || [], ['Issue Date', 'Due Date', 'Created At', 'Updated At']);
    const payments = UI.filterRows(results[1].payments || [], ['Payment Date', 'Created At']);
    const expenses = UI.filterRows(results[2].expenses || [], ['Expense Date', 'Created At']);
    const accounts = results[3].accounts || [];
    const clients = results[4].clients || [];
    const projects = results[5].projects || [];
    const invoiceTotal = invoices.reduce((sum,row) => sum + Number(row.Amount || 0) + Number(row['Tax Amount'] || 0),0);
    const paidTotal = payments.reduce((sum,row) => sum + Number(row.Amount || 0),0);
    const outstanding = invoices.reduce((sum,row) => sum + Math.max(0,Number(row['Balance Due'] || 0)),0);

    UI.setMain(
      "<section class='grid metrics'>" +
        UI.metric('إجمالي الفواتير',UI.money(invoiceTotal)) +
        UI.metric('التحصيل',UI.money(paidTotal)) +
        UI.metric('المتبقي',UI.money(outstanding)) +
        UI.metric('الرصيد البنكي',UI.money(accounts.reduce((sum,row) => sum + Number(row['Current Balance'] || 0),0))) +
      "</section>" +
      "<section class='card'><div class='card-header'><h2>الحسابات البنكية</h2><div class='actions'><button class='btn' id='new-account'>حساب جديد</button>" +
        (accounts.length ? "<button class='btn btn-primary' id='new-deposit'>إيداع</button>" : '') +
      "</div></div>" +
      UI.table(accounts,[
        {key:'Account Name',label:'الحساب'},
        {key:'Bank Name',label:'البنك'},
        {key:'Account Number Masked',label:'الرقم'},
        {key:'Current Balance',label:'الرصيد',render:UI.money},
        {key:'Active',label:'نشط',render:UI.badge}
      ]) +
      "</section>" +
      "<section class='card'><div class='card-header'><div><h2>الفواتير</h2><p class='muted'>الفاتورة تُنشأ من البنود غير المفوترة داخل مشروع واحد، وتعرض اسم العميل والمشروع.</p></div><button class='btn btn-primary' id='new-invoice'>فاتورة مشروع جديدة</button></div>" +
      UI.table(invoices,[
        {key:'Invoice Number',label:'رقم الفاتورة'},
        {key:'Client Name',label:'العميل'},
        {key:'Project Name',label:'المشروع'},
        {key:'Issue Date',label:'الإصدار',render:UI.date},
        {key:'Amount',label:'قبل الضريبة',render:UI.money},
        {key:'Paid Amount',label:'المدفوع',render:UI.money},
        {key:'Balance Due',label:'المتبقي',render:UI.money},
        {key:'Status',label:'الحالة',render:UI.badge},
        {key:'Invoice ID',label:'الإجراءات',render:invoiceActions}
      ]) +
      "</section>" +
      "<section class='grid two'><article class='card'><div class='card-header'><h2>المدفوعات</h2></div>" +
      UI.table(payments,[
        {key:'Payment Date',label:'التاريخ',render:UI.date},
        {key:'Client Name',label:'العميل'},
        {key:'Invoice Number',label:'الفاتورة'},
        {key:'Amount',label:'القيمة',render:UI.money},
        {key:'Method',label:'الطريقة'}
      ]) +
      "</article><article class='card'><div class='card-header'><h2>المصروفات</h2></div>" +
      UI.table(expenses,[
        {key:'Expense Date',label:'التاريخ',render:UI.date},
        {key:'Category',label:'التصنيف'},
        {key:'Amount',label:'القيمة',render:UI.money},
        {key:'Vendor',label:'المورد'},
        {key:'Expense ID',label:'الإجراءات',render:expenseActions}
      ]) +
      "</article></section>"
    );

    if (!canManage) {
      document.querySelector('#new-account')?.closest('section')?.remove();
      document.querySelector('#new-invoice')?.remove();
      const expenseCard = Array.from(document.querySelectorAll('.grid.two .card')).find(card => card.querySelector('h2')?.textContent.trim() === 'المصروفات');
      expenseCard?.remove();
    }

    const reload = () => load();
    const expenseCard = Array.from(document.querySelectorAll('.grid.two .card')).find(card => card.querySelector('h2')?.textContent.trim() === 'المصروفات');
    if (canManage && expenseCard) {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      button.id = 'new-expense';
      button.textContent = 'مصروف جديد';
      expenseCard.querySelector('.card-header')?.append(button);
    }

    const openExpenseEditor = expense => {
      const modal = UI.modal(expense ? 'تعديل المصروف' : 'مصروف جديد', expenseForm(expense,clients,projects,accounts));
      const expenseTarget = modal.querySelector('form');
      bindExpenseProject(expenseTarget);
      const autoDebit = expenseTarget.elements.autoDebit;
      if (autoDebit) {
        const bank = expenseTarget.elements.bankAccountId;
        const syncRequired = () => { bank.required = autoDebit.checked; };
        autoDebit.addEventListener('change',syncRequired);
        syncRequired();
      }
      expenseTarget.addEventListener('submit',event => {
        event.preventDefault();
        UI.submit(expenseTarget,async data => {
          if (expense) data.expenseId = expense['Expense ID'];
          data.autoDebit = Boolean(expenseTarget.elements.autoDebit?.checked);
          const result = expense ? await API.put('expenses',data) : await API.post('expenses',data);
          UI.toast(result.approval ? 'تم إرسال تعديل المصروف إلى المدير الأساسي للاعتماد.' : 'تم تسجيل المصروف وربطه بالمشروع.');
          modal.remove();
          await reload();
        });
      });
    };
    document.querySelector('#new-account')?.addEventListener('click', () => openSimple('حساب بنكي جديد',accountForm(),'bank.accounts',reload));
    document.querySelector('#new-deposit')?.addEventListener('click', () => openSimple('تسجيل إيداع',depositForm(accounts),'bank.deposit',reload));
    document.querySelector('#new-expense')?.addEventListener('click', () => openExpenseEditor(null));
    document.querySelectorAll('[data-expense-edit]').forEach(button => button.addEventListener('click',event => {
      event.stopPropagation();
      openExpenseEditor(expenses.find(row => row['Expense ID'] === button.dataset.expenseEdit));
    }));
    document.querySelectorAll('[data-expense-archive]').forEach(button => button.addEventListener('click',async event => {
      event.stopPropagation();
      if (!confirm('سيتم إرسال طلب أرشفة المصروف وعكس حركته البنكية للاعتماد. متابعة؟')) return;
      try {
        button.disabled = true;
        const result = await API.post('expenses.archive',{ expenseId:button.dataset.expenseArchive, reason:'Archive requested from expense list' });
        UI.toast(result.approval ? 'تم إرسال طلب الأرشفة للاعتماد.' : 'تمت أرشفة المصروف وعكس الحركة البنكية.');
        await reload();
      } catch (error) {
        UI.toast(error.message,'error');
        button.disabled = false;
      }
    }));
    document.querySelector('#new-invoice')?.addEventListener('click', () => {
      const modal = UI.modal('إنشاء فاتورة من مشروع',projectInvoiceForm(clients,projects));
      const form = modal.querySelector('form');
      bindInvoiceProject(form);
      form.addEventListener('submit', event => {
        event.preventDefault();
        UI.submit(form, async data => {
          const result = await API.post('invoices.project',data);
          const pdf = await API.post('invoices.pdf',{invoiceId:result.invoice['Invoice ID']});
          UI.toast('تم إنشاء فاتورة المشروع وملف PDF.');
          modal.remove();
          window.open(pdf.url,'_blank','noopener');
          await reload();
        });
      });
    });
    document.querySelectorAll('[data-invoice-pdf]').forEach(button => button.addEventListener('click',async () => {
      try {
        button.disabled = true;
        const pdf = await API.post('invoices.pdf',{invoiceId:button.dataset.invoicePdf});
        window.open(pdf.url,'_blank','noopener');
      } catch (error) {
        UI.toast(error.message,'error');
      } finally {
        button.disabled = false;
      }
    }));
    document.querySelectorAll('[data-invoice-payment]').forEach(button => button.addEventListener('click',() => {
      const invoice = invoices.find(row => row['Invoice ID'] === button.dataset.invoicePayment);
      const modal = UI.modal('تسجيل دفعة',paymentForm(invoice));
      const form = modal.querySelector('form');
      form.addEventListener('submit',event => {
        event.preventDefault();
        UI.submit(form,async data => {
          data.invoiceId = invoice['Invoice ID'];
          data.clientId = invoice['Client ID'];
          data.currency = invoice.Currency || 'EGP';
          await API.post('payments',data);
          UI.toast('تم تسجيل الدفعة وتحديث حالة الفاتورة.');
          modal.remove();
          await reload();
        });
      });
    }));
  }

  ANCPageModules.finance = { load };
})();