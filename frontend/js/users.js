(() => {
  const esc = UI.escape;
  const truthy = value => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

  function option(value, label, selected) {
    return "<option value='" + esc(value) + "'" + (selected ? " selected" : "") + ">" + esc(label) + "</option>";
  }

  function userForm(user, clients, roles) {
    user = user || {};
    const type = user['User Type'] || 'EMPLOYEE';
    const role = user.Role || (type === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE');
    const roleCodes = roles.length ? roles.map(row => row['Role Code']) : ['ADMIN','MANAGER','ASSISTANT_MANAGER','ACCOUNT_MANAGER','FINANCE','MEDIA_BUYER','CREATIVE','STUDIO','EMPLOYEE','VIEWER'];
    const clientOptions = ["<option value=''>غير مرتبط</option>"].concat(clients.map(row => option(row['Client ID'], row['Client Name'], row['Client ID'] === user['Client ID']))).join('');
    return [
      "<form class='form-grid user-form'>",
      "<div class='field'><label>الاسم الكامل</label><input name='fullName' required value='" + esc(user['Full Name'] || '') + "'></div>",
      "<div class='field'><label>بريد Google</label><input name='email' type='email' required value='" + esc(user.Email || '') + "'></div>",
      "<div class='field'><label>نوع الحساب</label><select name='userType'>" +
        option('EMPLOYEE','موظف',type === 'EMPLOYEE') + option('CLIENT','عميل',type === 'CLIENT') + option('ADMIN','مدير أساسي',type === 'ADMIN') +
      "</select></div>",
      "<div class='field'><label>الدور</label><select name='role'>" + roleCodes.map(code => option(code, code, code === role)).join('') + "</select></div>",
      "<div class='field wide client-link-field'><label>العميل المرتبط (لحساب العميل)</label><select name='clientId'>" + clientOptions + "</select></div>",
      "<div class='field wide'><label class='check-row'><input name='active' type='checkbox'" + (user['User ID'] && !truthy(user.Active) ? '' : ' checked') + "> الحساب نشط ويمكنه الدخول</label></div>",
      "<div class='wide actions'><button class='btn btn-primary' type='submit'>" + (user['User ID'] ? 'حفظ التعديلات' : 'إنشاء المستخدم') + "</button></div>",
      "</form>"
    ].join('');
  }

  function userActions(_, row, currentUser) {
    const self = row['User ID'] === currentUser.userId;
    const active = truthy(row.Active);
    return [
      "<div class='table-actions'>",
      "<button class='btn' data-user-edit='" + esc(row['User ID']) + "'>تعديل</button>",
      row['Employee ID'] ? "<button class='btn' data-user-permissions='" + esc(row['User ID']) + "'>الصلاحيات</button>" : '',
      "<button class='btn' data-user-toggle='" + esc(row['User ID']) + "' data-active='" + (active ? '0' : '1') + "'" + (self ? ' disabled' : '') + ">" + (active ? 'تعطيل' : 'تفعيل') + "</button>",
      "<button class='btn danger-button' data-user-delete='" + esc(row['User ID']) + "'" + (self ? ' disabled' : '') + ">حذف آمن</button>",
      "</div>"
    ].join('');
  }

  function bindClientVisibility(form) {
    const type = form.elements.userType;
    const field = form.querySelector('.client-link-field');
    const update = () => {
      field.hidden = type.value !== 'CLIENT';
      form.elements.clientId.required = type.value === 'CLIENT';
    };
    type.addEventListener('change', update);
    update();
  }

  function openUserEditor(user, context, reload) {
    const modal = UI.modal(user ? 'تعديل المستخدم' : 'مستخدم جديد', userForm(user, context.clients, context.roles));
    const form = modal.querySelector('form');
    bindClientVisibility(form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      UI.submit(form, async data => {
        data.active = form.elements.active.checked;
        if (user) {
          data.userId = user['User ID'];
          await API.put('users', data);
          UI.toast('تم تحديث بيانات المستخدم.');
        } else {
          await API.post('users', data);
          UI.toast('تم إنشاء المستخدم.');
        }
        modal.remove();
        await reload();
      });
    });
  }

  function openPermissions(user, catalog, assignments, reload) {
    const assigned = new Map(assignments.filter(row => row['Employee ID'] === user['Employee ID']).map(row => [row['Permission ID'], truthy(row.Allowed) ? '1' : '0']));
    const groups = {};
    catalog.forEach(permission => {
      const module = permission.Module || 'SYSTEM';
      if (!groups[module]) groups[module] = [];
      groups[module].push(permission);
    });
    const body = Object.keys(groups).map(module => {
      return "<section class='permission-group'><h3>" + esc(module) + "</h3><div class='permission-grid'>" + groups[module].map(permission => {
        const id = permission['Permission ID'];
        const selected = assigned.has(id) ? assigned.get(id) : '';
        return "<label class='permission-row'><span><strong>" + esc(permission.Action) + "</strong><small>" + esc(permission.Description || '') + "</small></span><select data-permission-id='" + esc(id) + "'>" +
          option('', 'حسب الدور', selected === '') + option('1', 'سماح', selected === '1') + option('0', 'منع', selected === '0') +
        "</select></label>";
      }).join('') + "</div></section>";
    }).join('');
    const modal = UI.modal('صلاحيات ' + user['Full Name'], "<form class='permissions-form'>" + body + "<div class='actions'><button class='btn btn-primary' type='submit'>حفظ الصلاحيات</button></div></form>");
    const form = modal.querySelector('form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      UI.submit(form, async () => {
        const permissions = Array.from(form.querySelectorAll('[data-permission-id]')).filter(select => select.value !== '').map(select => ({
          permissionId: select.dataset.permissionId,
          allowed: select.value === '1',
          reason: 'Custom override from user management'
        }));
        await API.post('users.permissions', { employeeId: user['Employee ID'], permissions });
        UI.toast('تم تحديث الصلاحيات.');
        modal.remove();
        await reload();
      });
    });
  }

  async function load(currentUser) {
    const [userData, clientData] = await Promise.all([API.get('users'), API.get('clients')]);
    const users = userData.users || [];
    const context = {
      clients: clientData.clients || [],
      roles: userData.roles || [],
      permissionCatalog: userData.permissionCatalog || [],
      permissionAssignments: userData.permissionAssignments || []
    };
    UI.setMain(
      "<section class='grid metrics'>" +
        UI.metric('إجمالي المستخدمين', users.length) +
        UI.metric('الحسابات النشطة', users.filter(row => truthy(row.Active)).length) +
        UI.metric('الموظفون', users.filter(row => row['User Type'] === 'EMPLOYEE').length) +
        UI.metric('العملاء', users.filter(row => row['User Type'] === 'CLIENT').length) +
      "</section>" +
      "<section class='card'><div class='card-header'><div><h2>إدارة المستخدمين والصلاحيات</h2><p class='muted'>إنشاء وتعديل وتعطيل المستخدمين وتخصيص صلاحيات الموظفين. الحذف آمن ويحفظ سجل المراجعة.</p></div><button class='btn btn-primary' id='new-user'>مستخدم جديد</button></div>" +
      UI.table(users, [
        { key:'Full Name', label:'الاسم' },
        { key:'Email', label:'البريد' },
        { key:'User Type', label:'النوع', render:UI.badge },
        { key:'Role', label:'الدور' },
        { key:'Active', label:'نشط', render:UI.badge },
        { key:'Last Login', label:'آخر دخول', render:UI.date },
        { key:'User ID', label:'الإجراءات', render:(value,row) => userActions(value,row,currentUser) }
      ]) +
      "</section>"
    );

    const reload = () => load(currentUser);
    document.querySelector('#new-user').addEventListener('click', () => openUserEditor(null, context, reload));
    document.querySelectorAll('[data-user-edit]').forEach(button => button.addEventListener('click', () => {
      const user = users.find(row => row['User ID'] === button.dataset.userEdit);
      openUserEditor(user, context, reload);
    }));
    document.querySelectorAll('[data-user-permissions]').forEach(button => button.addEventListener('click', () => {
      const user = users.find(row => row['User ID'] === button.dataset.userPermissions);
      openPermissions(user, context.permissionCatalog, context.permissionAssignments, reload);
    }));
    document.querySelectorAll('[data-user-toggle]').forEach(button => button.addEventListener('click', async () => {
      if (button.disabled) return;
      try {
        button.disabled = true;
        await API.post('users.setActive', { userId: button.dataset.userToggle, active: button.dataset.active === '1' });
        UI.toast('تم تحديث حالة الحساب.');
        await reload();
      } catch (error) {
        UI.toast(error.message, 'error');
        button.disabled = false;
      }
    }));
    document.querySelectorAll('[data-user-delete]').forEach(button => button.addEventListener('click', async () => {
      if (button.disabled || !confirm('سيتم تعطيل الحساب ومنع دخوله مع الاحتفاظ بسجل العمليات. هل تريد المتابعة؟')) return;
      try {
        button.disabled = true;
        await API.delete('users', { userId: button.dataset.userDelete });
        UI.toast('تم حذف الحساب حذفًا آمنًا.');
        await reload();
      } catch (error) {
        UI.toast(error.message, 'error');
        button.disabled = false;
      }
    }));
  }

  ANCPageModules.users = { load };
})();