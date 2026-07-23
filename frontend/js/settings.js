(() => {
  const esc = UI.escape;
  const truthy = value => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
  const field = (label,name,value,type,extra) => "<div class='field" + (extra && extra.wide ? ' wide' : '') + "'><label>" + esc(label) + "</label><input name='" + esc(name) + "' type='" + esc(type || 'text') + "' value='" + esc(value || '') + "'" + (extra && extra.step ? " step='" + esc(extra.step) + "'" : '') + (extra && extra.min !== undefined ? " min='" + esc(extra.min) + "'" : '') + (extra && extra.max !== undefined ? " max='" + esc(extra.max) + "'" : '') + "></div>";

  function formHtml(data, editable) {
    const settings = data.settings || {};
    const ads = data.adSettings || {};
    const accounts = data.bankAccounts || [];
    const disabled = editable ? '' : 'disabled ';
    const bankOptions = ["<option value=''>بدون حساب افتراضي</option>"].concat(accounts.map(row => "<option value='" + esc(row['Bank Account ID']) + "'" + (row['Bank Account ID'] === ads['Default Bank Account'] ? ' selected' : '') + ">" + esc(row['Account Name']) + "</option>")).join('');
    return [
      "<form class='settings-form'>",
      !editable ? "<div class='alert'>لديك صلاحية عرض الإعدادات فقط. الحفظ متاح للمدير الأساسي.</div>" : '',
      "<section class='card settings-section'><div class='card-header'><div><h2>هوية الشركة والفواتير</h2><p class='muted'>تظهر هذه البيانات تلقائيًا في ملفات PDF والمستندات المالية.</p></div></div><div class='form-grid'>",
      field('اسم العلامة','Company Name',settings['Company Name']),
      field('الاسم القانوني','Company Legal Name',settings['Company Legal Name']),
      field('البريد المالي','Company Email',settings['Company Email'],'email'),
      field('رقم الهاتف','Company Phone',settings['Company Phone']),
      field('العنوان','Company Address',settings['Company Address']),
      field('بادئة الفاتورة','Invoice Prefix',settings['Invoice Prefix']),
      field('العملة الافتراضية','Default Currency',settings['Default Currency']),
      field('ضريبة الفاتورة %','Invoice Tax Rate',settings['Invoice Tax Rate'],'number',{step:'0.01',min:0,max:100}),
      field('مهلة السداد بالأيام','Payment Terms Days',settings['Payment Terms Days'],'number',{min:0,max:365}),
      "<div class='field wide'><label>ملاحظة تذييل الفاتورة</label><textarea name='Invoice Footer'>" + esc(settings['Invoice Footer'] || '') + "</textarea></div>",
      "</div></section>",
      "<section class='card settings-section'><div class='card-header'><div><h2>إعدادات الإعلانات الممولة</h2><p class='muted'>القيم الافتراضية للحساب وحد الربح، ويمكن تجاوزها داخل الإعلان مع تسجيل السبب.</p></div></div><div class='form-grid'>",
      field('معامل التكلفة الافتراضي','Default Cost Rate',ads['Default Cost Rate'],'number',{step:'0.0001',min:0}),
      field('نسبة العمولة الافتراضية','Default Commission Rate',ads['Default Commission Rate'],'number',{step:'0.0001',min:0}),
      field('الحد الأدنى للربح','Minimum Profit Amount',ads['Minimum Profit Amount'],'number',{step:'0.01',min:0}),
      field('الحد الأدنى لهامش الربح %','Minimum Profit Margin',ads['Minimum Profit Margin'],'number',{step:'0.01',min:0,max:100}),
      "<div class='field'><label>الحساب البنكي الافتراضي</label><select name='Default Bank Account'>" + bankOptions + "</select></div>",
      "<div class='field'><label class='check-row'><input name='Allow Negative Bank Balance' type='checkbox'" + (truthy(ads['Allow Negative Bank Balance']) ? ' checked' : '') + "> السماح برصيد بنكي سالب</label></div>",
      "</div></section>",
      editable ? "<div class='sticky-form-actions'><button class='btn btn-primary' type='submit'>حفظ جميع الإعدادات</button></div>" : '',
      "</form>"
    ].join('').replaceAll('<input ', '<input ' + disabled).replaceAll('<textarea ', '<textarea ' + disabled).replaceAll('<select ', '<select ' + disabled);
  }

  async function load(currentUser) {
    const data = await API.get('system.settings');
    const role = String(currentUser.role || '').toUpperCase();
    const editable = currentUser.userType === 'ADMIN' || role === 'ADMIN' || role === 'MANAGER';
    UI.setMain(
      "<section class='grid metrics'>" +
        UI.metric('العملة',data.settings['Default Currency'] || 'EGP') +
        UI.metric('ضريبة الفاتورة',UI.number(data.settings['Invoice Tax Rate']) + '%') +
        UI.metric('مهلة السداد',UI.number(data.settings['Payment Terms Days']) + ' يوم') +
        UI.metric('حد الربح',UI.money(data.adSettings['Minimum Profit Amount'])) +
      "</section>" +
      formHtml(data,editable)
    );
    if (!editable) return;
    const form = document.querySelector('.settings-form');
    form.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(form,async values => {
        const systemKeys = ['Company Name','Company Legal Name','Company Email','Company Phone','Company Address','Invoice Prefix','Invoice Tax Rate','Payment Terms Days','Invoice Footer','Default Currency'];
        const adKeys = ['Default Cost Rate','Default Commission Rate','Minimum Profit Amount','Minimum Profit Margin','Default Bank Account'];
        const system = Object.fromEntries(systemKeys.map(key => [key,values[key] ?? '']));
        const ad = Object.fromEntries(adKeys.map(key => [key,values[key] ?? '']));
        ad['Allow Negative Bank Balance'] = form.elements['Allow Negative Bank Balance'].checked ? 'TRUE' : 'FALSE';
        ad['Default Currency'] = system['Default Currency'];
        await Promise.all([API.put('system.settings',system),API.post('ads.settings',ad)]);
        UI.toast('تم حفظ إعدادات المنصة والفواتير والإعلانات.');
        await load(currentUser);
      });
    });
  }

  ANCPageModules.settings = { load };
})();