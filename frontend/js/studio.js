(() => {
  const esc = UI.escape;
  const truthy = value => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
  const DEFAULT_JOB_TYPE_OPTIONS = Object.freeze([
    { value: 'PHOTOGRAPHY', label: 'Photography' },
    { value: 'VIDEOGRAPHY', label: 'Videography' },
    { value: 'EDITING', label: 'Editing' },
    { value: 'DESIGN', label: 'Design' },
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'EQUIPMENT_RENTAL', label: 'Equipment Rental' }
  ]);
  let JOB_TYPE_OPTIONS = [...DEFAULT_JOB_TYPE_OPTIONS];
  let ALL_JOB_TYPES = [];

  function isManagement() {
    const user = window.ANC_CURRENT_USER || {};
    const role = String(user.role || '').toUpperCase();
    return user.userType === 'ADMIN' || ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER'].includes(role);
  }

  function isPrimaryManager() {
    const user = window.ANC_CURRENT_USER || {};
    const role = String(user.role || '').toUpperCase();
    return user.userType === 'ADMIN' || ['ADMIN', 'MANAGER'].includes(role);
  }

  function localizedTypeName(type) {
    return document.documentElement.lang === 'en' ? type['Name En'] : type['Name Ar'];
  }

  function setJobTypes(rows) {
    ALL_JOB_TYPES = Array.isArray(rows) ? rows : [];
    const active = ALL_JOB_TYPES.filter(type => truthy(type.Active)).map(type => ({
      value: type['Job Type Code'],
      label: localizedTypeName(type) || type['Name En'] || type['Job Type Code']
    }));
    JOB_TYPE_OPTIONS = active.length ? active : [...DEFAULT_JOB_TYPE_OPTIONS];
  }

  function typeLabel(value) {
    const row = ALL_JOB_TYPES.find(type => type['Job Type Code'] === value);
    return row ? localizedTypeName(row) : JOB_TYPE_OPTIONS.find(type => type.value === value)?.label || value;
  }

  function option(value, label, selected, attributes = '') {
    return `<option value="${esc(value)}"${selected ? ' selected' : ''}${attributes}>${esc(label)}</option>`;
  }

  function assignmentFields(employees, assignments) {
    const selected = new Map((assignments || []).map(item => [item['Employee ID'] || item.employeeId, item]));
    if (!employees.length) return `<div class="empty wide">لا يوجد موظفون نشطون متاحون للإسناد.</div>`;
    return `<div class="wide"><label>فريق التنفيذ (يمكن اختيار أكثر من موظف)</label><div class="assignment-editor">${employees.map(employee => {
      const id = employee['Employee ID'];
      const current = selected.get(id) || {};
      return `<div class="assignment-row" data-assignment-row data-employee-id="${esc(id)}">
        <label class="check-row"><input type="checkbox" data-assigned${current['Employee ID'] || current.employeeId ? ' checked' : ''}> <strong>${esc(employee['Full Name'])}</strong><small>${esc(employee.Role || '')}</small></label>
        <input type="number" min="0" step="0.25" data-assigned-hours placeholder="الساعات المخططة" value="${esc(current['Assigned Hours'] ?? current.assignedHours ?? '')}">
        <input type="number" min="0" step="0.01" data-hourly-cost placeholder="تكلفة الساعة" value="${esc(current['Hourly Cost'] ?? current.hourlyCost ?? '')}">
        <input type="number" min="0" step="0.25" data-actual-hours placeholder="الساعات الفعلية" value="${esc(current['Actual Hours'] ?? current.actualHours ?? '')}">
      </div>`;
    }).join('')}</div></div>`;
  }

  function jobForm(job, clients, projects, employees, assignments) {
    job = job || {};
    const management = isManagement();
    const clientId = job['Client ID'] || '';
    const projectId = job['Project ID'] || '';
    const clientOptions = [`<option value="">اختر العميل</option>`].concat(clients.map(row => option(row['Client ID'], row['Client Name'], row['Client ID'] === clientId))).join('');
    const projectOptions = [`<option value="">بدون مشروع</option>`].concat(projects.map(row => option(row['Project ID'], row['Project Name'], row['Project ID'] === projectId, ` data-client="${esc(row['Client ID'])}"`))).join('');
    const statuses = ['TODO','IN_PROGRESS','IN_REVIEW','DONE','CANCELLED'];
    return `<form class="form-grid studio-job-form">
      ${management ? `<div class="field"><label>العميل</label><select name="clientId" required>${clientOptions}</select></div>
      <div class="field"><label>المشروع</label><select name="projectId">${projectOptions}</select></div>
      <div class="field"><label>نوع العمل</label><select name="jobType">${(() => { const current = job['Job Type'] || 'DESIGN'; const options = JOB_TYPE_OPTIONS.some(type => type.value === current) ? JOB_TYPE_OPTIONS : [...JOB_TYPE_OPTIONS,{value:current,label:typeLabel(current)}]; return options.map(type => option(type.value,type.label,type.value === current)).join(''); })()}</select></div>
      <div class="field"><label>موعد التسليم</label><input name="dueDate" type="date" value="${esc(String(job['Due Date'] || '').slice(0,10))}"></div>
      <div class="field wide"><label>العنوان</label><input name="title" required value="${esc(job.Title || '')}"></div>` : ''}
      <div class="field"><label>الحالة</label><select name="status">${statuses.map(status => option(status,status,status === (job.Status || 'TODO'))).join('')}</select></div>
      <div class="field"><label>رابط التسليم</label><input name="deliveryUrl" type="url" placeholder="https://" value="${esc(job['Delivery URL'] || '')}"></div>
      <div class="field wide"><label>التفاصيل التنفيذية والتقدم</label><textarea name="brief">${esc(job.Brief || '')}</textarea></div>
      ${management ? `<div class="field"><label>سعر البيع للعميل</label><input name="salePrice" type="number" min="0" step="0.01" value="${esc(job['Sale Price'] ?? '')}"></div>
      <div class="field"><label>تكلفة مباشرة إضافية</label><input name="directCost" type="number" min="0" step="0.01" value="${esc(job['Direct Cost'] ?? '')}"><small>إذا تركتها فارغة تُحسب من ساعات الفريق.</small></div>
      <div class="field wide"><label class="check-row"><input name="billable" type="checkbox"${job['Studio Job ID'] ? (truthy(job.Billable) ? ' checked' : '') : ' checked'}> إضافة سعر البيع تلقائياً إلى كشف حساب المشروع</label></div>
      ${assignmentFields(employees, assignments)}` : ''}
      <div class="wide actions"><button class="btn btn-primary" type="submit">${job['Studio Job ID'] ? 'إرسال التعديل للاعتماد' : 'إنشاء عمل الاستوديو'}</button></div>
    </form>`;
  }

  function normalizeForm(form, values) {
    if (!isManagement()) return {
      studioJobId: values.studioJobId,
      status: values.status,
      deliveryUrl: values.deliveryUrl,
      brief: values.brief
    };
    values.billable = form.elements.billable.checked;
    values.assignments = Array.from(form.querySelectorAll('[data-assignment-row]'))
      .filter(row => row.querySelector('[data-assigned]').checked)
      .map(row => ({
        employeeId: row.dataset.employeeId,
        assignedHours: row.querySelector('[data-assigned-hours]').value || 0,
        hourlyCost: row.querySelector('[data-hourly-cost]').value || 0,
        actualHours: row.querySelector('[data-actual-hours]').value || 0
      }));
    if (values.directCost === '') delete values.directCost;
    return values;
  }

  function bindProjects(form) {
    const client = form.elements.clientId;
    const project = form.elements.projectId;
    if (!client || !project) return;
    const update = () => {
      Array.from(project.options).forEach(item => {
        if (!item.value) return;
        item.hidden = item.dataset.client !== client.value;
        item.disabled = item.hidden;
      });
      if (project.selectedOptions[0]?.disabled) project.value = '';
    };
    client.addEventListener('change', update);
    update();
  }

  async function openEditor(job, context, reload) {
    let assignments = [];
    if (job?.['Studio Job ID']) {
      assignments = (await API.get('studio.assignments', { studioJobId: job['Studio Job ID'] }).catch(() => ({ assignments: [] }))).assignments || [];
    }
    const title = job ? (isManagement() ? 'تعديل عمل الاستوديو' : 'تحديث التقدم والتسليم') : 'عمل استوديو جديد';
    const modal = UI.modal(title, jobForm(job, context.clients, context.projects, context.employees, assignments));
    const form = modal.querySelector('form');
    bindProjects(form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      UI.submit(form, async values => {
        if (job) values.studioJobId = job['Studio Job ID'];
        const payload = normalizeForm(form, values);
        const result = job ? await API.put('studio.jobs', payload) : await API.post('studio.jobs', payload);
        UI.toast(result.approval ? 'تم إرسال التعديل إلى المدير الأساسي للاعتماد.' : 'تم حفظ عمل الاستوديو.');
        modal.remove();
        await reload();
      });
    });
  }

  function typeForm(type) {
    type = type || {};
    const editing = Boolean(type['Job Type Code']);
    return `<form class="form-grid studio-type-form">
      <div class="field"><label>الكود الإنجليزي</label><input name="jobTypeCode" ${editing ? 'readonly' : ''} required pattern="[A-Za-z][A-Za-z0-9_ -]{1,49}" placeholder="مثال: VOICE_OVER" value="${esc(type['Job Type Code'] || '')}"><small>لا يمكن تغيير الكود بعد إنشاء النوع.</small></div>
      <div class="field"><label>الترتيب</label><input name="sortOrder" type="number" min="0" max="9999" value="${esc(type['Sort Order'] ?? 100)}"></div>
      <div class="field"><label>الاسم بالعربية</label><input name="nameAr" required maxlength="120" value="${esc(type['Name Ar'] || '')}"></div>
      <div class="field"><label>الاسم بالإنجليزية</label><input name="nameEn" required maxlength="120" value="${esc(type['Name En'] || '')}"></div>
      <div class="field wide"><label class="check-row"><input name="active" type="checkbox"${editing ? (truthy(type.Active) ? ' checked' : '') : ' checked'}> النوع نشط ومتاح في الأعمال الجديدة</label></div>
      <div class="wide actions"><button class="btn btn-primary" type="submit">${editing ? 'حفظ التعديلات' : 'إضافة نوع العمل'}</button></div>
    </form>`;
  }

  function typeManagementSection(types) {
    if (!isPrimaryManager()) return '';
    return `<section class="card studio-type-management"><div class="card-header"><div><h2>أنواع أعمال الاستوديو والإنتاج</h2><p class="muted">أضف أنواعًا جديدة أو عدّل الأسماء والترتيب. تعطيل النوع يمنعه من الأعمال الجديدة ولا يؤثر في السجلات السابقة.</p></div><button class="btn btn-primary" id="new-job-type">إضافة نوع عمل</button></div>
      ${UI.table(types,[
        {key:'Job Type Code',label:'الكود'},
        {key:'Name Ar',label:'الاسم بالعربية'},
        {key:'Name En',label:'الاسم بالإنجليزية'},
        {key:'Sort Order',label:'الترتيب',render:UI.number},
        {key:'Active',label:'الحالة',render:value => UI.badge(truthy(value) ? 'ACTIVE' : 'INACTIVE')},
        {key:'Job Type Code',label:'الإجراءات',render:(value,row) => `<div class="table-actions"><button class="btn" data-type-edit="${esc(value)}">تعديل</button><button class="btn" data-type-toggle="${esc(value)}" data-next-active="${truthy(row.Active) ? 'false' : 'true'}">${truthy(row.Active) ? 'تعطيل' : 'تفعيل'}</button></div>`}
      ],{detailTitle:'تفاصيل نوع العمل'})}
    </section>`;
  }

  async function openTypeEditor(type, reload) {
    const modal = UI.modal(type ? 'تعديل نوع العمل' : 'إضافة نوع عمل جديد', typeForm(type));
    const form = modal.querySelector('form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      UI.submit(form, async values => {
        values.active = form.elements.active.checked;
        if (type) await API.put('studio.jobTypes', values);
        else await API.post('studio.jobTypes', values);
        UI.toast(type ? 'تم تحديث نوع العمل.' : 'تمت إضافة نوع العمل.');
        modal.remove();
        await reload();
      });
    });
  }

  function actions(_, row) {
    return `<div class="table-actions">
      <button class="btn" data-job-edit="${esc(row['Studio Job ID'])}">${isManagement() ? 'تعديل' : 'تحديث التقدم'}</button>
      ${isManagement() && row.Status !== 'CANCELLED' ? `<button class="btn" data-job-archive="${esc(row['Studio Job ID'])}">أرشفة</button><button class="btn danger-button" data-job-delete="${esc(row['Studio Job ID'])}">حذف آمن</button>` : ''}
    </div>`;
  }

  async function load() {
    const [studioResult, typeResult, clientResult, projectResult] = await Promise.all([
      API.get('studio.jobs'),
      API.get('studio.jobTypes', { includeInactive: isPrimaryManager() }).catch(() => ({ jobTypes: [] })),
      isManagement() ? API.get('clients').catch(() => ({ clients: [] })) : Promise.resolve({ clients: [] }),
      isManagement() ? API.get('projects').catch(() => ({ projects: [] })) : Promise.resolve({ projects: [] })
    ]);
    setJobTypes(typeResult.jobTypes || []);
    const jobs = UI.filterRows(studioResult.jobs || [], ['Created At', 'Updated At', 'Due Date']);
    const context = { employees: studioResult.employees || [], clients: clientResult.clients || [], projects: projectResult.projects || [], jobTypes: typeResult.jobTypes || [] };
    const totalSale = jobs.reduce((sum,row) => sum + Number(row['Sale Price'] || 0),0);
    const totalCost = jobs.reduce((sum,row) => sum + Number(row['Direct Cost'] || 0),0);
    UI.setMain(`<section class="grid metrics">
      ${UI.metric('قيد التنفيذ', UI.number(jobs.filter(row => row.Status === 'IN_PROGRESS').length))}
      ${UI.metric('قيد المراجعة', UI.number(jobs.filter(row => row.Status === 'IN_REVIEW').length))}
      ${UI.metric('تم التسليم', UI.number(jobs.filter(row => row.Status === 'DONE').length))}
      ${isManagement() ? UI.metric('هامش الاستوديو', UI.money(totalSale - totalCost), `${UI.money(totalSale)} مبيعات`) : UI.metric('إجمالي الأعمال', UI.number(jobs.length))}
    </section>
    ${typeManagementSection(context.jobTypes)}
    <section class="card"><div class="card-header"><div><h2>أعمال الاستوديو</h2><p class="muted">إسناد متعدد للموظفين، تتبع الساعات والتكلفة، وربط البنود القابلة للفوترة بالمشروع.</p></div>${isManagement() && context.clients.length ? '<button class="btn btn-primary" id="new-job">عمل جديد</button>' : ''}</div>
      ${UI.table(jobs, [
        {key:'Title',label:'العمل'},
        {key:'Job Type',label:'النوع',render:value => UI.badge(typeLabel(value))},
        {key:'Assigned To',label:'المسؤول'},
        {key:'Due Date',label:'التسليم',render:UI.date},
        {key:'Status',label:'الحالة',render:UI.badge},
        ...(isManagement() ? [{key:'Sale Price',label:'سعر البيع',render:UI.money},{key:'Direct Cost',label:'التكلفة',render:UI.money}] : []),
        {key:'Delivery URL',label:'التسليم',render:value => value ? `<a class="lime" target="_blank" rel="noopener" href="${esc(value)}">فتح الرابط</a>` : '—'},
        {key:'Studio Job ID',label:'الإجراءات',render:actions}
      ], {detailTitle:'تفاصيل عمل الاستوديو'})}
    </section>`);

    const reload = () => load();
    document.querySelector('#new-job-type')?.addEventListener('click', () => openTypeEditor(null, reload));
    document.querySelectorAll('[data-type-edit]').forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      openTypeEditor(context.jobTypes.find(type => type['Job Type Code'] === button.dataset.typeEdit), reload);
    }));
    document.querySelectorAll('[data-type-toggle]').forEach(button => button.addEventListener('click', async event => {
      event.stopPropagation();
      const active = button.dataset.nextActive === 'true';
      if (!window.confirm(active ? 'هل تريد تفعيل نوع العمل؟' : 'هل تريد تعطيل النوع للأعمال الجديدة؟')) return;
      try {
        button.disabled = true;
        await API.put('studio.jobTypes', { jobTypeCode: button.dataset.typeToggle, active });
        UI.toast(active ? 'تم تفعيل نوع العمل.' : 'تم تعطيل نوع العمل.');
        await reload();
      } catch (error) {
        button.disabled = false;
        UI.toast(error.message, 'error');
      }
    }));
    document.querySelector('#new-job')?.addEventListener('click', () => openEditor(null, context, reload));
    document.querySelectorAll('[data-job-edit]').forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      openEditor(jobs.find(row => row['Studio Job ID'] === button.dataset.jobEdit), context, reload);
    }));
    document.querySelectorAll('[data-job-archive]').forEach(button => button.addEventListener('click', async event => {
      event.stopPropagation();
      if (!confirm('هل تريد متابعة هذه العملية؟')) return;
      try {
        button.disabled = true;
        const result = await UI.requestApproval({ entityType:'STUDIO_JOB', entityId:button.dataset.jobArchive, action:'ARCHIVE', description:'طلب أرشفة عمل استوديو من القائمة' });
        UI.toast(result.applied ? 'تم تنفيذ العملية مباشرة.' : 'تم إرسال العملية للاعتماد.');
        if (result.applied) await load();
      } catch (error) {
        UI.toast(error.message,'error');
      } finally {
        button.disabled = false;
      }
    }));
    document.querySelectorAll('[data-job-delete]').forEach(button => button.addEventListener('click', async event => {
      event.stopPropagation();
      if (!confirm('هل تريد متابعة هذه العملية؟')) return;
      try {
        button.disabled = true;
        const result = await UI.requestApproval({ entityType:'STUDIO_JOB', entityId:button.dataset.jobDelete, action:'DELETE', payload:{reason:'Safe delete requested from studio list'}, description:'طلب حذف آمن لعمل استوديو من القائمة' });
        UI.toast(result.applied ? 'تم تنفيذ العملية مباشرة.' : 'تم إرسال العملية للاعتماد.');
        if (result.applied) await load();
      } catch (error) {
        UI.toast(error.message,'error');
      } finally {
        button.disabled = false;
      }
    }));
  }

  ANCPageModules.studio = { load };
})();