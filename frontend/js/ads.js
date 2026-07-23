(() => {
  let adSettings = {};
  let showArchived = false;
  const esc = UI.escape;
  const truthy = value => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

  function option(value, label, selected, extra) {
    return "<option value='" + esc(value) + "'" + (selected ? " selected" : "") + (extra || '') + ">" + esc(label) + "</option>";
  }

  function calculate(data) {
    const days = Number(data.days) || 0;
    const dailyRate = Number(data.dailyRate) || 0;
    const costRate = data.costRate === '' ? Number(adSettings['Default Cost Rate'] || 1.19) : Number(data.costRate || 0);
    const commissionRate = data.commissionRate === '' ? Number(adSettings['Default Commission Rate'] || 0.2997) : Number(data.commissionRate || 0);
    const baseSpend = days * dailyRate;
    const internalCost = baseSpend * costRate;
    const commission = baseSpend * commissionRate;
    const salePrice = data.salePrice === '' ? baseSpend + internalCost + commission : Number(data.salePrice || 0);
    const bankDebit = baseSpend + internalCost;
    const profit = salePrice - bankDebit;
    const margin = salePrice ? profit / salePrice * 100 : 0;
    const minAmount = Number(adSettings['Minimum Profit Amount'] || 300);
    const minMargin = Number(adSettings['Minimum Profit Margin'] || 0);
    return { baseSpend, internalCost, commission, salePrice, bankDebit, profit, margin, below: profit < minAmount || margin < minMargin };
  }

  function adForm(ad, clients, projects, accounts) {
    ad = ad || {};
    const clientId = ad['Client ID'] || '';
    const projectId = ad['Project ID'] || '';
    const clientOptions = ["<option value=''>اختر العميل</option>"].concat(clients.map(row => option(row['Client ID'], row['Client Name'], row['Client ID'] === clientId))).join('');
    const projectOptions = ["<option value=''>اختر المشروع</option>"].concat(projects.map(row => option(row['Project ID'], row['Project Name'], row['Project ID'] === projectId, " data-client='" + esc(row['Client ID']) + "'"))).join('');
    const accountOptions = ["<option value=''>بدون خصم بنكي</option>"].concat(accounts.map(row => option(row['Bank Account ID'], row['Account Name'] + ' — ' + UI.money(row['Current Balance']), row['Bank Account ID'] === ad['Bank Account ID']))).join('');
    const value = (key, fallback) => esc(ad[key] ?? fallback ?? '');
    return [
      "<form id='ad-form' class='form-grid'>",
      "<div class='field'><label>العميل</label><select name='clientId' required>" + clientOptions + "</select></div>",
      "<div class='field'><label>المشروع</label><select name='projectId' required>" + projectOptions + "</select></div>",
      "<div class='field'><label>اسم الإعلان</label><input name='adName' required value='" + value('Ad Name') + "'></div>",
      "<div class='field'><label>المنصة</label><select name='platform'>" +
        ['Meta','Google','TikTok','LinkedIn','Snapchat'].map(name => option(name,name,name === (ad.Platform || 'Meta'))).join('') +
      "</select></div>",
      "<div class='field'><label>الفترة</label><input name='period' value='" + value('Period') + "' placeholder='مثال: أغسطس 2026'></div>",
      "<div class='field'><label>عدد الأيام</label><input name='days' type='number' min='1' required value='" + value('Days',1) + "'></div>",
      "<div class='field'><label>الميزانية اليومية</label><input name='dailyRate' type='number' min='0' step='0.01' required value='" + value('Daily Rate') + "'></div>",
      "<div class='field'><label>معامل التكلفة</label><input name='costRate' type='number' min='0' step='0.0001' value='" + value('Cost Rate') + "' placeholder='" + esc(adSettings['Default Cost Rate']) + "'></div>",
      "<div class='field'><label>نسبة العمولة</label><input name='commissionRate' type='number' min='0' step='0.0001' value='" + value('Commission Rate') + "' placeholder='" + esc(adSettings['Default Commission Rate']) + "'></div>",
      "<div class='field'><label>سعر البيع اليدوي (اختياري)</label><input name='salePrice' type='number' min='0' step='0.01' value='" + value('Sale Price') + "'></div>",
      "<div class='field'><label>الحساب البنكي</label><select name='bankAccountId'>" + accountOptions + "</select></div>",
      "<div class='field'><label>الحالة</label><select name='status'>" +
        ['DRAFT','ACTIVE','ON_AIR','PAUSED'].map(name => option(name,name,name === (ad.Status || 'DRAFT'))).join('') +
      "</select></div>",
      "<div class='field'><label>حالة الدفع</label><select name='paymentStatus'>" +
        ['UNPAID','PARTIALLY_PAID','PAID'].map(name => option(name,name,name === (ad['Payment Status'] || 'UNPAID'))).join('') +
      "</select></div>",
      "<div class='field wide'><label class='check-row'><input name='autoDebit' type='checkbox'" + (truthy(ad['Auto Debit']) ? ' checked' : '') + "> خصم بنكي تلقائي</label></div>",
      "<div class='field wide'><label>تفاصيل ومتطلبات العميل</label><textarea name='clientRequirements'>" + esc(ad['Client Requirements'] || '') + "</textarea></div>",
      "<div id='ad-preview' class='wide grid three'></div>",
      "<div id='profit-warning' class='wide'></div>",
      "<div class='field wide' id='override-field' hidden><label>سبب تجاوز حد الربح</label><textarea name='overrideReason'>" + esc(ad['Override Reason'] || '') + "</textarea></div>",
      "<div class='wide actions'><button class='btn btn-primary' type='submit'>" + (ad['Ad ID'] ? 'حفظ تعديلات الإعلان' : 'حفظ الإعلان والقيد') + "</button></div>",
      "</form>"
    ].join('');
  }

  function bindProjectSelect(form) {
    const client = form.elements.clientId;
    const project = form.elements.projectId;
    const refresh = () => {
      Array.from(project.options).forEach(item => {
        if (!item.value) return;
        const visible = item.dataset.client === client.value;
        item.hidden = !visible;
        item.disabled = !visible;
      });
      if (project.selectedOptions[0] && project.selectedOptions[0].disabled) project.value = '';
    };
    client.addEventListener('change', refresh);
    refresh();
  }

  function bindPreview(modal, form) {
    const update = () => {
      const values = UI.formData(form);
      const result = calculate(values);
      modal.querySelector('#ad-preview').innerHTML =
        UI.metric('الإنفاق الأساسي', UI.money(result.baseSpend)) +
        UI.metric('الخصم البنكي', UI.money(result.bankDebit)) +
        UI.metric('سعر البيع', UI.money(result.salePrice)) +
        UI.metric('التكلفة الداخلية', UI.money(result.internalCost)) +
        UI.metric('العمولة', UI.money(result.commission)) +
        UI.metric('الربح', UI.money(result.profit), UI.number(result.margin) + '%');
      modal.querySelector('#profit-warning').innerHTML = result.below ? "<div class='alert danger'>الربح أقل من الحد المسموح. اكتب سبب التجاوز قبل الحفظ.</div>" : '';
      modal.querySelector('#override-field').hidden = !result.below;
      modal.querySelector('[name=overrideReason]').required = result.below;
    };
    form.addEventListener('input', update);
    update();
  }

  function openEditor(ad, context, reload) {
    const modal = UI.modal(ad ? 'تعديل الإعلان' : 'إعلان ممول جديد', adForm(ad, context.clients, context.projects, context.accounts));
    const form = modal.querySelector('form');
    bindProjectSelect(form);
    bindPreview(modal, form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      UI.submit(form, async data => {
        data.autoDebit = form.elements.autoDebit.checked;
        if (ad) {
          data.adId = ad['Ad ID'];
          await API.put('ads', data);
          UI.toast('تم تحديث الإعلان والقيود المرتبطة.');
        } else {
          await API.post('ads', data);
          UI.toast('تم حفظ الإعلان وإنشاء قيد العميل.');
        }
        modal.remove();
        await reload();
      });
    });
  }

  function actions(_, row) {
    const archived = truthy(row.Archived);
    const cancelled = row.Status === 'CANCELLED';
    return [
      "<div class='table-actions'>",
      !archived && !cancelled ? "<button class='btn' data-ad-edit='" + esc(row['Ad ID']) + "'>تعديل</button>" : '',
      "<button class='btn' data-ad-archive='" + esc(row['Ad ID']) + "' data-archived='" + (archived ? '0' : '1') + "'>" + (archived ? 'استعادة' : 'أرشفة') + "</button>",
      !cancelled ? "<button class='btn danger-button' data-ad-cancel='" + esc(row['Ad ID']) + "'>إلغاء</button>" : '',
      "</div>"
    ].join('');
  }

  async function load() {
    const query = showArchived ? { includeArchived:true } : {};
    const results = await Promise.all([
      API.get('ads', query),
      API.get('ads.settings'),
      API.get('clients').catch(() => ({ clients:[] })),
      API.get('projects').catch(() => ({ projects:[] })),
      API.get('bank.accounts').catch(() => ({ accounts:[] }))
    ]);
    const ads = results[0].ads || [];
    adSettings = results[1].settings || {};
    const context = {
      clients: results[2].clients || [],
      projects: results[3].projects || [],
      accounts: results[4].accounts || []
    };
    UI.setMain(
      "<section class='grid metrics'>" +
        UI.metric('عدد الإعلانات', UI.number(ads.length)) +
        UI.metric('قيمة البيع', UI.money(ads.reduce((sum,row) => sum + Number(row['Sale Price'] || 0),0))) +
        UI.metric('الربح', UI.money(ads.reduce((sum,row) => sum + Number(row.Profit || 0),0))) +
        UI.metric('تحت حد الربح', UI.number(ads.filter(row => Number(row.Profit) < Number(row['Minimum Profit Amount']) || Number(row['Profit Margin']) < Number(row['Minimum Profit Margin'])).length)) +
      "</section>" +
      "<section class='card'><div class='card-header'><div><h2>الإعلانات الممولة</h2><p class='muted'>كل إعلان مرتبط بعميل ومشروع، مع تعديل وأرشفة وإلغاء موثق دون فقد القيود المالية.</p></div><div class='actions'>" +
        "<button class='btn' id='toggle-ad-archive'>" + (showArchived ? 'إخفاء الأرشيف' : 'عرض الأرشيف') + "</button>" +
        (context.clients.length && context.projects.length ? "<button class='btn btn-primary' id='new-ad'>إعلان جديد</button>" : '') +
      "</div></div>" +
      UI.table(ads, [
        { key:'Ad Name', label:'الإعلان' },
        { key:'Client Name', label:'العميل' },
        { key:'Project Name', label:'المشروع' },
        { key:'Platform', label:'المنصة' },
        { key:'Daily Rate', label:'يوميًا', render:UI.money },
        { key:'Sale Price', label:'سعر البيع', render:UI.money },
        { key:'Profit', label:'الربح', render:UI.money },
        { key:'Status', label:'الحالة', render:UI.badge },
        { key:'Ad ID', label:'الإجراءات', render:actions }
      ]) +
      "</section>"
    );

    const reload = () => load();
    document.querySelector('#toggle-ad-archive').addEventListener('click', () => { showArchived = !showArchived; load(); });
    document.querySelector('#new-ad')?.addEventListener('click', () => openEditor(null, context, reload));
    document.querySelectorAll('[data-ad-edit]').forEach(button => button.addEventListener('click', () => {
      openEditor(ads.find(row => row['Ad ID'] === button.dataset.adEdit), context, reload);
    }));
    document.querySelectorAll('[data-ad-archive]').forEach(button => button.addEventListener('click', async () => {
      try {
        button.disabled = true;
        await API.post('ads.archive', { adId:button.dataset.adArchive, archived:button.dataset.archived === '1' });
        UI.toast(button.dataset.archived === '1' ? 'تمت أرشفة الإعلان.' : 'تمت استعادة الإعلان.');
        await reload();
      } catch (error) {
        UI.toast(error.message,'error');
        button.disabled = false;
      }
    }));
    document.querySelectorAll('[data-ad-cancel]').forEach(button => button.addEventListener('click', () => {
      const modal = UI.modal('إلغاء الإعلان', "<form class='form-grid'><div class='field wide'><label>سبب الإلغاء</label><textarea name='cancellationReason' required></textarea></div><div class='field'><label>مبلغ الاسترداد البنكي (إن وجد)</label><input name='refundAmount' type='number' min='0' step='0.01' value='0'></div><div class='wide actions'><button class='btn danger-button' type='submit'>تأكيد الإلغاء</button></div></form>");
      const form = modal.querySelector('form');
      form.addEventListener('submit', event => {
        event.preventDefault();
        UI.submit(form, async data => {
          data.adId = button.dataset.adCancel;
          await API.post('ads.cancel', data);
          UI.toast('تم إلغاء الإعلان مع الاحتفاظ بالأثر المحاسبي.');
          modal.remove();
          await reload();
        });
      });
    }));
  }

  ANCPageModules.ads = { load };
})();