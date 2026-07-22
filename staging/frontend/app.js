const STORAGE_KEY = 'anc-erp-staging-data-v1';
const THEME_KEY = 'anc-erp-theme';

const icons = {
  dashboard: '<path d="M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  projects: '<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2"/>',
  orders: '<path d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01"/>',
  ads: '<path d="m3 11 18-5v12L3 13zM11.6 15.4 13 21H8l-1.8-6.6M18 9v6"/>',
  studio: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m7 15 3-3 3 3 2-2 3 3M8.5 9.5h.01"/>',
  tasks: '<path d="m9 11 3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  finance: '<path d="M4 2h16v20l-3-2-3 2-2-2-3 2-2-2-3 2zM8 7h8M8 11h8M8 15h5"/>',
  banking: '<path d="m3 10 9-7 9 7M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>',
  reports: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  documents: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6"/>',
  employees: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>',
  audit: '<path d="M12 8v4l3 2M3.05 11A9 9 0 1 0 5 5.3L3 7M3 3v4h4"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  userPlus: '<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M16 11h6"/>'
};

const navigationGroups = [
  {
    label: 'الإدارة',
    items: [
      { id: 'dashboard', label: 'لوحة المؤشرات' },
      { id: 'clients', label: 'العملاء' },
      { id: 'projects', label: 'المشروعات' },
      { id: 'orders', label: 'الطلبات' }
    ]
  },
  {
    label: 'التنفيذ',
    items: [
      { id: 'ads', label: 'الإعلانات الممولة' },
      { id: 'studio', label: 'الاستوديو والإنتاج' },
      { id: 'tasks', label: 'المهام والتسليمات' }
    ]
  },
  {
    label: 'المالية',
    items: [
      { id: 'finance', label: 'الفواتير والمدفوعات' },
      { id: 'banking', label: 'البنك والحركات' },
      { id: 'reports', label: 'التقارير والربحية' },
      { id: 'documents', label: 'المستندات' }
    ]
  },
  {
    label: 'النظام',
    items: [
      { id: 'employees', label: 'الموظفون والصلاحيات' },
      { id: 'audit', label: 'سجل النشاط' },
      { id: 'settings', label: 'الإعدادات' }
    ]
  }
];

const pageMetadata = {
  dashboard: { title: 'لوحة المؤشرات', eyebrow: 'نظرة عامة' },
  clients: { title: 'العملاء', eyebrow: 'CRM' },
  projects: { title: 'المشروعات', eyebrow: 'إدارة العمل' },
  orders: { title: 'الطلبات', eyebrow: 'الخدمات' },
  ads: { title: 'الإعلانات الممولة', eyebrow: 'Paid Media' },
  studio: { title: 'الاستوديو والإنتاج', eyebrow: 'Studio' },
  tasks: { title: 'المهام والتسليمات', eyebrow: 'Operations' },
  finance: { title: 'الفواتير والمدفوعات', eyebrow: 'Finance' },
  banking: { title: 'البنك والحركات', eyebrow: 'Banking' },
  reports: { title: 'التقارير والربحية', eyebrow: 'Insights' },
  documents: { title: 'المستندات', eyebrow: 'Drive' },
  employees: { title: 'الموظفون والصلاحيات', eyebrow: 'RBAC' },
  audit: { title: 'سجل النشاط', eyebrow: 'Security' },
  settings: { title: 'الإعدادات', eyebrow: 'System' }
};

const moduleMaps = {
  orders: [
    ['projects', 'الارتباط بالمشروع', 'كل طلب ينتمي لعميل ومشروع محددين.'],
    ['orders', 'دورة حياة مستقلة', 'مسودة ثم اعتماد وتنفيذ ومراجعة وتسليم أو إلغاء.'],
    ['finance', 'أثر مالي مضبوط', 'التأكيد ينشئ الاستحقاق والفوترة لا تكرر المبلغ.']
  ],
  ads: [
    ['ads', 'بيانات التنفيذ', 'المنصة والمدة والميزانية اليومية ومتطلبات العميل.'],
    ['reports', 'التكلفة والربح', 'حساب التكلفة والعمولة والحد الأدنى للربح لكل إعلان.'],
    ['banking', 'حركة البنك', 'الخصم والإيداع والتسوية دون حذف الحركات التاريخية.']
  ],
  studio: [
    ['studio', 'طلب إنتاج', 'تصوير أو فيديو أو مونتاج أو تصميم داخل المشروع.'],
    ['employees', 'فريق التنفيذ', 'الموظف يرى تفاصيل التنفيذ ولا يرى البيانات المالية.'],
    ['documents', 'التسليمات', 'روابط الملفات والإصدارات وملاحظات العميل محفوظة.']
  ],
  tasks: [
    ['tasks', 'مساحة الموظف', 'كل موظف يرى المهام المسندة إليه فقط.'],
    ['check', 'تحديث التقدم', 'تعليقات ونسب إنجاز وروابط تسليم قابلة للتتبع.'],
    ['audit', 'سجل التعديلات', 'كل تغيير في الحالة أو المسؤول يُسجل تلقائيًا.']
  ],
  finance: [
    ['projects', 'فاتورة مشروع', 'تختار عميلًا ثم مشروعًا ثم الطلبات غير المفوترة.'],
    ['finance', 'مدفوع ومتَبقي', 'الدفعات تُوزع على الفاتورة والمشروع دون تكرار.'],
    ['documents', 'PDF احترافي', 'قالب ANC عربي/إنجليزي محفوظ على Google Drive.']
  ],
  banking: [
    ['banking', 'حسابات بنكية متعددة', 'رصيد افتتاحي وإيداعات ومصروفات وتسويات.'],
    ['ads', 'خصم تكلفة الإعلان', 'الخصم مرتبط بالإعلان والعميل والمشروع.'],
    ['audit', 'لا حذف للحركات', 'الإلغاء ينتج حركة عكسية ويحافظ على الأثر المحاسبي.']
  ],
  reports: [
    ['reports', 'أداء الشركة', 'إيرادات ومصروفات وتحصيل وأرصدة.'],
    ['projects', 'ربحية المشروع', 'سعر البيع مقابل التكلفة والربح والهامش.'],
    ['employees', 'الإنتاجية', 'أحمال العمل والتأخير وساعات التنفيذ دون كشف غير مصرح.']
  ],
  documents: [
    ['documents', 'تنظيم مركزي', 'الملفات مرتبطة بالعميل والمشروع والطلب.'],
    ['finance', 'فواتير وكشوف', 'نسخ PDF ثابتة وقابلة للطباعة والإرسال.'],
    ['audit', 'مرجع وتاريخ', 'معرّف Drive ورابط الملف ورافعه وتاريخ إنشائه.']
  ],
  employees: [
    ['employees', 'هوية Google', 'لا يصل إلى النظام إلا بريد مسجل ونشط.'],
    ['settings', 'صلاحيات دقيقة', 'عرض وإنشاء وتعديل وحذف واعتماد وتصدير لكل وحدة.'],
    ['tasks', 'عزل البيانات', 'الموظف يرى العمل المكلّف به وبالقدر اللازم للتنفيذ.']
  ],
  audit: [
    ['audit', 'من قام بالتغيير', 'البريد والدور والتوقيت والكيان المتأثر.'],
    ['orders', 'قبل وبعد', 'حفظ التعديلات الحساسة والموافقات والتجاوزات.'],
    ['reports', 'قابل للمراجعة', 'فلاتر وتصدير دون السماح بتعديل السجل.']
  ],
  settings: [
    ['settings', 'هوية الشركة', 'الشعار والألوان وبيانات الفاتورة وشروط الدفع.'],
    ['ads', 'إعدادات الإعلانات', 'نسب التكلفة والعمولة وحدود الربح الافتراضية.'],
    ['finance', 'الإعداد المالي', 'العملة والضريبة وتسلسل الفواتير والحسابات البنكية.']
  ]
};

const app = document.querySelector('#app');
const content = document.querySelector('#page-content');
const title = document.querySelector('#page-title');
const eyebrow = document.querySelector('#page-eyebrow');
const dialog = document.querySelector('#entity-dialog');
const form = document.querySelector('#entity-form');
const dialogFields = document.querySelector('#dialog-fields');
const formError = document.querySelector('#form-error');
let currentRoute = routeFromLocation();
let currentFormType = '';
let deferredInstallPrompt = null;
let state = loadState();

function svg(name, className = '') {
  const body = icons[name] || icons.more;
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function makeId(prefix) {
  const value = globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`;
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      version: 1,
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : []
    };
  } catch {
    return { version: 1, clients: [], projects: [] };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function routeFromLocation() {
  const route = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  return pageMetadata[route] ? route : 'dashboard';
}

function navigate(route, options = {}) {
  const safeRoute = pageMetadata[route] ? route : 'dashboard';
  if (!options.replace && safeRoute !== currentRoute) history.pushState({}, '', safeRoute === 'dashboard' ? '/' : `/${safeRoute}`);
  if (options.replace) history.replaceState({}, '', safeRoute === 'dashboard' ? '/' : `/${safeRoute}`);
  currentRoute = safeRoute;
  closeSidebar();
  closeMoreSheet();
  renderPage();
  content.focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: 'smooth' });
}

function navLink(item, extraClass = '') {
  const active = item.id === currentRoute;
  return `<a class="nav-link ${extraClass} ${active ? 'is-active' : ''}" href="/${item.id}" data-route="${item.id}" ${active ? 'aria-current="page"' : ''}>${svg(item.id)}<span>${item.label}</span></a>`;
}

function renderNavigation() {
  document.querySelector('#desktop-navigation').innerHTML = navigationGroups.map((group) => `
    <section class="nav-group">
      <p class="nav-group-label">${group.label}</p>
      ${group.items.map((item) => navLink(item)).join('')}
    </section>
  `).join('');

  const mobileItems = [
    { id: 'dashboard', label: 'الرئيسية' },
    { id: 'clients', label: 'العملاء' },
    { id: 'projects', label: 'المشروعات' },
    { id: 'orders', label: 'الطلبات' }
  ];
  const moreActive = !mobileItems.some((item) => item.id === currentRoute);
  document.querySelector('#mobile-navigation').innerHTML = `
    ${mobileItems.map((item) => `<a class="mobile-nav-link ${item.id === currentRoute ? 'is-active' : ''}" href="/${item.id}" data-route="${item.id}" ${item.id === currentRoute ? 'aria-current="page"' : ''}>${svg(item.id)}<span>${item.label}</span></a>`).join('')}
    <button class="mobile-nav-link ${moreActive ? 'is-active' : ''}" type="button" data-action="open-more">${svg('more')}<span>المزيد</span></button>
  `;

  document.querySelector('#more-navigation').innerHTML = navigationGroups
    .flatMap((group) => group.items)
    .filter((item) => !mobileItems.some((mobile) => mobile.id === item.id))
    .map((item) => navLink(item))
    .join('');
}

function setHeader() {
  const meta = pageMetadata[currentRoute];
  title.textContent = meta.title;
  eyebrow.textContent = meta.eyebrow;
  document.title = `${meta.title} | ANC ERP`;
}

function renderPage() {
  setHeader();
  renderNavigation();

  if (currentRoute === 'dashboard') content.innerHTML = renderDashboard();
  else if (currentRoute === 'clients') content.innerHTML = renderClients();
  else if (currentRoute === 'projects') content.innerHTML = renderProjects();
  else content.innerHTML = renderModuleMap(currentRoute);
}

function renderDashboard() {
  const activeClients = state.clients.filter((client) => client.status === 'ACTIVE').length;
  const activeProjects = state.projects.filter((project) => project.status === 'ACTIVE').length;
  const draftProjects = state.projects.filter((project) => project.status === 'DRAFT').length;
  const totalBudget = state.projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const metrics = [
    ['clients', 'العملاء النشطون', activeClients, state.clients.length ? `من إجمالي ${state.clients.length} عميل` : 'ابدأ بإضافة أول عميل'],
    ['projects', 'المشروعات النشطة', activeProjects, state.projects.length ? `من إجمالي ${state.projects.length} مشروع` : 'لم تُسجل مشروعات بعد'],
    ['orders', 'مشروعات تنتظر التأكيد', draftProjects, 'المسودة لا تنشئ أثرًا ماليًا'],
    ['finance', 'ميزانيات المشروعات', money(totalBudget), 'قيمة إرشادية في نسخة التصميم']
  ];

  return `
    <section class="hero-grid">
      <article class="hero-card">
        <span class="hero-kicker">${svg('dashboard')} الهيكل التشغيلي الجديد</span>
        <h2>كل شغل الشركة يبدأ من عميل، ثم مشروع، ثم طلب مستقل.</h2>
        <p>بهذا الربط يمكن فوترتك على مشروع واحد، متابعة ربح كل طلب، وعرض البيانات المناسبة فقط لكل موظف أو عميل.</p>
      </article>
      <div class="hero-side">
        <article class="pulse-card"><span>حالة النسخة</span><strong>جاهزة للاختبار</strong><small>واجهة مستقلة عن Apps Script وقابلة للتثبيت</small></article>
        <article class="pulse-card"><span>الخطوة الحالية</span><strong>CRM + Projects</strong><small>تثبيت الأساس قبل الطلبات والحسابات</small></article>
      </div>
    </section>

    <section class="metrics-grid">
      ${metrics.map(([icon, label, value, note]) => `
        <article class="metric-card">
          <span class="metric-icon">${svg(icon)}</span>
          <div><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><small class="metric-note">${note}</small></div>
        </article>
      `).join('')}
    </section>

    <section class="content-grid">
      <article class="panel">
        <header class="panel-header"><div><h2>مسار العمل المعتمد</h2><p>العلاقات التي سيعتمد عليها التنفيذ والحساب</p></div></header>
        <div class="panel-body">
          <ol class="flow-steps">
            ${[
              ['العميل', 'الملف الرئيسي وبيانات التواصل والحساب'],
              ['المشروع', 'حملة أو عقد مستقل داخل حساب العميل'],
              ['الطلب', 'إعلان أو تصوير أو تصميم أو خدمة منفصلة'],
              ['الفاتورة', 'تجمع طلبًا أو عدة طلبات من مشروع واحد فقط']
            ].map(([name, note], index) => `<li class="flow-step"><span class="flow-step-index">${index + 1}</span><div><strong>${name}</strong><span>${note}</span></div>${svg('arrow')}</li>`).join('')}
          </ol>
        </div>
      </article>

      <article class="panel">
        <header class="panel-header"><div><h2>إجراءات سريعة</h2><p>جرّب رحلة الاستخدام على الموبايل والكمبيوتر</p></div></header>
        <div class="panel-body quick-actions">
          ${quickAction('userPlus', 'إضافة عميل', 'إنشاء ملف العميل الأساسي', 'add-client')}
          ${quickAction('projects', 'إضافة مشروع', 'ربطه بعميل موجود', 'add-project')}
          ${quickAction('projects', 'عرض المشروعات', 'البحث والتصفية حسب الحالة', 'go-projects')}
        </div>
      </article>
    </section>
  `;
}

function quickAction(icon, label, note, action) {
  return `<button class="quick-action" type="button" data-action="${action}">${svg(icon)}<span><strong>${label}</strong><span>${note}</span></span></button>`;
}

function renderClients() {
  const items = filteredClients();
  return `
    ${pageToolbar('إدارة العملاء', 'العميل هو نقطة البداية لكل مشروع وطلب وفاتورة.', 'ابحث بالاسم أو جهة الاتصال...', 'add-client')}
    ${items.length ? `<section class="entity-grid">${items.map(clientCard).join('')}</section>` : emptyState('clients', 'لا يوجد عملاء مطابقون', state.clients.length ? 'غيّر كلمة البحث لعرض نتائج أخرى.' : 'أضف أول عميل حتى تتمكن من إنشاء مشروع وربط الطلبات به.', 'إضافة عميل', 'add-client')}
  `;
}

function clientCard(client) {
  const projectCount = state.projects.filter((project) => project.clientId === client.id).length;
  return `
    <article class="entity-card">
      <div class="entity-card-top">
        <div><h3>${escapeHtml(client.name)}</h3><p>${escapeHtml(client.industry || 'لم يُحدد النشاط')} · ${escapeHtml(client.primaryContact || 'لا توجد جهة اتصال')}</p></div>
        <span class="status-badge" data-status="${escapeHtml(client.status)}">${statusLabel(client.status)}</span>
      </div>
      <div class="entity-meta">
        <div><span>المشروعات</span><strong>${projectCount}</strong></div>
        <div><span>الهاتف</span><strong>${escapeHtml(client.phone || 'غير مسجل')}</strong></div>
        <div><span>البريد</span><strong>${escapeHtml(client.email || 'غير مسجل')}</strong></div>
        <div><span>تاريخ الإضافة</span><strong>${formatDate(client.createdAt)}</strong></div>
      </div>
    </article>
  `;
}

function renderProjects() {
  const items = filteredProjects();
  const filterOptions = ['ALL', 'DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  return `
    <div class="page-toolbar">
      <div class="toolbar-copy"><h2>مشروعات العملاء</h2><p>يمكن للعميل امتلاك عدة مشروعات، ولكل مشروع طلباته وفواتيره الخاصة.</p></div>
      <div class="toolbar-controls">
        <label class="search-box">${svg('search')}<input id="page-search" type="search" value="${escapeHtml(searchValue())}" placeholder="ابحث عن مشروع أو عميل..." aria-label="البحث في المشروعات"></label>
        <select id="status-filter" class="filter-select" aria-label="تصفية حالة المشروع">${filterOptions.map((value) => `<option value="${value}" ${projectFilter() === value ? 'selected' : ''}>${value === 'ALL' ? 'كل الحالات' : statusLabel(value)}</option>`).join('')}</select>
        <button class="primary-button" type="button" data-action="add-project">إضافة مشروع</button>
      </div>
    </div>
    ${items.length ? `<section class="entity-grid">${items.map(projectCard).join('')}</section>` : emptyState('projects', 'لا توجد مشروعات مطابقة', state.projects.length ? 'غيّر البحث أو الحالة لعرض نتائج أخرى.' : 'أنشئ مشروعًا داخل حساب العميل، ثم أضف إليه طلبات الإعلانات أو الاستوديو.', 'إضافة مشروع', 'add-project')}
  `;
}

function projectCard(project) {
  const client = state.clients.find((item) => item.id === project.clientId);
  return `
    <article class="entity-card">
      <div class="entity-card-top">
        <div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(client?.name || 'عميل غير موجود')} · أولوية ${priorityLabel(project.priority)}</p></div>
        <span class="status-badge" data-status="${escapeHtml(project.status)}">${statusLabel(project.status)}</span>
      </div>
      <div class="entity-meta">
        <div><span>الميزانية</span><strong>${money(project.budget, project.currency)}</strong></div>
        <div><span>مدير الحساب</span><strong>${escapeHtml(project.accountManager || 'غير محدد')}</strong></div>
        <div><span>البداية</span><strong>${formatDate(project.startDate)}</strong></div>
        <div><span>الاستحقاق</span><strong>${formatDate(project.dueDate)}</strong></div>
      </div>
    </article>
  `;
}

function renderModuleMap(route) {
  const meta = pageMetadata[route];
  const cards = moduleMaps[route] || [];
  return `
    <section class="empty-state">
      <div>
        <span class="empty-state-icon">${svg(route)}</span>
        <h2>${meta.title}</h2>
        <p>هذه الصفحة مدرجة فعليًا في بنية التنقل الجديدة ولن تنتج شاشة بيضاء. سنحوّل الخريطة التالية إلى وظائف مترابطة بعد اعتماد دورة الطلب.</p>
        <div class="module-map-grid">
          ${cards.map(([icon, label, note]) => `<article class="module-map-card"><span>${svg(icon)}</span><h3>${label}</h3><p>${note}</p></article>`).join('')}
        </div>
      </div>
    </section>
  `;
}

function pageToolbar(heading, copy, placeholder, action) {
  return `
    <div class="page-toolbar">
      <div class="toolbar-copy"><h2>${heading}</h2><p>${copy}</p></div>
      <div class="toolbar-controls">
        <label class="search-box">${svg('search')}<input id="page-search" type="search" value="${escapeHtml(searchValue())}" placeholder="${placeholder}" aria-label="البحث"></label>
        <button class="primary-button" type="button" data-action="${action}">إضافة جديد</button>
      </div>
    </div>
  `;
}

function emptyState(icon, heading, copy, buttonLabel, action) {
  return `<section class="empty-state"><div><span class="empty-state-icon">${svg(icon)}</span><h2>${heading}</h2><p>${copy}</p><button class="primary-button" type="button" data-action="${action}">${buttonLabel}</button></div></section>`;
}

function searchValue() {
  return sessionStorage.getItem(`search:${currentRoute}`) || '';
}

function projectFilter() {
  return sessionStorage.getItem('filter:projects') || 'ALL';
}

function filteredClients() {
  const query = searchValue().trim().toLowerCase();
  if (!query) return [...state.clients].reverse();
  return [...state.clients].reverse().filter((client) => [client.name, client.primaryContact, client.email, client.phone].some((value) => String(value || '').toLowerCase().includes(query)));
}

function filteredProjects() {
  const query = searchValue().trim().toLowerCase();
  const filter = projectFilter();
  return [...state.projects].reverse().filter((project) => {
    const client = state.clients.find((item) => item.id === project.clientId);
    const queryMatches = !query || [project.name, project.accountManager, client?.name].some((value) => String(value || '').toLowerCase().includes(query));
    const statusMatches = filter === 'ALL' || project.status === filter;
    return queryMatches && statusMatches;
  });
}

function statusLabel(status) {
  return ({ ACTIVE: 'نشط', INACTIVE: 'غير نشط', DRAFT: 'مسودة', ON_HOLD: 'متوقف', COMPLETED: 'مكتمل', CANCELLED: 'ملغي' })[status] || status;
}

function priorityLabel(priority) {
  return ({ LOW: 'منخفضة', MEDIUM: 'متوسطة', HIGH: 'عالية', URGENT: 'عاجلة' })[priority] || 'متوسطة';
}

function money(value, currency = 'EGP') {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currency || 'EGP', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function openEntityDialog(type) {
  currentFormType = type;
  form.reset();
  hideFormError();
  const isClient = type === 'client';

  if (!isClient && !state.clients.length) {
    showToast('أضف العميل أولًا', 'لا يمكن إنشاء مشروع دون ربطه بعميل.');
    openEntityDialog('client');
    return;
  }

  document.querySelector('#dialog-eyebrow').textContent = isClient ? 'CRM' : 'Projects';
  document.querySelector('#dialog-title').textContent = isClient ? 'إضافة عميل جديد' : 'إضافة مشروع جديد';
  dialogFields.innerHTML = isClient ? clientFormFields() : projectFormFields();
  dialog.showModal();
  setTimeout(() => dialog.querySelector('input, select, textarea')?.focus(), 40);
}

function clientFormFields() {
  return `
    ${field('name', 'اسم العميل', 'text', true, 'الاسم التجاري أو اسم المؤسسة')}
    ${selectField('status', 'الحالة', [['ACTIVE', 'نشط'], ['INACTIVE', 'غير نشط']])}
    ${field('primaryContact', 'جهة الاتصال الأساسية', 'text', false, 'اسم الشخص المسؤول')}
    ${field('industry', 'مجال النشاط', 'text', false, 'مثال: مطاعم، عقارات، تجارة إلكترونية')}
    ${field('phone', 'رقم الهاتف', 'tel', false, 'رقم التواصل')}
    ${field('email', 'البريد الإلكتروني', 'email', false, 'client@example.com')}
    ${textareaField('notes', 'ملاحظات داخلية', 'معلومات تساعد مدير الحساب ولا تظهر تلقائيًا للعميل')}
  `;
}

function projectFormFields() {
  return `
    ${selectField('clientId', 'العميل', state.clients.map((client) => [client.id, client.name]), true)}
    ${field('name', 'اسم المشروع', 'text', true, 'مثال: حملة صيف 2026')}
    ${selectField('status', 'الحالة', [['DRAFT', 'مسودة'], ['ACTIVE', 'نشط'], ['ON_HOLD', 'متوقف'], ['COMPLETED', 'مكتمل'], ['CANCELLED', 'ملغي']])}
    ${selectField('priority', 'الأولوية', [['LOW', 'منخفضة'], ['MEDIUM', 'متوسطة'], ['HIGH', 'عالية'], ['URGENT', 'عاجلة']])}
    ${field('accountManager', 'مدير الحساب', 'text', false, 'المسؤول عن متابعة العميل')}
    ${field('budget', 'ميزانية المشروع', 'number', false, '0', 'min="0" step="0.01"')}
    ${selectField('currency', 'العملة', [['EGP', 'EGP - جنيه مصري'], ['USD', 'USD - دولار أمريكي'], ['SAR', 'SAR - ريال سعودي']])}
    ${field('startDate', 'تاريخ البداية', 'date')}
    ${field('dueDate', 'تاريخ الاستحقاق', 'date')}
    ${textareaField('description', 'وصف المشروع', 'الهدف والنطاق العام. الطلبات التنفيذية ستُضاف داخله لاحقًا.')}
  `;
}

function field(name, label, type = 'text', required = false, placeholder = '', attributes = '') {
  return `<div class="field"><label for="field-${name}">${label}${required ? ' *' : ''}</label><input id="field-${name}" name="${name}" type="${type}" ${required ? 'required' : ''} placeholder="${placeholder}" ${attributes}></div>`;
}

function textareaField(name, label, placeholder) {
  return `<div class="field field-full"><label for="field-${name}">${label}</label><textarea id="field-${name}" name="${name}" placeholder="${placeholder}"></textarea></div>`;
}

function selectField(name, label, options, required = false) {
  return `<div class="field"><label for="field-${name}">${label}${required ? ' *' : ''}</label><select id="field-${name}" name="${name}" ${required ? 'required' : ''}>${options.map(([value, text]) => `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`).join('')}</select></div>`;
}

function submitEntityForm() {
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const now = new Date().toISOString();

  if (currentFormType === 'client') {
    const duplicate = state.clients.some((client) => client.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    if (duplicate) {
      showFormError('يوجد عميل بنفس الاسم في نسخة الاختبار.');
      return;
    }
    state.clients.push({
      id: makeId('CLT'),
      name: values.name.trim(),
      status: values.status || 'ACTIVE',
      primaryContact: values.primaryContact.trim(),
      industry: values.industry.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      notes: values.notes.trim(),
      createdAt: now,
      updatedAt: now
    });
    persistState();
    dialog.close();
    showToast('تمت إضافة العميل', 'يمكنك الآن إنشاء مشروع وربطه بهذا العميل.');
    navigate('clients');
    return;
  }

  const startDate = values.startDate ? new Date(values.startDate) : null;
  const dueDate = values.dueDate ? new Date(values.dueDate) : null;
  if (startDate && dueDate && dueDate < startDate) {
    showFormError('تاريخ الاستحقاق يجب ألا يسبق تاريخ بداية المشروع.');
    return;
  }

  state.projects.push({
    id: makeId('PRJ'),
    clientId: values.clientId,
    name: values.name.trim(),
    status: values.status || 'DRAFT',
    priority: values.priority || 'MEDIUM',
    accountManager: values.accountManager.trim(),
    budget: Number(values.budget || 0),
    currency: values.currency || 'EGP',
    startDate: values.startDate || '',
    dueDate: values.dueDate || '',
    description: values.description.trim(),
    createdAt: now,
    updatedAt: now
  });
  persistState();
  dialog.close();
  showToast('تم إنشاء المشروع', 'المشروع مرتبط بالعميل ويمكن إضافة الطلبات إليه في المرحلة التالية.');
  navigate('projects');
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.add('is-visible');
}

function hideFormError() {
  formError.textContent = '';
  formError.classList.remove('is-visible');
}

function showToast(heading, message, options = {}) {
  const region = document.querySelector('#toast-region');
  const toast = document.createElement('article');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-mark">${svg(options.icon || 'check')}</span><div><strong>${escapeHtml(heading)}</strong><span>${escapeHtml(message)}</span></div><button type="button" aria-label="إغلاق">×</button>`;
  region.append(toast);
  const remove = () => toast.remove();
  toast.querySelector('button').addEventListener('click', remove);
  setTimeout(remove, options.duration || 4300);
}

function openSidebar() {
  app.classList.add('is-sidebar-open');
  document.querySelector('#menu-button').setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  app.classList.remove('is-sidebar-open');
  document.querySelector('#menu-button').setAttribute('aria-expanded', 'false');
}

function openMoreSheet() {
  const sheet = document.querySelector('#more-sheet');
  sheet.classList.add('is-open');
  sheet.setAttribute('aria-hidden', 'false');
  document.querySelector('#sheet-backdrop').classList.add('is-open');
}

function closeMoreSheet() {
  const sheet = document.querySelector('#more-sheet');
  sheet.classList.remove('is-open');
  sheet.setAttribute('aria-hidden', 'true');
  document.querySelector('#sheet-backdrop').classList.remove('is-open');
}

function applyTheme(theme) {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = safeTheme;
  localStorage.setItem(THEME_KEY, safeTheme);
  document.querySelector('meta[name="theme-color"]').content = safeTheme === 'dark' ? '#090a0c' : '#f3f3f1';
  document.querySelector('#theme-button').innerHTML = svg(safeTheme === 'dark' ? 'sun' : 'moon');
}

function updateConnectionStatus() {
  const status = document.querySelector('#connection-status');
  status.classList.toggle('is-offline', !navigator.onLine);
  status.querySelector('.connection-label').textContent = navigator.onLine ? 'متصل' : 'دون اتصال';
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast('تثبيت ANC ERP', 'استخدم أمر إضافة إلى الشاشة الرئيسية من قائمة المتصفح.', { icon: 'dashboard' });
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.querySelector('#install-button').hidden = true;
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('/service-worker.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('يتوفر تحديث جديد', 'أغلق التطبيق وافتحه لتفعيل أحدث نسخة.', { icon: 'dashboard', duration: 6500 });
        }
      });
    });
  }).catch(() => showToast('تعذر تشغيل وضع التطبيق', 'الواجهة ستعمل، لكن التثبيت والعمل دون اتصال قد لا يتوفران.', { icon: 'settings' }));
}

document.addEventListener('click', (event) => {
  const routeTarget = event.target.closest('[data-route]');
  if (routeTarget) {
    event.preventDefault();
    navigate(routeTarget.dataset.route);
    return;
  }

  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === 'open-more') openMoreSheet();
  if (action === 'add-client') openEntityDialog('client');
  if (action === 'add-project') openEntityDialog('project');
  if (action === 'go-projects') navigate('projects');
});

document.addEventListener('input', (event) => {
  if (event.target.id !== 'page-search') return;
  sessionStorage.setItem(`search:${currentRoute}`, event.target.value);
  renderPage();
  const search = document.querySelector('#page-search');
  search?.focus();
  search?.setSelectionRange(search.value.length, search.value.length);
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'status-filter') return;
  sessionStorage.setItem('filter:projects', event.target.value);
  renderPage();
});

document.querySelector('#menu-button').innerHTML = svg('menu');
document.querySelector('#close-more-button').innerHTML = svg('close');
document.querySelector('#dialog-close-button').innerHTML = svg('close');
document.querySelector('#menu-button').addEventListener('click', openSidebar);
document.querySelector('#sidebar-backdrop').addEventListener('click', closeSidebar);
document.querySelector('#close-more-button').addEventListener('click', closeMoreSheet);
document.querySelector('#sheet-backdrop').addEventListener('click', closeMoreSheet);
document.querySelector('#dialog-close-button').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-cancel-button').addEventListener('click', () => dialog.close());
document.querySelector('#theme-button').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
document.querySelector('#install-button').addEventListener('click', installApp);
document.querySelector('#quick-add-button').addEventListener('click', () => openEntityDialog(currentRoute === 'clients' ? 'client' : 'project'));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitEntityForm();
});

window.addEventListener('popstate', () => {
  currentRoute = routeFromLocation();
  renderPage();
});
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector('#install-button').hidden = false;
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  document.querySelector('#install-button').hidden = true;
  showToast('تم تثبيت ANC ERP', 'يمكنك فتحه الآن من الشاشة الرئيسية.');
});

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
updateConnectionStatus();
renderPage();
registerServiceWorker();
app.hidden = false;
requestAnimationFrame(() => {
  document.querySelector('#boot-screen').classList.add('is-done');
  setTimeout(() => document.querySelector('#boot-screen').remove(), 320);
});
