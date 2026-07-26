(() => {
  const esc = UI.escape;
  const upper = value => String(value || '').toUpperCase();
  const management = user => user.userType === 'ADMIN' || ['ADMIN','MANAGER','ASSISTANT_MANAGER'].includes(upper(user.role));

  function option(value,label) {
    return `<option value="${esc(value)}">${esc(label)}</option>`;
  }

  function requestForm(projects) {
    return `<form class="form-grid request-create-form">
      <div class="field wide"><label>عنوان الطلب</label><input name="title" required maxlength="200"></div>
      <div class="field"><label>نوع الخدمة</label><select name="serviceType"><option value="PAID_ADS">إعلانات ممولة</option><option value="STUDIO">استوديو وإنتاج</option><option value="DESIGN">تصميم</option><option value="OTHER">أخرى</option></select></div>
      <div class="field"><label>المشروع</label><select name="projectId"><option value="">بدون مشروع محدد</option>${projects.map(row => option(row['Project ID'],row['Project Name'])).join('')}</select></div>
      <div class="field wide"><label>التفاصيل المطلوبة</label><textarea name="description" required maxlength="5000"></textarea></div>
      <div class="wide actions"><button class="btn btn-primary" type="submit">إرسال الطلب</button></div>
    </form>`;
  }

  function replyForm(canQuote) {
    return `<form class="form-grid request-reply-form">
      <div class="field wide"><label>الرد</label><textarea name="body" required maxlength="5000"></textarea></div>
      ${canQuote ? `<div class="field"><label>نوع الرد</label><select name="messageType"><option value="MESSAGE">رسالة</option><option value="QUOTATION">عرض سعر</option></select></div>
      <div class="field quotation-field" hidden><label>قيمة العرض</label><input name="quotationAmount" type="number" min="0" step="0.01"></div>
      <div class="field quotation-field" hidden><label>العملة</label><select name="quotationCurrency"><option>EGP</option><option>USD</option><option>SAR</option></select></div>
      <div class="field quotation-field" hidden><label>صالح حتى</label><input name="quotationValidUntil" type="date"></div>` : ''}
      <div class="wide actions"><button class="btn btn-primary" type="submit">إرسال الرد</button></div>
    </form>`;
  }

  function actions(_,row,user) {
    const unread = user.userType === 'CLIENT' ? Number(row['Client Unread']) : Number(row['Admin Unread']);
    return `<div class="table-actions">${unread ? '<span class="request-unread" title="رد جديد"></span>' : ''}<button class="btn" data-request-open="${esc(row['Request ID'])}">عرض المحادثة</button></div>`;
  }

  async function openThread(requestId,user,reload) {
    const data = await API.get('service.request',{requestId});
    const request = data.request;
    const messages = data.messages || [];
    const body = `<div class="request-thread">
      <article class="request-message is-client"><strong>${esc(request.Title)}</strong><p>${esc(request.Description)}</p><small>${UI.date(request['Created At'])}</small></article>
      ${messages.map(message => `<article class="request-message ${message['Sender Type'] === 'CLIENT' ? 'is-client' : 'is-admin'}"><strong>${esc(message['Sender Name'])}</strong><p>${esc(message.Body)}</p>${message['Message Type'] === 'QUOTATION' ? `<div class="alert"><strong>عرض سعر: ${UI.money(message['Quotation Amount'],message['Quotation Currency'])}</strong>${message['Quotation Valid Until'] ? `<br>صالح حتى ${UI.date(message['Quotation Valid Until'])}` : ''}</div>` : ''}<small>${UI.date(message['Created At'])}</small></article>`).join('')}
    </div>${replyForm(management(user))}`;
    const modal = UI.modal(`طلب: ${request.Title}`,body);
    await API.post('service.request.read',{requestId}).catch(() => null);
    const form = modal.querySelector('form');
    const typeSelect = form.elements.messageType;
    typeSelect?.addEventListener('change',() => modal.querySelectorAll('.quotation-field').forEach(field => field.hidden = typeSelect.value !== 'QUOTATION'));
    form.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(form,async values => {
        values.requestId = requestId;
        if (!values.messageType) values.messageType = 'MESSAGE';
        await API.post('service.request.reply',values);
        UI.toast('تم إرسال الرد وتحديث الطلب.');
        modal.remove();
        await reload();
      });
    });
  }

  async function load(currentUser) {
    const [requestData,portalData] = await Promise.all([
      API.get('service.requests'),
      currentUser.userType === 'CLIENT' ? API.get('client.portal').catch(() => ({projects:[]})) : Promise.resolve({projects:[]})
    ]);
    const requests = UI.filterRows(requestData.requests || [],['Created At','Updated At']);
    const isClient = currentUser.userType === 'CLIENT';
    UI.setMain(`<section class="grid metrics">
      ${UI.metric('إجمالي الطلبات',UI.number(requests.length))}
      ${UI.metric('طلبات جديدة',UI.number(requests.filter(row => row.Status === 'NEW').length))}
      ${UI.metric('عروض أسعار',UI.number(requests.filter(row => row.Status === 'QUOTED').length))}
      ${UI.metric('غير مقروء',UI.number(requests.filter(row => Number(isClient ? row['Client Unread'] : row['Admin Unread'])).length))}
    </section>
    <section class="card"><div class="card-header"><div><h2>طلبات الخدمات وعروض الأسعار</h2><p class="muted">المحادثة وعرض السعر محفوظان داخل نفس الطلب.</p></div>${isClient ? '<button class="btn btn-primary" id="new-service-request">طلب جديد</button>' : ''}</div>
    ${UI.table(requests,[
      {key:'Title',label:'الطلب'},
      {key:'Client Name',label:'العميل'},
      {key:'Project Name',label:'المشروع'},
      {key:'Service Type',label:'الخدمة',render:UI.badge},
      {key:'Status',label:'الحالة',render:UI.badge},
      {key:'Updated At',label:'آخر تحديث',render:UI.date},
      {key:'Request ID',label:'الإجراءات',render:(value,row) => actions(value,row,currentUser)}
    ],{detailTitle:'تفاصيل الطلب'})}</section>`);

    const reload = () => load(currentUser);
    document.querySelector('#new-service-request')?.addEventListener('click',() => {
      const modal = UI.modal('طلب خدمة جديد',requestForm(portalData.projects || []));
      const form = modal.querySelector('form');
      form.addEventListener('submit',event => {
        event.preventDefault();
        UI.submit(form,async values => {
          await API.post('service.requests',values);
          UI.toast('تم إرسال الطلب للإدارة.');
          modal.remove();
          await reload();
        });
      });
    });
    document.querySelectorAll('[data-request-open]').forEach(button => button.addEventListener('click',event => {
      event.stopPropagation();
      openThread(button.dataset.requestOpen,currentUser,reload).catch(error => UI.toast(error.message,'error'));
    }));
  }

  ANCPageModules.requests = { load };
})();