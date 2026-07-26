(() => {
  const esc = UI.escape;
  const statuses = ['TODO','IN_PROGRESS','IN_REVIEW','DONE','BLOCKED'];

  function isManagement() {
    const user = window.ANC_CURRENT_USER || {};
    const role = String(user.role || '').toUpperCase();
    return user.userType === 'ADMIN' || ['ADMIN','MANAGER','ASSISTANT_MANAGER'].includes(role);
  }

  function option(value,label,selected) {
    return `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;
  }

  function taskForm(task, projects, employees) {
    task = task || {};
    return `<form class="form-grid">
      <div class="field"><label>اسم المهمة</label><input name="taskName" required value="${esc(task['Task Name'] || '')}"></div>
      <div class="field"><label>المشروع</label><select name="projectId"><option value="">بدون مشروع</option>${projects.map(row => option(row['Project ID'],row['Project Name'],row['Project ID'] === task['Project ID'])).join('')}</select></div>
      <div class="field"><label>الأولوية</label><select name="priority">${['MEDIUM','HIGH','URGENT','LOW'].map(value => option(value,value,value === (task.Priority || 'MEDIUM'))).join('')}</select></div>
      <div class="field"><label>الموظف</label><select name="employeeId"><option value="">غير مسند</option>${employees.map(row => option(row['Employee ID'],row['Full Name'],row['Employee ID'] === task['Employee ID'])).join('')}</select></div>
      <div class="field"><label>الحالة</label><select name="status">${statuses.map(value => option(value,value,value === (task.Status || 'TODO'))).join('')}</select></div>
      <div class="field"><label>موعد التسليم</label><input name="dueDate" type="date" value="${esc(String(task['Due Date'] || '').slice(0,10))}"></div>
      <div class="field"><label>الساعات المقدرة</label><input name="estimatedHours" type="number" min="0" step=".5" value="${esc(task['Estimated Hours'] || '')}"></div>
      <div class="field wide"><label>تفاصيل التنفيذ</label><textarea name="brief">${esc(task.Brief || '')}</textarea></div>
      <div class="wide actions"><button class="btn btn-primary" type="submit">${task['Task ID'] ? 'إرسال التعديل للاعتماد' : 'إنشاء المهمة'}</button></div>
    </form>`;
  }

  function progressForm(task) {
    return `<form class="form-grid">
      <div class="field"><label>المهمة</label><input value="${esc(task['Task Name'])}" disabled></div>
      <div class="field"><label>الحالة</label><select name="status">${statuses.map(value => option(value,value,value === task.Status)).join('')}</select></div>
      <div class="field"><label>نسبة الإنجاز</label><input name="progressPercent" type="number" min="0" max="100" step="1" required value="${task.Status === 'DONE' ? 100 : 0}"></div>
      <div class="field"><label>رابط التسليم</label><input name="deliveryUrl" type="url" placeholder="https://"></div>
      <div class="field wide"><label>تفاصيل التقدم</label><textarea name="progressDetails" required></textarea></div>
      <div class="wide actions"><button class="btn btn-primary" type="submit">حفظ تحديث التقدم</button></div>
    </form>`;
  }

  async function openTaskEditor(task, context, reload) {
    const modal = UI.modal(task ? 'تعديل المهمة' : 'مهمة جديدة', taskForm(task,context.projects,context.employees));
    const form = modal.querySelector('form');
    form.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(form,async data => {
        if (task) data.taskId = task['Task ID'];
        const result = task ? await API.put('tasks',data) : await API.post('tasks',data);
        UI.toast(result.approval ? 'تم إرسال تعديل المهمة إلى المدير الأساسي للاعتماد.' : 'تم حفظ المهمة.');
        modal.remove();
        await reload();
      });
    });
  }

  function openProgress(task,reload) {
    const modal = UI.modal('تحديث تقدم المهمة',progressForm(task));
    const form = modal.querySelector('form');
    form.addEventListener('submit',event => {
      event.preventDefault();
      UI.submit(form,async data => {
        await Promise.all([
          API.put('tasks',{taskId:task['Task ID'],status:data.status}),
          API.post('task.workUpdates',{taskId:task['Task ID'],progressPercent:data.progressPercent,progressDetails:data.progressDetails,deliveryUrl:data.deliveryUrl})
        ]);
        UI.toast('تم حفظ تحديث التقدم والتسليم.');
        modal.remove();
        await reload();
      });
    });
  }

  function card(task) {
    return `<article class="kanban-card interactive-card" tabindex="0" data-task-details="${esc(task['Task ID'])}">
      <strong>${esc(task['Task Name'])}</strong>
      <p class="muted">${esc(task.Assignee || 'غير مسند')}</p>
      <div class="split-title">${UI.badge(task.Priority)}<small>${UI.date(task['Due Date'])}</small></div>
      <div class="table-actions">
        <button class="btn" data-task-progress="${esc(task['Task ID'])}">${isManagement() ? 'التقدم' : 'تحديث التقدم'}</button>
        ${isManagement() ? `<button class="btn" data-task-edit="${esc(task['Task ID'])}">تعديل</button><button class="btn danger-button" data-task-archive="${esc(task['Task ID'])}">أرشفة</button>` : ''}
      </div>
    </article>`;
  }

  async function load() {
    const [{tasks:rawTasks = [],employees = []}, projectResult] = await Promise.all([
      API.get('tasks'),
      isManagement() ? API.get('projects').catch(() => ({projects:[]})) : Promise.resolve({projects:[]})
    ]);
    const tasks = UI.filterRows(rawTasks,['Created At','Updated At','Due Date']);
    const context = { projects:projectResult.projects || [], employees };
    UI.setMain(`<section class="card"><div class="card-header"><div><h2>لوحة Kanban</h2><p class="muted">متابعة التنفيذ، تفاصيل قابلة للفتح، وتحديثات تقدم وروابط تسليم موثقة.</p></div>${isManagement() && context.projects.length ? '<button class="btn btn-primary" id="new-task">مهمة جديدة</button>' : ''}</div>
      <div class="kanban">${statuses.map(status => `<section class="kanban-column"><div class="split-title"><strong>${status}</strong><span class="badge">${UI.number(tasks.filter(row => row.Status === status).length)}</span></div>${tasks.filter(row => row.Status === status).map(card).join('') || UI.empty('لا توجد مهام')}</section>`).join('')}</div>
    </section>`);

    const reload = () => load();
    document.querySelector('#new-task')?.addEventListener('click',() => openTaskEditor(null,context,reload));
    document.querySelectorAll('[data-task-details]').forEach(node => node.addEventListener('click',event => {
      if (event.target.closest('button,a,input')) return;
      const task = tasks.find(row => row['Task ID'] === node.dataset.taskDetails);
      UI.openDetails(task,[],'تفاصيل المهمة');
    }));
    document.querySelectorAll('[data-task-progress]').forEach(button => button.addEventListener('click',event => {
      event.stopPropagation();
      openProgress(tasks.find(row => row['Task ID'] === button.dataset.taskProgress),reload);
    }));
    document.querySelectorAll('[data-task-edit]').forEach(button => button.addEventListener('click',event => {
      event.stopPropagation();
      openTaskEditor(tasks.find(row => row['Task ID'] === button.dataset.taskEdit),context,reload);
    }));
    document.querySelectorAll('[data-task-archive]').forEach(button => button.addEventListener('click',async event => {
      event.stopPropagation();
      if (!confirm('سيتم إرسال طلب أرشفة المهمة إلى المدير الأساسي. متابعة؟')) return;
      try {
        button.disabled = true;
        await UI.requestApproval({entityType:'TASK',entityId:button.dataset.taskArchive,action:'ARCHIVE',description:'طلب أرشفة مهمة من لوحة Kanban'});
        UI.toast('تم إرسال طلب الأرشفة للاعتماد.');
      } catch (error) {
        UI.toast(error.message,'error');
      } finally {
        button.disabled = false;
      }
    }));
  }

  ANCPageModules.operations = { load };
})();