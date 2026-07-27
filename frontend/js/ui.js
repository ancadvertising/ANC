window.ANCPageModules = window.ANCPageModules || {};
window.UI = (() => {
  const FILTER_STORAGE_PREFIX = 'anc-erp-date-filter-v1:';
  const detailRows = new Map();
  let tableSequence = 0;

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  const locale = () => document.documentElement.lang === 'en' ? 'en-US' : 'ar-EG-u-nu-latn';
  function resolveCurrency(currencyOrRow) {
    const configured = String(APP_CONFIG.DEFAULT_CURRENCY || 'EGP').trim().toUpperCase();
    const fallback = /^[A-Z]{3}$/.test(configured) ? configured : 'EGP';
    const candidate = currencyOrRow && typeof currencyOrRow === 'object'
      ? currencyOrRow.Currency || currencyOrRow.currency
      : currencyOrRow;
    const normalized = String(candidate || fallback).trim().toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : fallback;
  }

  function money(value, currencyOrRow = APP_CONFIG.DEFAULT_CURRENCY) {
    const amount = Number(value) || 0;
    const currency = resolveCurrency(currencyOrRow);
    try {
      return new Intl.NumberFormat(locale(), {
        style: 'currency',
        currency,
        numberingSystem: 'latn',
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return `${number(amount)} ${currency}`;
    }
  }
  const number = value => new Intl.NumberFormat(locale(), {
    numberingSystem: 'latn',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
  const date = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? escape(value) : new Intl.DateTimeFormat(locale(), {
      dateStyle: 'medium',
      numberingSystem: 'latn'
    }).format(parsed);
  };

  function toast(message, type = 'success') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.append(stack);
    }
    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = message;
    stack.append(item);
    setTimeout(() => item.remove(), 4500);
  }

  function loading(count = 4) {
    return `<div class="grid metrics">${Array.from({ length: count }, () => '<div class="skeleton"></div>').join('')}</div>`;
  }

  function empty(message = 'لا توجد بيانات لعرضها حاليًا.') {
    return `<div class="empty">${escape(message)}</div>`;
  }

  function badge(value) {
    const text = String(value || '—');
    const cls = /ACTIVE|PAID|DONE|POSTED|TRUE|APPROVED/i.test(text)
      ? 'success'
      : /CANCELLED|BLOCKED|FALSE|OVERDUE|REJECTED/i.test(text)
        ? 'danger'
        : 'warning';
    return `<span class="badge ${cls}">${escape(text)}</span>`;
  }

  const fieldTranslations = {
    'Client Name': 'اسم العميل',
    'clientName': 'اسم العميل',
    'Project Name': 'اسم المشروع',
    'projectName': 'اسم المشروع',
    'Title': 'العنوان',
    'title': 'العنوان',
    'Name': 'الاسم',
    'name': 'الاسم',
    'Description': 'الوصف',
    'description': 'الوصف',
    'Status': 'الحالة',
    'status': 'الحالة',
    'Amount': 'المبلغ',
    'amount': 'المبلغ',
    'Currency': 'العملة',
    'currency': 'العملة',
    'Issue Date': 'تاريخ الإصدار',
    'issueDate': 'تاريخ الإصدار',
    'Due Date': 'تاريخ الاستحقاق',
    'dueDate': 'تاريخ الاستحقاق',
    'Start Date': 'تاريخ البدء',
    'startDate': 'تاريخ البدء',
    'End Date': 'تاريخ الانتهاء',
    'endDate': 'تاريخ الانتهاء',
    'Created At': 'تاريخ الإنشاء',
    'createdAt': 'تاريخ الإنشاء',
    'Updated At': 'تاريخ التحديث',
    'updatedAt': 'تاريخ التحديث',
    'Created By': 'تم بواسطة',
    'createdBy': 'تم بواسطة',
    'Phone': 'الهاتف',
    'phone': 'الهاتف',
    'Email': 'البريد الإلكتروني',
    'email': 'البريد الإلكتروني',
    'Notes': 'الملاحظات',
    'notes': 'الملاحظات',
    'Progress': 'نسبة الإنجاز',
    'progress': 'نسبة الإنجاز',
    'Budget': 'الميزانية',
    'budget': 'الميزانية',
    'Platform': 'المنصة',
    'platform': 'المنصة',
    'Job Type': 'نوع الخدمة',
    'jobType': 'نوع الخدمة',
    'Assigned To': 'المسؤول',
    'assignedTo': 'المسؤول',
    'Delivery URL': 'رابط التسليم',
    'deliveryUrl': 'رابط التسليم',
    'Brief': 'التفاصيل التنفيذية',
    'brief': 'التفاصيل التنفيذية',
    'Sale Price': 'سعر البيع',
    'salePrice': 'سعر البيع',
    'Direct Cost': 'التكلفة المباشرة',
    'directCost': 'التكلفة المباشرة',
    'Billable': 'قابل للفوترة',
    'billable': 'قابل للفوترة'
  };

  function humanize(key) {
    if (fieldTranslations[key]) return fieldTranslations[key];
    return String(key || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, value => value.toUpperCase());
  }

  function detailDisplay(value) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (typeof value === 'object') return `<pre>${escape(JSON.stringify(value, null, 2))}</pre>`;
    if (/^https?:\/\//i.test(String(value))) {
      return `<a href="${escape(value)}" target="_blank" rel="noopener">${escape(value)}</a>`;
    }
    return escape(value);
  }

  function isExcludedDetailKey(key) {
    const pattern = /^(password|salt|hash|base64|token|secret|actions|action|options|الاجراءات|الإجراءات|الخيارات|الإجراء|_id|id|clientId|projectId|taskId|adId|studioJobId|userId|documentId|invoiceId|bankAccountId|expenseId|requestId|paymentId|approvalId|employeeId|statementId|assetId|client_id|project_id|task_id|ad_id|studio_job_id|user_id|document_id|invoice_id|bank_account_id|expense_id|request_id|payment_id|approval_id|employee_id|statement_id|asset_id|Client ID|Project ID|Task ID|Ad ID|Studio Job ID|User ID|Document ID|Invoice ID|Bank Account ID|Expense ID|Request ID|Payment ID|Approval ID|Employee ID|Client Statement ID|Asset ID)$/i;
    return pattern.test(String(key || '').trim());
  }

  function openDetails(row, columns = [], title = '') {
    document.querySelector('.record-drawer-backdrop')?.remove();
    const labels = new Map(columns.map(column => [column.key, column.label]));
    const fields = Object.entries(row || {}).filter(([key, value]) => {
      if (isExcludedDetailKey(key)) return false;
      if (typeof value === 'function') return false;
      return true;
    });

    const root = document.createElement('div');
    root.className = 'record-drawer-backdrop';
    root.innerHTML = `
      <aside class="record-drawer" role="dialog" aria-modal="true" aria-labelledby="record-drawer-title">
        <header class="record-drawer-header">
          <div><span class="page-eyebrow">Record Details</span><h2 id="record-drawer-title">${escape(title || 'تفاصيل السجل')}</h2></div>
          <button class="btn" type="button" data-close-drawer>إغلاق</button>
        </header>
        <div class="record-detail-grid">
          ${fields.map(([key, value]) => {
            const rawLabel = labels.get(key);
            const labelText = rawLabel && !isExcludedDetailKey(rawLabel) ? rawLabel : humanize(key);
            return `<div class="record-detail-item"><span>${escape(labelText)}</span><strong>${detailDisplay(value)}</strong></div>`;
          }).join('')}
        </div>
      </aside>`;
    root.addEventListener('click', event => {
      if (event.target === root || event.target.closest('[data-close-drawer]')) root.remove();
    });
    document.body.append(root);
    root.querySelector('.record-drawer')?.insertAdjacentHTML('beforeend', '<section class="record-notes" data-record-notes></section>');
    loadRecordNotes(root, row);
    root.querySelector('[data-close-drawer]')?.focus();
  }

  function table(rows, columns, options = {}) {
    if (!rows?.length) return empty();
    const tableId = `table-${++tableSequence}`;
    const body = rows.map((row, index) => {
      const detailId = `${tableId}-row-${index}`;
      detailRows.set(detailId, { row, columns, title: options.detailTitle || '' });
      return `<tr class="clickable-row" tabindex="0" data-row-detail-id="${detailId}" aria-label="عرض تفاصيل السجل">${columns.map(column => `<td>${column.render ? column.render(row[column.key], row) : escape(row[column.key] ?? '—')}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="table-wrap"><table><thead><tr>${columns.map(column => `<th>${escape(column.label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function metric(label, value, hint = '') {
    return `<article class="card metric"><div class="metric-label">${escape(label)}</div><div class="metric-value">${value}</div>${hint ? `<div class="metric-trend">${escape(hint)}</div>` : ''}</article>`;
  }

  function formData(form) {
    return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value === 'on' ? true : value]));
  }

  function modal(title, content) {
    const root = document.createElement('div');
    root.className = 'modal';
    root.innerHTML = `<section class="card"><div class="card-header"><h2>${escape(title)}</h2><button class="btn" data-close>إغلاق</button></div>${content}</section>`;
    root.addEventListener('click', event => {
      if (event.target === root || event.target.closest('[data-close]')) root.remove();
    });
    document.body.append(root);
    return root;
  }

  function setMain(html) {
    const root = document.querySelector('#page-content');
    root.innerHTML = html;
    window.ANC_APPLY_PAGE_ACCESS?.(root);
  }

  function error(error) {
    setMain(`<div class="card"><div class="alert danger"><strong>تعذر تحميل الصفحة</strong><br>${escape(error.message)}</div><div class="actions" style="margin-top:14px"><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div></div>`);
  }

  async function submit(form, callback) {
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    try {
      await callback(formData(form));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function portalKey(role) {
    if (role === 'CLIENT') return 'client';
    if (role === 'EMPLOYEE') return 'employee';
    return 'admin';
  }

  function dateInputValue(value) {
    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return '';
    const offset = dateValue.getTimezoneOffset();
    return new Date(dateValue.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function presetRange(preset) {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const to = new Date(from);
    if (preset === 'all') return { preset, from: '', to: '' };
    if (preset === 'week') from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    if (preset === 'month') from.setDate(1);
    if (preset === 'quarter') {
      from.setMonth(Math.floor(from.getMonth() / 3) * 3, 1);
    }
    if (preset === 'year') from.setMonth(0, 1);
    return { preset, from: dateInputValue(from), to: dateInputValue(to) };
  }

  function readFilter(role) {
    const key = `${FILTER_STORAGE_PREFIX}${portalKey(role)}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      return {
        preset: stored.preset || 'all',
        from: stored.from || '',
        to: stored.to || ''
      };
    } catch {
      return presetRange('all');
    }
  }

  function saveFilter(role, value) {
    localStorage.setItem(`${FILTER_STORAGE_PREFIX}${portalKey(role)}`, JSON.stringify(value));
  }

  function filterRows(rows, fields = []) {
    const role = window.ANC_CURRENT_ROLE || 'EMPLOYEE';
    const filter = readFilter(role);
    if (!filter.from && !filter.to) return [...(rows || [])];
    const fromTime = filter.from ? new Date(`${filter.from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = filter.to ? new Date(`${filter.to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    const candidates = fields.length ? fields : [
      'Created At', 'Updated At', 'Issue Date', 'Payment Date', 'Expense Date', 'Transaction Date',
      'Start Date', 'Due Date', 'Date', 'createdAt', 'updatedAt', 'startDate', 'dueDate'
    ];
    return (rows || []).filter(row => {
      const raw = candidates.map(field => row?.[field]).find(value => value !== undefined && value !== null && value !== '');
      if (!raw) return false;
      const time = new Date(raw).getTime();
      return !Number.isNaN(time) && time >= fromTime && time <= toTime;
    });
  }

  function currentDateFilter(role = window.ANC_CURRENT_ROLE || 'EMPLOYEE') {
    return readFilter(role);
  }

  function mountDateFilter(role, onChange) {
    window.ANC_CURRENT_ROLE = role;
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    document.querySelector('#global-date-filter')?.remove();
    const filter = readFilter(role);
    const root = document.createElement('section');
    root.id = 'global-date-filter';
    root.className = 'global-date-filter';
    root.setAttribute('aria-label', 'فلتر التاريخ');
    root.innerHTML = `
      <label><span>الفترة</span><select data-date-preset>
        <option value="all">كل الفترات</option>
        <option value="today">اليوم</option>
        <option value="week">هذا الأسبوع</option>
        <option value="month">هذا الشهر</option>
        <option value="quarter">هذا الربع</option>
        <option value="year">هذه السنة</option>
        <option value="custom">مخصص</option>
      </select></label>
      <label><span>من</span><input data-date-from type="date" value="${escape(filter.from)}"></label>
      <label><span>إلى</span><input data-date-to type="date" value="${escape(filter.to)}"></label>`;
    root.querySelector('[data-date-preset]').value = filter.preset;
    const actions = topbar.querySelector('.topbar-actions');
    topbar.insertBefore(root, actions);

    const emit = value => {
      if (value.from && value.to && value.from > value.to) {
        toast('تاريخ البداية يجب ألا يتجاوز تاريخ النهاية.', 'error');
        return;
      }
      saveFilter(role, value);
      window.dispatchEvent(new CustomEvent('anc:date-filter-change', { detail: value }));
      if (typeof onChange === 'function') onChange(value);
    };

    root.querySelector('[data-date-preset]').addEventListener('change', event => {
      const preset = event.target.value;
      const value = preset === 'custom'
        ? { preset, from: root.querySelector('[data-date-from]').value, to: root.querySelector('[data-date-to]').value }
        : presetRange(preset);
      root.querySelector('[data-date-from]').value = value.from;
      root.querySelector('[data-date-to]').value = value.to;
      emit(value);
    });
    root.querySelectorAll('input[type="date"]').forEach(input => input.addEventListener('change', () => {
      root.querySelector('[data-date-preset]').value = 'custom';
      emit({
        preset: 'custom',
        from: root.querySelector('[data-date-from]').value,
        to: root.querySelector('[data-date-to]').value
      });
    }));
  }


  function inferEntity(row) {
    if (!row || typeof row !== 'object') return null;

    const keyMap = [
      [['Studio Job ID', 'studio_job_id', 'studioJobId', 'jobId', 'job_id'], 'STUDIO_JOB'],
      [['Request ID', 'request_id', 'requestId'], 'SERVICE_REQUEST'],
      [['Ad ID', 'ad_id', 'adId'], 'AD'],
      [['Task ID', 'task_id', 'taskId'], 'TASK'],
      [['Invoice ID', 'invoice_id', 'invoiceId'], 'INVOICE'],
      [['Payment ID', 'payment_id', 'paymentId'], 'PAYMENT'],
      [['Expense ID', 'expense_id', 'expenseId'], 'EXPENSE'],
      [['Document ID', 'document_id', 'documentId'], 'DOCUMENT'],
      [['Bank Account ID', 'bank_account_id', 'bankAccountId', 'accountId', 'account_id'], 'BANK_ACCOUNT'],
      [['Approval ID', 'approval_id', 'approvalId'], 'APPROVAL'],
      [['User ID', 'user_id', 'userId'], 'USER'],
      [['Project ID', 'project_id', 'projectId'], 'PROJECT'],
      [['Client ID', 'client_id', 'clientId'], 'CLIENT']
    ];

    for (const [candidates, type] of keyMap) {
      for (const key of candidates) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return { entityId: String(row[key]), entityType: type };
        }
      }
    }
    return null;
  }

  async function loadRecordNotes(root, row) {
    const entity = inferEntity(row);
    const host = root.querySelector('[data-record-notes]');
    if (!entity || !host) { if (host) host.remove(); return; }
    host.innerHTML = '<div class="skeleton"></div>';
    try {
      const [notesData, labelsData] = await Promise.all([
        API.get('notes', entity),
        API.get('note.labels').catch(() => ({ labels: [] }))
      ]);
      const notes = notesData.notes || [];
      const labels = labelsData.labels || [];
      host.innerHTML = `
        <div class="record-notes-header"><div><span class="page-eyebrow">Notes</span><h3>الملاحظات</h3></div><span class="badge">${number(notes.length)}</span></div>
        <div class="record-notes-list">${notes.length ? notes.map(note => {
          const noteLabels = (note.labels || []).map(label => `<span class="note-label" style="--label-color:${escape(label.color)}">${escape(document.documentElement.lang === 'en' ? label.nameEn : label.nameAr)}</span>`).join('');
          return `<article class="record-note"><div>${noteLabels}</div><p>${escape(note.Body)}</p><small>${escape(note['Created By Name'])} · ${date(note['Created At'])}</small></article>`;
        }).join('') : '<p class="muted">لا توجد ملاحظات بعد.</p>'}</div>
        <form class="record-note-form"><textarea name="body" required maxlength="5000" placeholder="اكتب ملاحظة..."></textarea>
          <div class="note-label-picker">${labels.map(label => `<label class="note-label" style="--label-color:${escape(label.Color)}"><input type="checkbox" name="labelId" value="${escape(label['Label ID'])}">${escape(document.documentElement.lang === 'en' ? label['Name En'] : label['Name Ar'])}</label>`).join('')}</div>
          <button class="btn btn-primary" type="submit">إضافة الملاحظة</button>
        </form>`;
      const form = host.querySelector('form');
      form?.addEventListener('submit', async event => {
        event.preventDefault();
        const button = form.querySelector('button');
        button.disabled = true;
        try {
          const labelIds = [...form.querySelectorAll('input[name="labelId"]:checked')].map(input => input.value);
          await API.post('notes', { ...entity, body: form.elements.body.value, labelIds });
          await loadRecordNotes(root, row);
          toast('تمت إضافة الملاحظة.');
        } catch (error) {
          toast(error.message, 'error');
          button.disabled = false;
        }
      });
    } catch (error) {
      host.innerHTML = `<div class="alert danger">${escape(error.message)}</div>`;
    }
  }

  async function requestApproval(entityType, entityId, action, payload, description) {
    if (entityType && typeof entityType === 'object') {
      ({ entityType, entityId, action, payload, description } = entityType);
    }
    const result = await API.post('approvals', { entityType, entityId, action, payload: payload || {}, description });
    if (result?.approval?.status === 'APPROVED') {
      toast('تم تنفيذ التعديل بنجاح.');
    } else {
      toast('تم إرسال طلب الاعتماد إلى المدير الأساسي.');
    }
    return result;
  }

  function sessionId() {
    let value = sessionStorage.getItem('anc-session-id');
    if (!value) {
      value = globalThis.crypto?.randomUUID?.() || String(Date.now());
      sessionStorage.setItem('anc-session-id', value);
    }
    return value;
  }

  async function showPendingNotifications() {
    const data = await API.get('notifications', { sessionId: sessionId() }).catch(() => ({ notifications: [] }));
    for (const notification of data.notifications || []) {
      const language = document.documentElement.lang === 'en' ? 'en' : 'ar';
      const requiresAck = Boolean(notification['Requires Ack']);
      const modalRoot = modal(language === 'en' ? notification['Title En'] : notification['Title Ar'], `
        <div class="popup-notification"><p>${escape(language === 'en' ? notification['Message En'] : notification['Message Ar'])}</p>
        ${requiresAck ? '<p class="alert warning">يجب الموافقة على هذا الإشعار للمتابعة.</p>' : ''}
        <div class="actions"><button class="btn btn-primary" data-notification-confirm>${requiresAck ? 'أوافق' : 'حسناً'}</button></div></div>`);
      if (requiresAck) modalRoot.querySelectorAll('[data-close]').forEach(button => button.remove());
      await new Promise(resolve => {
        modalRoot.querySelector('[data-notification-confirm]').addEventListener('click', async () => {
          try {
            await API.post('notifications.ack', { notificationId: notification['Notification ID'], sessionId: sessionId(), acknowledged: requiresAck });
            modalRoot.remove();
            resolve();
          } catch (error) { toast(error.message, 'error'); }
        });
      });
    }
  }
  document.addEventListener('click', event => {
    if (event.target.closest('button,a,input,select,textarea,label')) return;
    const target = event.target.closest('[data-row-detail-id]');
    if (!target) return;
    const details = detailRows.get(target.dataset.rowDetailId);
    if (details) openDetails(details.row, details.columns, details.title);
  });

  document.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const target = event.target.closest('[data-row-detail-id]');
    if (!target || event.target.closest('button,a,input,select,textarea,label')) return;
    event.preventDefault();
    const details = detailRows.get(target.dataset.rowDetailId);
    if (details) openDetails(details.row, details.columns, details.title);
  });

  return {
    escape,
    money,
    number,
    date,
    toast,
    loading,
    empty,
    badge,
    table,
    metric,
    formData,
    modal,
    setMain,
    error,
    submit,
    openDetails,
    filterRows,
    currentDateFilter,
    mountDateFilter,
    requestApproval,
    showPendingNotifications
  };
})();
