window.ANCPageModules = window.ANCPageModules || {};
window.UI = (() => {
  const FILTER_STORAGE_PREFIX = 'anc-erp-date-filter-v1:';
  const detailRows = new Map();
  let tableSequence = 0;

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  const locale = () => document.documentElement.lang === 'en' ? 'en-US' : 'ar-EG-u-nu-latn';
  const money = (value, currency = APP_CONFIG.DEFAULT_CURRENCY) => new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: currency || APP_CONFIG.DEFAULT_CURRENCY,
    numberingSystem: 'latn',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
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

  function humanize(key) {
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

  function openDetails(row, columns = [], title = '') {
    document.querySelector('.record-drawer-backdrop')?.remove();
    const labels = new Map(columns.map(column => [column.key, column.label]));
    const fields = Object.entries(row || {}).filter(([key]) => !/(password|salt|hash|base64|token|secret)/i.test(key));
    const root = document.createElement('div');
    root.className = 'record-drawer-backdrop';
    root.innerHTML = `
      <aside class="record-drawer" role="dialog" aria-modal="true" aria-labelledby="record-drawer-title">
        <header class="record-drawer-header">
          <div><span class="page-eyebrow">Record Details</span><h2 id="record-drawer-title">${escape(title || 'تفاصيل السجل')}</h2></div>
          <button class="btn" type="button" data-close-drawer>إغلاق</button>
        </header>
        <div class="record-detail-grid">
          ${fields.map(([key, value]) => `<div class="record-detail-item"><span>${escape(labels.get(key) || humanize(key))}</span><strong>${detailDisplay(value)}</strong></div>`).join('')}
        </div>
      </aside>`;
    root.addEventListener('click', event => {
      if (event.target === root || event.target.closest('[data-close-drawer]')) root.remove();
    });
    document.body.append(root);
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
    document.querySelector('#page-content').innerHTML = html;
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
    mountDateFilter
  };
})();