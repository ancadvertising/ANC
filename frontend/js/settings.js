(() => {
  const esc = UI.escape;
  const truthy = value => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
  const primary = user => user.userType === 'ADMIN' || ['ADMIN','MANAGER'].includes(String(user.role || '').toUpperCase());
  const pages = ['dashboard','clients','projects','orders','ads','studio','tasks','finance','banking','reports','documents','employees','approvals','audit','settings'];
  const portals = ['ADMIN','EMPLOYEE','CLIENT'];
  const input = (label,name,value,type='text',attrs='') => `<div class="field"><label>${esc(label)}</label><input name="${esc(name)}" type="${type}" value="${esc(value ?? '')}" ${attrs}></div>`;
  const select = (label,name,value,options) => `<div class="field"><label>${esc(label)}</label><select name="${esc(name)}">${options.map(([key,title]) => `<option value="${esc(key)}"${String(key) === String(value) ? ' selected' : ''}>${esc(title)}</option>`).join('')}</select></div>`;

  function generalForm(data,editable) {
    const settings = data.settings || {};
    const ads = data.adSettings || {};
    const accounts = data.bankAccounts || [];
    return `<form class="settings-form">
      ${!editable ? '<div class="alert">هذه الإعدادات للعرض فقط. الحفظ متاح للمدير الأساسي.</div>' : ''}
      <section class="card settings-section"><div class="card-header"><div><h2>هوية الشركة والفواتير</h2><p class="muted">البيانات والهوية المستخدمة في الواجهة وملفات PDF.</p></div></div><div class="form-grid">
        ${input('اسم الشركة','Company Name',settings['Company Name'])}
        ${input('الاسم القانوني','Company Legal Name',settings['Company Legal Name'])}
        ${input('البريد المالي','Company Email',settings['Company Email'],'email')}
        ${input('الهاتف','Company Phone',settings['Company Phone'])}
        ${input('العنوان','Company Address',settings['Company Address'])}
        ${input('بادئة الفاتورة','Invoice Prefix',settings['Invoice Prefix'])}
        ${select('العملة الافتراضية','Default Currency',settings['Default Currency'],[['EGP','EGP'],['USD','USD'],['SAR','SAR']])}
        ${input('ضريبة الفاتورة %','Invoice Tax Rate',settings['Invoice Tax Rate'],'number','min="0" max="100" step="0.01"')}
        ${input('مهلة السداد بالأيام','Payment Terms Days',settings['Payment Terms Days'],'number','min="0" max="365"')}
        <div class="field wide"><label>تذييل الفاتورة</label><textarea name="Invoice Footer">${esc(settings['Invoice Footer'] || '')}</textarea></div>
      </div></section>
      <section class="card settings-section"><div class="card-header"><div><h2>اللغة والهوية البصرية</h2><p class="muted">تخصيص المنصة للشركة مع أرقام إنجليزية دائماً.</p></div></div><div class="form-grid">
        ${select('اللغة الافتراضية','Default Interface Language',settings['Default Interface Language'] || 'ar',[['ar','العربية'],['en','English']])}
        ${input('اللون الأساسي','Primary Brand Color',settings['Primary Brand Color'],'color')}
        ${input('اللون الثانوي','Secondary Brand Color',settings['Secondary Brand Color'],'color')}
        ${input('رابط شعار الشركة','Company Logo URL',settings['Company Logo URL'],'url')}
        ${input('الدومين المخصص','Custom Domain',settings['Custom Domain'],'text','placeholder="erp.example.com"')}
        <div class="field"><label>حالة الدومين</label><input disabled value="${esc(settings['Custom Domain Status'] || 'NOT_CONFIGURED')}"></div>
      </div><div class="alert">ربط الدومين النهائي يتطلب إضافة Custom Domain إلى Cloudflare Worker وDNS. الحقل هنا يحفظ الدومين المطلوب ويعرضه للمراجعة قبل الربط.</div></section>
      <section class="card settings-section"><div class="card-header"><div><h2>إعدادات الإعلانات الممولة</h2><p class="muted">النسب الافتراضية وحدود الربح والحساب البنكي.</p></div></div><div class="form-grid">
        ${input('معامل التكلفة','Default Cost Rate',ads['Default Cost Rate'],'number','min="0" step="0.0001"')}
        ${input('نسبة العمولة','Default Commission Rate',ads['Default Commission Rate'],'number','min="0" step="0.0001"')}
        ${input('الحد الأدنى للربح','Minimum Profit Amount',ads['Minimum Profit Amount'],'number','min="0" step="0.01"')}
        ${input('الحد الأدنى لهامش الربح %','Minimum Profit Margin',ads['Minimum Profit Margin'],'number','min="0" max="100" step="0.01"')}
        ${select('الحساب البنكي الافتراضي','Default Bank Account',ads['Default Bank Account'],[['','بدون حساب افتراضي'],...accounts.map(row => [row['Bank Account ID'],row['Account Name']])])}
        <div class="field"><label class="check-row"><input name="Allow Negative Bank Balance" type="checkbox"${truthy(ads['Allow Negative Bank Balance']) ? ' checked' : ''}> السماح برصيد بنكي سالب</label></div>
      </div></section>
      ${editable ? '<div class="sticky-form-actions"><button class="btn btn-primary" type="submit">حفظ الإعدادات</button></div>' : ''}
    </form>`;
  }

  function healthSection(health) {
    if (!health) return '';
    return `<section class="card settings-section"><div class="card-header"><div><h2>حالة النظام</h2><p class="muted">قياسات حقيقية من Worker وD1 في بيئة staging.</p></div>${UI.badge(health.status)}</div>
      <div class="health-grid">
        <div class="health-item"><span>طلبات آخر ساعة</span><strong>${UI.number(health.workers.requestsLastHour)}</strong></div>
        <div class="health-item"><span>متوسط الاستجابة</span><strong>${UI.number(health.workers.averageLatencyMs)} ms</strong></div>
        <div class="health-item"><span>أخطاء آخر 24 ساعة</span><strong>${UI.number(health.workers.errorsLast24Hours)}</strong></div>
        <div class="health-item"><span>طلبات اعتماد معلقة</span><strong>${UI.number(health.approvals.pending)}</strong></div>
      </div>${health.warnings?.length ? `<div class="alert warning">${health.warnings.map(item => esc(item.code)).join(' · ')}</div>` : '<div class="alert success">لا توجد تحذيرات حالية.</div>'}</section>`;
  }

  function labelsSection(labels) {
    return `<section class="card settings-section"><div class="card-header"><div><h2>تصنيفات الملاحظات</h2><p class="muted">السوبر أدمن فقط يمكنه إنشاء وتلوين التصنيفات.</p></div></div>
      <div class="label-admin-list">${labels.map(label => `<span class="note-label" style="--label-color:${esc(label.Color)}">${esc(label['Name Ar'])} / ${esc(label['Name En'])}</span>`).join('') || '<span class="muted">لا توجد تصنيفات.</span>'}</div>
      <form class="form-grid label-form">${input('الاسم بالعربية','nameAr','')}${input('English name','nameEn','')}${input('اللون','color','#a8f025','color')}<div class="field actions"><button class="btn btn-primary" type="submit">إضافة التصنيف</button></div></form></section>`;
  }

  function notificationsSection(notifications) {
    return `<section class="card settings-section"><div class="card-header"><div><h2>الإشعارات المنبثقة</h2><p class="muted">إرسال تنبيه للموظفين أو العملاء أو الجميع.</p></div></div>
      <form class="form-grid notification-form">
        ${input('العنوان بالعربية','titleAr','')}${input('English title','titleEn','')}
        <div class="field wide"><label>الرسالة بالعربية</label><textarea name="messageAr" required></textarea></div>
        <div class="field wide"><label>English message</label><textarea name="messageEn" required></textarea></div>
        ${select('الجمهور','audience','ALL',[['ALL','الجميع'],['EMPLOYEES','الموظفون'],['CLIENTS','العملاء']])}
        ${select('التكرار','frequency','ONCE',[['ONCE','مرة واحدة'],['EVERY_SESSION','كل جلسة']])}
        <div class="field"><label class="check-row"><input name="requiresAck" type="checkbox"> يتطلب موافقة إلزامية</label></div>
        <div class="field actions"><button class="btn btn-primary" type="submit">إرسال الإشعار</button></div>
      </form>
      ${UI.table(notifications.slice(0,10),[{key:'Title Ar',label:'العنوان'},{key:'Audience',label:'الجمهور',render:UI.badge},{key:'Frequency',label:'التكرار',render:UI.badge},{key:'Requires Ack',label:'موافقة',render:UI.badge},{key:'Created At',label:'التاريخ',render:UI.date},{key:'Notification ID',label:'الإجراءات',render:(value) => `<button class="btn btn-danger btn-sm" type="button" data-notification-delete="${esc(value)}">حذف</button>`}])}
    </section>`;
  }

  function policiesSection(policies) {
    const map = new Map(policies.map(item => [`${item['Page Key']}:${item.Portal}`,item]));
    return `<section class="card settings-section"><div class="card-header"><div><h2>صلاحيات الصفحات والبورتالات</h2><p class="muted">تحكم في الظهور ومستوى الوصول لكل بورتال.</p></div></div><div class="policy-grid">
      <div class="policy-row"><strong>الصفحة</strong>${portals.map(portal => `<strong>${portal}</strong>`).join('')}</div>
      ${pages.map(page => `<div class="policy-row"><strong>${esc(page)}</strong>${portals.map(portal => {
        const item = map.get(`${page}:${portal}`) || {};
        const forcedHidden = page === 'documents' && portal !== 'ADMIN';
        return `<div><select data-policy-visibility data-page="${page}" data-portal="${portal}"${forcedHidden ? ' disabled' : ''}><option value="VISIBLE"${!forcedHidden && item.Visibility !== 'HIDDEN' ? ' selected' : ''}>ظاهر</option><option value="HIDDEN"${forcedHidden || item.Visibility === 'HIDDEN' ? ' selected' : ''}>مخفي</option></select><select data-policy-access data-page="${page}" data-portal="${portal}"><option value="READ_ONLY"${item['Access Level'] !== 'FULL_ACCESS' ? ' selected' : ''}>قراءة فقط</option><option value="FULL_ACCESS"${item['Access Level'] === 'FULL_ACCESS' ? ' selected' : ''}>وصول كامل</option></select></div>`;
      }).join('')}</div>`).join('')}
      <div class="actions"><button class="btn btn-primary" id="save-page-policies">حفظ سياسات الصفحات</button></div>
    </div></section>`;
  }

  async function load(currentUser) {
    const editable = primary(currentUser);
    const [data,health,labelsData,notificationsData,policiesData] = await Promise.all([
      API.get('system.settings'),
      editable ? API.get('system.health').catch(() => null) : null,
      API.get('note.labels',{includeInactive:editable}).catch(() => ({labels:[]})),
      editable ? API.get('notifications.manage').catch(() => ({notifications:[]})) : {notifications:[]},
      API.get('page.policies').catch(() => ({policies:[]}))
    ]);
    UI.setMain(`<section class="grid metrics">${UI.metric('العملة',data.settings['Default Currency'] || 'EGP')}${UI.metric('ضريبة الفاتورة',UI.number(data.settings['Invoice Tax Rate']) + '%')}${UI.metric('مهلة السداد',UI.number(data.settings['Payment Terms Days']) + ' يوم')}${UI.metric('حد الربح',UI.money(data.adSettings['Minimum Profit Amount']))}</section>
      ${generalForm(data,editable)}${editable ? healthSection(health) + labelsSection(labelsData.labels || []) + notificationsSection(notificationsData.notifications || []) + policiesSection(policiesData.policies || []) : ''}`);
    if (!editable) document.querySelectorAll('.settings-form input,.settings-form textarea,.settings-form select').forEach(control => control.disabled = true);
    if (!editable) return;

    const form = document.querySelector('.settings-form');
    form.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(form,async values => {
        const systemKeys = ['Company Name','Company Legal Name','Company Email','Company Phone','Company Address','Invoice Prefix','Invoice Tax Rate','Payment Terms Days','Invoice Footer','Default Currency','Default Interface Language','Primary Brand Color','Secondary Brand Color','Company Logo URL','Custom Domain'];
        const adKeys = ['Default Cost Rate','Default Commission Rate','Minimum Profit Amount','Minimum Profit Margin','Default Bank Account'];
        const system = Object.fromEntries(systemKeys.map(key => [key,values[key] ?? '']));
        const ad = Object.fromEntries(adKeys.map(key => [key,values[key] ?? '']));
        ad['Allow Negative Bank Balance'] = form.elements['Allow Negative Bank Balance'].checked ? 'TRUE' : 'FALSE';
        ad['Default Currency'] = system['Default Currency'];
        await Promise.all([API.put('system.settings',system),API.post('ads.settings',ad)]);
        localStorage.setItem('anc-erp-language',system['Default Interface Language']);
        document.documentElement.style.setProperty('--accent',system['Primary Brand Color']);
        UI.toast('تم حفظ إعدادات المنصة.');
        await load(currentUser);
      });
    });

    const labelForm = document.querySelector('.label-form');
    labelForm.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(labelForm,async values => { await API.post('note.labels',values); UI.toast('تمت إضافة التصنيف.'); await load(currentUser); });
    });
    const notificationForm = document.querySelector('.notification-form');
    notificationForm.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(notificationForm,async values => { values.requiresAck = notificationForm.elements.requiresAck.checked; await API.post('notifications',values); UI.toast('تم إنشاء الإشعار.'); await load(currentUser); });
    });
    document.querySelectorAll('[data-notification-delete]').forEach(button => {
      button.addEventListener('click', async event => {
        event.preventDefault();
        const notificationId = button.dataset.notificationDelete;
        if (!window.confirm('هل تريد حذف هذا الإشعار نهائيًا؟')) return;
        button.disabled = true;
        try {
          await API.delete('notifications', { notificationId });
          UI.toast('تم حذف الإشعار.');
          await load(currentUser);
        } catch (error) {
          button.disabled = false;
          UI.toast(error.message, 'error');
        }
      });
    });
    document.querySelector('#save-page-policies').addEventListener('click',async event => {
      event.preventDefault();
      const updates = [...document.querySelectorAll('[data-policy-visibility]')].map(visibility => {
        const access = document.querySelector(`[data-policy-access][data-page="${visibility.dataset.page}"][data-portal="${visibility.dataset.portal}"]`);
        return {pageKey:visibility.dataset.page,portal:visibility.dataset.portal,visibility:visibility.value,accessLevel:access.value};
      });
      try { await Promise.all(updates.map(update => API.put('page.policies',update))); UI.toast('تم حفظ سياسات الصفحات.'); window.location.reload(); }
      catch (error) { UI.toast(error.message,'error'); }
    });
  }

  ANCPageModules.settings = { load };
})();