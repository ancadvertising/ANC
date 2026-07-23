(() => {
  const esc = UI.escape;

  function option(value,label,selected,extra) {
    return "<option value='" + esc(value) + "'" + (selected ? ' selected' : '') + (extra || '') + ">" + esc(label) + "</option>";
  }

  function sizeLabel(value) {
    const bytes = Number(value || 0);
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function uploadForm(clients,projects) {
    const clientOptions = ["<option value=''>عام — بدون عميل</option>"].concat(clients.map(row => option(row['Client ID'],row['Client Name'],false))).join('');
    const projectOptions = ["<option value=''>بدون مشروع</option>"].concat(projects.map(row => option(row['Project ID'],row['Project Name'],false," data-client='" + esc(row['Client ID']) + "'"))).join('');
    return [
      "<form class='form-grid document-form'>",
      "<div class='field'><label>عنوان المستند</label><input name='title' required></div>",
      "<div class='field'><label>التصنيف</label><select name='category'><option>DELIVERY</option><option>BRIEF</option><option>CONTRACT</option><option>RECEIPT</option><option>OTHER</option></select></div>",
      "<div class='field'><label>العميل</label><select name='clientId'>" + clientOptions + "</select></div>",
      "<div class='field'><label>المشروع</label><select name='projectId'>" + projectOptions + "</select></div>",
      "<div class='field'><label>نطاق الظهور</label><select name='visibility'><option value='INTERNAL'>داخلي</option><option value='CLIENT'>متاح للعميل</option></select></div>",
      "<div class='field'><label>الملف (حتى 10 MB)</label><input name='file' type='file' required></div>",
      "<div class='wide actions'><button class='btn btn-primary' type='submit'>رفع وحفظ المستند</button></div>",
      "</form>"
    ].join('');
  }

  function bindProjects(form) {
    const client = form.elements.clientId;
    const project = form.elements.projectId;
    const refresh = () => {
      Array.from(project.options).forEach(item => {
        if (!item.value) return;
        const visible = !client.value || item.dataset.client === client.value;
        item.hidden = !visible;
        item.disabled = !visible;
      });
      if (project.selectedOptions[0] && project.selectedOptions[0].disabled) project.value = '';
    };
    client.addEventListener('change',refresh);
    refresh();
  }

  function fileBase64(file) {
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('تعذر قراءة الملف.'));
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.readAsDataURL(file);
    });
  }

  function actions(_,row,canArchive) {
    return "<div class='table-actions'>" +
      (row['File URL'] ? "<a class='btn' href='" + esc(row['File URL']) + "' target='_blank' rel='noopener'>فتح</a>" : '') +
      (canArchive && row.Status === 'ACTIVE' ? "<button class='btn danger-button' data-document-archive='" + esc(row['Document ID']) + "'>أرشفة</button>" : '') +
    "</div>";
  }

  async function load(currentUser) {
    const [documentData,clientData,projectData] = await Promise.all([
      API.get('documents'),
      API.get('clients').catch(() => ({clients:[]})),
      API.get('projects').catch(() => ({projects:[]}))
    ]);
    const documents = documentData.documents || [];
    const clients = clientData.clients || [];
    const projects = projectData.projects || [];
    const role = String(currentUser.role || '').toUpperCase();
    const canArchive = currentUser.userType === 'ADMIN' || role === 'ADMIN' || role === 'MANAGER';
    const canUpload = currentUser.userType !== 'CLIENT';

    UI.setMain(
      "<section class='grid metrics'>" +
        UI.metric('إجمالي المستندات',documents.length) +
        UI.metric('فواتير PDF',documents.filter(row => row.Category === 'INVOICE').length) +
        UI.metric('متاح للعميل',documents.filter(row => row.Visibility === 'CLIENT').length) +
        UI.metric('حجم الملفات',sizeLabel(documents.reduce((sum,row) => sum + Number(row['File Size'] || 0),0))) +
      "</section>" +
      "<section class='card'><div class='card-header'><div><h2>المستندات والتسليمات</h2><p class='muted'>ملفات R2 مرتبطة بالعميل والمشروع مع روابط موقعة وسجل رفع وأرشفة.</p></div>" +
        (canUpload ? "<button class='btn btn-primary' id='new-document'>رفع مستند</button>" : '') +
      "</div>" +
      UI.table(documents,[
        {key:'Title',label:'العنوان'},
        {key:'Category',label:'التصنيف',render:UI.badge},
        {key:'Client Name',label:'العميل'},
        {key:'Project Name',label:'المشروع'},
        {key:'Visibility',label:'الظهور',render:UI.badge},
        {key:'File Size',label:'الحجم',render:sizeLabel},
        {key:'Uploaded By',label:'بواسطة'},
        {key:'Created At',label:'التاريخ',render:UI.date},
        {key:'Document ID',label:'الإجراءات',render:(value,row) => actions(value,row,canArchive)}
      ]) +
      "</section>"
    );

    const reload = () => load(currentUser);
    document.querySelector('#new-document')?.addEventListener('click',() => {
      const modal = UI.modal('رفع مستند جديد',uploadForm(clients,projects));
      const form = modal.querySelector('form');
      bindProjects(form);
      form.addEventListener('submit',event => {
        event.preventDefault();
        UI.submit(form,async data => {
          const file = form.elements.file.files[0];
          if (!file) throw new Error('اختر ملفًا للرفع.');
          if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف أكبر من 10 MB.');
          data.fileName = file.name;
          data.contentType = file.type || 'application/octet-stream';
          data.base64 = await fileBase64(file);
          delete data.file;
          await API.post('documents',data);
          UI.toast('تم رفع المستند وربطه بالسجل.');
          modal.remove();
          await reload();
        });
      });
    });
    document.querySelectorAll('[data-document-archive]').forEach(button => button.addEventListener('click',async () => {
      if (!confirm('سيتم إخفاء المستند من القوائم النشطة مع الاحتفاظ بالملف والسجل. متابعة؟')) return;
      try {
        button.disabled = true;
        await API.delete('documents',{documentId:button.dataset.documentArchive});
        UI.toast('تمت أرشفة المستند.');
        await reload();
      } catch (error) {
        UI.toast(error.message,'error');
        button.disabled = false;
      }
    }));
  }

  ANCPageModules.documents = { load };
})();