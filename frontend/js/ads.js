(() => {
  let settings = {};
  function calculate(data) {
    const days = Number(data.days) || 0;
    const dailyRate = Number(data.dailyRate) || 0;
    const costRate = data.costRate === '' ? Number(settings['Default Cost Rate'] || 1.19) : Number(data.costRate || 0);
    const commissionRate = data.commissionRate === '' ? Number(settings['Default Commission Rate'] || .2997) : Number(data.commissionRate || 0);
    const baseSpend = days * dailyRate;
    const internalCost = baseSpend * costRate;
    const commission = baseSpend * commissionRate;
    const salePrice = data.salePrice === '' ? baseSpend + internalCost + commission : Number(data.salePrice || 0);
    const bankDebit = baseSpend + internalCost;
    const profit = salePrice - bankDebit;
    const margin = salePrice ? profit / salePrice * 100 : 0;
    const minAmount = Number(settings['Minimum Profit Amount'] || 300);
    const minMargin = Number(settings['Minimum Profit Margin'] || 0);
    return { baseSpend, internalCost, commission, salePrice, bankDebit, profit, margin, below: profit < minAmount || margin < minMargin };
  }
  function form(clients, accounts) {
    return `<form id="ad-form" class="form-grid"><div class="field"><label>العميل</label><select name="clientId" required><option value="">اختر</option>${clients.map(row => `<option value="${UI.escape(row['Client ID'])}">${UI.escape(row['Client Name'])}</option>`).join('')}</select></div><div class="field"><label>اسم الإعلان</label><input name="adName" required></div><div class="field"><label>المنصة</label><select name="platform"><option>Meta</option><option>Google</option><option>TikTok</option><option>LinkedIn</option><option>Snapchat</option></select></div><div class="field"><label>الفترة</label><input name="period" placeholder="مثال: أغسطس 2026"></div><div class="field"><label>عدد الأيام</label><input name="days" type="number" min="1" required></div><div class="field"><label>الميزانية اليومية</label><input name="dailyRate" type="number" min="0" step="0.01" required></div><div class="field"><label>معامل التكلفة</label><input name="costRate" type="number" min="0" step="0.0001" placeholder="${UI.escape(settings['Default Cost Rate'])}"></div><div class="field"><label>نسبة العمولة</label><input name="commissionRate" type="number" min="0" step="0.0001" placeholder="${UI.escape(settings['Default Commission Rate'])}"></div><div class="field"><label>سعر البيع اليدوي (اختياري)</label><input name="salePrice" type="number" min="0" step="0.01"></div><div class="field"><label>الحساب البنكي</label><select name="bankAccountId"><option value="">بدون حساب</option>${accounts.map(row => `<option value="${UI.escape(row['Bank Account ID'])}">${UI.escape(row['Account Name'])} — ${UI.money(row['Current Balance'])}</option>`).join('')}</select></div><div class="field"><label>الحالة</label><select name="status"><option>DRAFT</option><option>ACTIVE</option><option>ON_AIR</option><option>PAUSED</option></select></div><div class="field"><label>حالة الدفع</label><select name="paymentStatus"><option>UNPAID</option><option>PARTIALLY_PAID</option><option>PAID</option></select></div><div class="field wide"><label><input name="autoDebit" type="checkbox"> خصم بنكي تلقائي</label></div><div class="field wide"><label>متطلبات العميل</label><textarea name="clientRequirements"></textarea></div><div id="ad-preview" class="wide grid three"></div><div id="profit-warning" class="wide"></div><div class="field wide" id="override-field" hidden><label>سبب تجاوز حد الربح</label><textarea name="overrideReason"></textarea></div><div class="wide actions"><button class="btn btn-primary" type="submit">حفظ الإعلان والقيد</button></div></form>`;
  }
  async function load() {
    const [{ ads }, settingsResult, { clients }] = await Promise.all([API.get('ads'), API.get('ads.settings'), API.get('clients').catch(() => ({ clients: [] }))]);
    settings = settingsResult.settings;
    let accounts = [];
    try { accounts = (await API.get('bank.accounts')).accounts; } catch {}
    UI.setMain(`<section class="grid metrics">${UI.metric('عدد الإعلانات', UI.number(ads.length))}${UI.metric('قيمة البيع', UI.money(ads.reduce((s,row) => s + Number(row['Sale Price'] || 0),0)))}${UI.metric('الربح', UI.money(ads.reduce((s,row) => s + Number(row.Profit || 0),0)))}${UI.metric('تحت حد الربح', UI.number(ads.filter(row => Number(row.Profit) < Number(row['Minimum Profit Amount'])).length))}</section><section class="card"><div class="card-header"><div><h2>الإعلانات الممولة</h2><p class="muted">المعادلات والقيود تُعاد مراجعتها في الخادم.</p></div>${clients.length ? '<button class="btn btn-primary" id="new-ad">إعلان جديد</button>' : ''}</div>${UI.table(ads, [{key:'Ad Name',label:'الإعلان'},{key:'Platform',label:'المنصة'},{key:'Days',label:'الأيام'},{key:'Daily Rate',label:'يوميًا',render:UI.money},{key:'Sale Price',label:'سعر البيع',render:UI.money},{key:'Profit',label:'الربح',render:UI.money},{key:'Profit Margin',label:'الهامش',render:v => `${UI.number(v)}%`},{key:'Status',label:'الحالة',render:UI.badge}])}</section>`);
    document.querySelector('#new-ad')?.addEventListener('click', () => {
      const modal = UI.modal('إعلان ممول جديد', form(clients, accounts));
      const target = modal.querySelector('form');
      const updatePreview = () => {
        const values = UI.formData(target); const c = calculate(values);
        modal.querySelector('#ad-preview').innerHTML = UI.metric('Base Spend',UI.money(c.baseSpend))+UI.metric('Bank Debit',UI.money(c.bankDebit))+UI.metric('Sale Price',UI.money(c.salePrice))+UI.metric('Internal Cost',UI.money(c.internalCost))+UI.metric('Commission',UI.money(c.commission))+UI.metric('Profit',UI.money(c.profit),`${UI.number(c.margin)}%`);
        modal.querySelector('#profit-warning').innerHTML = c.below ? '<div class="alert danger">الربح تحت الحد. يجب كتابة سبب التجاوز.</div>' : '';
        modal.querySelector('#override-field').hidden = !c.below;
        modal.querySelector('[name="overrideReason"]').required = c.below;
      };
      target.addEventListener('input', updatePreview); updatePreview();
      target.addEventListener('submit', event => { event.preventDefault(); UI.submit(target, async data => { await API.post('ads', data); UI.toast('تم حفظ الإعلان وإنشاء قيد العميل.'); modal.remove(); load(); }); });
    });
  }
  ANCPageModules.ads = { load };
})();
