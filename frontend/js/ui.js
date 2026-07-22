window.ANCPageModules = window.ANCPageModules || {};
window.UI = (() => {
  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  const money = value => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: APP_CONFIG.DEFAULT_CURRENCY, maximumFractionDigits: 2 }).format(Number(value) || 0);
  const number = value => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  const date = value => value ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value)) : '—';
  function toast(message, type = 'success') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.append(stack); }
    const item = document.createElement('div'); item.className = `toast ${type}`; item.textContent = message; stack.append(item); setTimeout(() => item.remove(), 4500);
  }
  function loading(count = 4) { return `<div class="grid metrics">${Array.from({ length: count }, () => '<div class="skeleton"></div>').join('')}</div>`; }
  function empty(message = 'لا توجد بيانات لعرضها حاليًا.') { return `<div class="empty">${escape(message)}</div>`; }
  function badge(value) {
    const text = String(value || '—');
    const cls = /ACTIVE|PAID|DONE|POSTED|TRUE/.test(text) ? 'success' : /CANCELLED|BLOCKED|FALSE|OVERDUE/.test(text) ? 'danger' : 'warning';
    return `<span class="badge ${cls}">${escape(text)}</span>`;
  }
  function table(rows, columns) {
    if (!rows?.length) return empty();
    return `<div class="table-wrap"><table><thead><tr>${columns.map(col => `<th>${escape(col.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(col => `<td>${col.render ? col.render(row[col.key], row) : escape(row[col.key] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function metric(label, value, hint = '') { return `<article class="card metric"><div class="metric-label">${escape(label)}</div><div class="metric-value">${value}</div>${hint ? `<div class="metric-trend">${escape(hint)}</div>` : ''}</article>`; }
  function formData(form) { return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value === 'on' ? true : value])); }
  function modal(title, content) {
    const root = document.createElement('div'); root.className = 'modal'; root.innerHTML = `<section class="card"><div class="card-header"><h2>${escape(title)}</h2><button class="btn" data-close>إغلاق</button></div>${content}</section>`; root.addEventListener('click', event => { if (event.target === root || event.target.closest('[data-close]')) root.remove(); }); document.body.append(root); return root;
  }
  function setMain(html) { document.querySelector('#page-content').innerHTML = html; }
  function error(error) { setMain(`<div class="card"><div class="alert danger"><strong>تعذر تحميل الصفحة</strong><br>${escape(error.message)}</div><div class="actions" style="margin-top:14px"><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div></div>`); }
  async function submit(form, callback) { const button = form.querySelector('[type="submit"]'); if (button) button.disabled = true; try { await callback(formData(form)); } catch (err) { toast(err.message, 'error'); } finally { if (button) button.disabled = false; } }
  return { escape, money, number, date, toast, loading, empty, badge, table, metric, formData, modal, setMain, error, submit };
})();
