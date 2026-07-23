const STORAGE_KEY = 'anc-erp-staging-data-v2';
const LEGACY_STORAGE_KEY = 'anc-erp-staging-data-v1';
const THEME_KEY = 'anc-erp-theme';
const ROLE_KEY = 'anc-erp-preview-role';
const CLIENT_PREVIEW_KEY = 'anc-erp-preview-client';

const roleMetadata = Object.freeze({
  PRIMARY_MANAGER: { label: 'المدير الأساسي', note: 'صلاحية مباشرة واعتماد طلبات المدير المساعد.' },
  ASSISTANT_MANAGER: { label: 'المدير المساعد', note: 'يستطيع اقتراح أي تعديل، ولا يُنفذ قبل اعتماد المدير الأساسي.' },
  EMPLOYEE: { label: 'الموظف', note: 'يرى تفاصيل التنفيذ فقط دون الميزانيات أو الربحية.' },
  CLIENT: { label: 'العميل', note: 'يرى مشروعاته وطلباته وفواتيره ومدفوعاته فقط.' }
});

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
  approvals: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
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
      { id: 'approvals', label: 'طلبات الاعتماد' },
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
  approvals: { title: 'طلبات الاعتماد', eyebrow: 'Governance' },
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

const roleRoutes = Object.freeze({
  PRIMARY_MANAGER: Object.keys(pageMetadata),
  ASSISTANT_MANAGER: Object.keys(pageMetadata),
  EMPLOYEE: ['dashboard', 'tasks', 'studio', 'ads', 'documents'],
  CLIENT: ['dashboard', 'projects', 'orders', 'finance', 'documents']
});

let currentUser = null;
let currentRole = 'EMPLOYEE';
let currentRoute = 'dashboard';
let currentFormType = '';
let editingEntityId = '';
let deferredInstallPrompt = null;
let serverDashboard = null;
let portalData = null;
let employeePortal = null;
let state = { version: 3, clients: [], projects: [], approvals: [] };

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

function persistState() {
  // Production state is persisted by the API. This function intentionally never writes business data locally.
}

function safeRole(role) {
  return roleMetadata[role] ? role : 'EMPLOYEE';
}

function roleFromUser(user) {
  const userType = String(user?.userType || '').toUpperCase();
  const role = String(user?.role || '').toUpperCase();
  if (userType === 'CLIENT') return 'CLIENT';
  if (role === 'ADMIN' || role === 'MANAGER' || userType === 'ADMIN') return 'PRIMARY_MANAGER';
  if (role === 'ASSISTANT_MANAGER') return 'ASSISTANT_MANAGER';
  return 'EMPLOYEE';
}

function normalizeClient(row) {
  const status = String(row?.Status || row?.status || 'LEAD').toUpperCase();
  return {
    id: String(row?.['Client ID'] || row?.id || ''),
    name: String(row?.['Client Name'] || row?.name || ''),
    status,
    primaryContact: String(row?.['Primary Contact'] || row?.primaryContact || ''),
    industry: String(row?.Industry || row?.industry || ''),
    phone: String(row?.Phone || row?.phone || ''),
    email: String(row?.Email || row?.email || ''),
    notes: String(row?.Notes || row?.notes || ''),
    accountManager: String(row?.['Account Manager'] || row?.accountManager || ''),
    archived: status === 'ARCHIVED',
    createdAt: row?.['Created At'] || row?.createdAt || '',
    updatedAt: row?.['Updated At'] || row?.updatedAt || ''
  };
}

function normalizeProject(row) {
  const status = String(row?.Status || row?.status || 'PLANNED').toUpperCase();
  return {
    id: String(row?.['Project ID'] || row?.['Task ID'] || row?.id || ''),
    clientId: String(row?.['Client ID'] || row?.clientId || ''),
    name: String(row?.['Project Name'] || row?.['Task Name'] || row?.name || ''),
    status,
    priority: String(row?.Priority || row?.priority || 'MEDIUM').toUpperCase(),
    accountManager: String(row?.['Account Manager'] || row?.accountManager || ''),
    budget: Number(row?.Budget || row?.budget || 0),
    currency: String(row?.Currency || row?.currency || 'EGP'),
    startDate: row?.['Start Date'] || row?.startDate || '',
    dueDate: row?.['Due Date'] || row?.dueDate || '',
    description: String(row?.Brief || row?.Description || row?.description || ''),
    progress: Number(row?.['Progress Percent'] || row?.progressPercent || row?.progress || 0),
    progressNote: String(row?.['Progress Details'] || row?.progressDetails || row?.progressNote || ''),
    deliveryLink: String(row?.['Delivery URL'] || row?.deliveryUrl || row?.deliveryLink || ''),
    archived: Boolean(row?.archived) || status === 'ARCHIVED' || status === 'CANCELLED',
    createdAt: row?.['Created At'] || row?.createdAt || '',
    updatedAt: row?.['Updated At'] || row?.updatedAt || ''
  };
}

function normalizeApproval(row) {
  return {
    id: String(row?.approvalId || row?.['Approval ID'] || ''),
    requestedBy: String(row?.requestedBy || row?.['Requested By Email'] || ''),
    requestedByUserId: String(row?.requestedByUserId || row?.['Requested By User ID'] || ''),
    entityType: String(row?.entityType || row?.['Entity Type'] || '').toLowerCase(),
    entityId: String(row?.entityId || row?.['Entity ID'] || ''),
    action: String(row?.action || row?.Action || '').toUpperCase(),
    payload: row?.payload || {},
    before: row?.before || {},
    description: String(row?.description || row?.Description || ''),
    status: String(row?.status || row?.Status || 'PENDING').toUpperCase(),
    reviewedBy: String(row?.reviewedBy || row?.['Reviewed By Email'] || ''),
    reviewNote: String(row?.reviewNote || row?.['Review Note'] || ''),
    createdAt: row?.createdAt || row?.['Created At'] || '',
    reviewedAt: row?.reviewedAt || row?.['Reviewed At'] || ''
  };
}
async function loadProductionState() {
  state = { version: 3, clients: [], projects: [], approvals: [] };
  serverDashboard = null;
  portalData = null;
  employeePortal = null;

  if (currentRole === 'CLIENT') {
    portalData = await ANCAuth.request('client.portal', 'GET', {});
    state.clients = portalData?.client ? [normalizeClient(portalData.client)] : [];
    state.projects = (portalData?.projects || []).map(normalizeProject);
    return;
  }

  if (currentRole === 'EMPLOYEE') {
    employeePortal = await ANCAuth.request('employee.portal', 'GET', {});
    state.projects = (employeePortal?.tasks || []).map(normalizeProject);
    return;
  }

  const [clientsResult, projectsResult, dashboardResult, approvalsResult] = await Promise.all([
    ANCAuth.request('clients', 'GET', {}),
    ANCAuth.request('projects', 'GET', {}),
    ANCAuth.request('dashboard', 'GET', {}).catch(() => null),
    ANCAuth.request('approvals', 'GET', {}).catch(() => ({ approvals: [] }))
  ]);
  state.clients = (clientsResult?.clients || clientsResult || []).map(normalizeClient);
  state.projects = (projectsResult?.projects || projectsResult || []).map(normalizeProject);
  state.approvals = (approvalsResult?.approvals || []).map(normalizeApproval);
  serverDashboard = dashboardResult;
}

function allowedRoutes() {
  if (currentRole !== 'EMPLOYEE') return roleRoutes[currentRole] || roleRoutes.EMPLOYEE;
  const role = String(currentUser?.role || '').toUpperCase();
  if (role === 'MEDIA_BUYER') return ['dashboard', 'tasks', 'ads', 'documents'];
  if (role === 'CREATIVE' || role === 'STUDIO') return ['dashboard', 'tasks', 'studio', 'documents'];
  return ['dashboard', 'tasks', 'documents'];
}

function isRouteAllowed(route) {
  return allowedRoutes().includes(route);
}

function canManageRecords() {
  return currentRole === 'PRIMARY_MANAGER' || currentRole === 'ASSISTANT_MANAGER';
}

function canReviewApprovals() {
  return currentRole === 'PRIMARY_MANAGER';
}

function selectedPreviewClient() {
  if (!state.clients.length) return null;
  return state.clients.find((client) => !client.archived) || null;
}

function pendingForEntity(entityType, entityId) {
  return state.approvals.some((request) => request.status === 'PENDING' && request.entityType === entityType && request.entityId === entityId);
}

function routeFromLocation() {
  const route = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  return pageMetadata[route] && isRouteAllowed(route) ? route : 'dashboard';
}

function navigate(route, options = {}) {
  const safeRoute = pageMetadata[route] && isRouteAllowed(route) ? route : 'dashboard';
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
  const visibleGroups = navigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => isRouteAllowed(item.id)) }))
    .filter((group) => group.items.length);

  document.querySelector('#desktop-navigation').innerHTML = visibleGroups.map((group) => `
    <section class="nav-group">
      <p class="nav-group-label">${group.label}</p>
      ${group.items.map((item) => navLink(item)).join('')}
    </section>
  `).join('');

  const preferredMobile = currentRole === 'CLIENT'
    ? ['dashboard', 'projects', 'orders', 'finance']
    : currentRole === 'EMPLOYEE'
      ? ['dashboard', 'tasks', 'studio', 'documents']
      : ['dashboard', 'clients', 'projects', 'approvals'];
  const allVisibleItems = visibleGroups.flatMap((group) => group.items);
  const mobileItems = preferredMobile
    .map((id) => allVisibleItems.find((item) => item.id === id))
    .filter(Boolean);
  const moreActive = !mobileItems.some((item) => item.id === currentRoute);
  document.querySelector('#mobile-navigation').innerHTML = `
    ${mobileItems.map((item) => `<a class="mobile-nav-link ${item.id === currentRoute ? 'is-active' : ''}" href="/${item.id}" data-route="${item.id}" ${item.id === currentRoute ? 'aria-current="page"' : ''}>${svg(item.id)}<span>${item.label}</span></a>`).join('')}
    <button class="mobile-nav-link ${moreActive ? 'is-active' : ''}" type="button" data-action="open-more">${svg('more')}<span>المزيد</span></button>
  `;

  document.querySelector('#more-navigation').innerHTML = allVisibleItems
    .filter((item) => !mobileItems.some((mobile) => mobile.id === item.id))
    .map((item) => navLink(item))
    .join('');
}

function updateRoleInterface() {
  const meta = roleMetadata[currentRole];
  document.querySelector('#quick-add-button').hidden = !canManageRecords();
  document.querySelector('#signed-user-name').textContent = currentUser?.name || currentUser?.fullName || currentUser?.email || 'ANC ERP';
  document.querySelector('#signed-user-role').textContent = meta.label;
  document.querySelector('#signed-user-avatar').textContent = (currentUser?.name || currentUser?.fullName || currentUser?.email || 'A').trim().charAt(0).toUpperCase();
  document.querySelector('#sidebar-user-label').textContent = `${meta.label} · ${currentUser?.email || ''}`;
}

function setHeader() {
  const meta = { ...pageMetadata[currentRoute] };
  if (currentRoute === 'dashboard' && currentRole === 'CLIENT') {
    meta.title = 'بوابة العميل';
    meta.eyebrow = 'Client Portal';
  }
  if (currentRoute === 'dashboard' && currentRole === 'EMPLOYEE') {
    meta.title = 'مساحة الموظف';
    meta.eyebrow = 'Employee Portal';
  }
  if (currentRoute === 'dashboard' && currentRole === 'ASSISTANT_MANAGER') {
    meta.title = 'لوحة المدير المساعد';
    meta.eyebrow = 'Controlled Changes';
  }
  title.textContent = meta.title;
  eyebrow.textContent = meta.eyebrow;
  document.title = `${meta.title} | ANC ERP`;
}

function renderLiveModule(moduleName) {
  const module = window.ANCPageModules?.[moduleName];
  if (!module?.load) {
    content.innerHTML = emptyState('settings', 'الوحدة غير متاحة', 'تعذر تحميل وحدة التشغيل المطلوبة. أعد تحميل الصفحة ثم حاول مرة أخرى.', 'العودة للرئيسية', 'go-dashboard');
    return;
  }
  content.innerHTML = window.UI?.loading ? UI.loading() : '<div class="skeleton"></div>';
  Promise.resolve(module.load(currentUser)).catch((error) => {
    if (window.UI?.error) UI.error(error);
    else content.innerHTML = emptyState('alerts', 'تعذر تحميل الوحدة', error.message || 'حدث خطأ غير متوقع.', 'العودة للرئيسية', 'go-dashboard');
  });
}

function renderPage() {
  if (!isRouteAllowed(currentRoute)) {
    currentRoute = 'dashboard';
    history.replaceState({}, '', '/');
  }
  setHeader();
  renderNavigation();
  updateRoleInterface();

  if (currentRoute === 'dashboard') content.innerHTML = renderDashboard();
  else if (currentRoute === 'clients') content.innerHTML = renderClients();
  else if (currentRoute === 'projects' && currentRole === 'CLIENT') content.innerHTML = renderClientProjects();
  else if (currentRoute === 'projects') content.innerHTML = renderProjects();
  else if (currentRoute === 'approvals') content.innerHTML = renderApprovals();
  else if (currentRoute === 'documents') renderLiveModule('documents');
  else if (currentRoute === 'tasks' && currentRole === 'EMPLOYEE') content.innerHTML = renderEmployeeTasks();
  else if (currentRole === 'CLIENT') content.innerHTML = renderClientModule(currentRoute);
  else if (currentRoute === 'tasks') renderLiveModule('operations');
  else if (currentRoute === 'ads') renderLiveModule('ads');
  else if (currentRoute === 'studio') renderLiveModule('studio');
  else if (currentRoute === 'finance' || currentRoute === 'banking') renderLiveModule('finance');
  else if (currentRoute === 'reports') renderLiveModule('reports');
  else if (currentRoute === 'employees') renderLiveModule('users');
  else if (currentRoute === 'settings') renderLiveModule('settings');
  else content.innerHTML = renderModuleMap(currentRoute);
}

function renderDashboard() {
  if (currentRole === 'CLIENT') return renderClientDashboard();
  if (currentRole === 'EMPLOYEE') return renderEmployeeDashboard();

  const activeClients = state.clients.filter((client) => client.status === 'ACTIVE' && !client.archived).length;
  const activeProjects = state.projects.filter((project) => project.status === 'ACTIVE' && !project.archived).length;
  const pendingApprovals = state.approvals.filter((request) => request.status === 'PENDING').length;
  const totalBudget = state.projects.filter((project) => !project.archived).reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const metrics = [
    ['clients', 'العملاء النشطون', activeClients, state.clients.length ? `من إجمالي ${state.clients.length} عميل` : 'ابدأ بإضافة أول عميل'],
    ['projects', 'المشروعات النشطة', activeProjects, state.projects.length ? `من إجمالي ${state.projects.length} مشروع` : 'لم تُسجل مشروعات بعد'],
    ['approvals', 'طلبات تنتظر الاعتماد', pendingApprovals, currentRole === 'ASSISTANT_MANAGER' ? 'طلباتك لا تُطبق قبل الاعتماد' : 'راجعها قبل تنفيذ التغيير'],
    ['finance', 'ميزانيات المشروعات', money(totalBudget), 'تظهر للإدارة فقط']
  ];

  return `
    ${rolePreviewBanner()}
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
          ${quickAction('approvals', 'طلبات الاعتماد', currentRole === 'PRIMARY_MANAGER' ? 'اعتماد أو رفض تعديلات المدير المساعد' : 'متابعة حالة التعديلات التي أرسلتها', 'go-approvals')}
        </div>
      </article>
    </section>
  `;
}

function quickAction(icon, label, note, action) {
  return `<button class="quick-action" type="button" data-action="${action}">${svg(icon)}<span><strong>${label}</strong><span>${note}</span></span></button>`;
}

function rolePreviewBanner() {
  const meta = roleMetadata[currentRole];
  const pending = state.approvals.filter((request) => request.status === 'PENDING').length;
  return `
    <section class="governance-banner">
      <span class="governance-icon">${svg(currentRole === 'ASSISTANT_MANAGER' ? 'approvals' : 'employees')}</span>
      <div>
        <span>صلاحية الحساب الحالية</span>
        <strong>${meta.label}</strong>
        <p>${meta.note} تم التحقق من الدور والصلاحيات بواسطة الخادم.</p>
      </div>
      ${currentRole === 'PRIMARY_MANAGER' ? `<button class="soft-button" type="button" data-action="go-approvals">طلبات الاعتماد (${pending})</button>` : ''}
    </section>
  `;
}

function clientPreviewSelector(client) {
  return `<span class="portal-selector"><span>الحساب المسجل</span><strong>${escapeHtml(client?.name || '')}</strong></span>`;
}

function renderClientDashboard() {
  const client = selectedPreviewClient();
  if (!client) {
    return emptyState('clients', 'لا يوجد حساب عميل للمعاينة', 'ارجع إلى دور المدير الأساسي وأضف عميلًا أولًا، ثم اختر واجهة العميل.', 'العودة للإدارة', 'role-primary');
  }
  const projects = state.projects.filter((project) => project.clientId === client.id && !project.archived);
  const activeProjects = projects.filter((project) => project.status === 'ACTIVE').length;
  return `
    <section class="portal-hero">
      <div>
        <span class="hero-kicker">${svg('clients')} بوابة العميل الآمنة</span>
        <h2>مرحبًا، ${escapeHtml(client.name)}</h2>
        <p>هنا يرى العميل مشروعاته وطلباته وفواتيره ومدفوعاته فقط، دون أي تكلفة داخلية أو أرباح أو بيانات عملاء آخرين.</p>
      </div>
      ${clientPreviewSelector(client)}
    </section>
    <section class="metrics-grid">
      ${[
        ['projects', 'إجمالي المشروعات', projects.length, 'كل المشروعات المرتبطة بهذا الحساب'],
        ['projects', 'المشروعات النشطة', activeProjects, 'قيد التنفيذ حاليًا'],
        ['orders', 'الطلبات المفتوحة', 0, 'ستظهر بعد توصيل دورة الطلبات'],
        ['finance', 'الرصيد المستحق', money(0), 'يُحتسب من الفواتير والمدفوعات فقط']
      ].map(([icon, label, value, note]) => `<article class="metric-card"><span class="metric-icon">${svg(icon)}</span><div><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><small class="metric-note">${note}</small></div></article>`).join('')}
    </section>
    <article class="panel">
      <header class="panel-header"><div><h2>مشروعاتي</h2><p>لا تظهر هنا الميزانيات الداخلية أو هامش الربح.</p></div><button class="soft-button" type="button" data-route="projects">عرض الكل</button></header>
      <div class="panel-body">
        ${projects.length ? `<section class="entity-grid portal-grid">${projects.slice(0, 6).map(clientProjectCard).join('')}</section>` : '<p class="portal-empty-copy">لا توجد مشروعات مرتبطة بهذا الحساب حتى الآن.</p>'}
      </div>
    </article>
  `;
}

function renderClientProjects() {
  const client = selectedPreviewClient();
  if (!client) return renderClientDashboard();
  const projects = state.projects.filter((project) => project.clientId === client.id && !project.archived);
  return `
    <div class="page-toolbar">
      <div class="toolbar-copy"><h2>مشروعات ${escapeHtml(client.name)}</h2><p>واجهة قراءة مخصصة للعميل ولا تعرض بيانات مالية داخلية.</p></div>
      ${clientPreviewSelector(client)}
    </div>
    ${projects.length ? `<section class="entity-grid">${projects.map(clientProjectCard).join('')}</section>` : emptyState('projects', 'لا توجد مشروعات', 'لم يتم ربط أي مشروع بهذا العميل بعد.', 'العودة للرئيسية', 'go-dashboard')}
  `;
}

function clientProjectCard(project) {
  return `
    <article class="entity-card">
      <div class="entity-card-top">
        <div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description || 'لا يوجد وصف منشور للعميل.')}</p></div>
        <span class="status-badge" data-status="${recordStatus(project)}">${statusLabel(recordStatus(project))}</span>
      </div>
      <div class="entity-meta">
        <div><span>مدير الحساب</span><strong>${escapeHtml(project.accountManager || 'فريق ANC')}</strong></div>
        <div><span>نسبة الإنجاز</span><strong>${Number(project.progress || 0)}%</strong></div>
        <div><span>البداية</span><strong>${formatDate(project.startDate)}</strong></div>
        <div><span>موعد التسليم</span><strong>${formatDate(project.dueDate)}</strong></div>
      </div>
    </article>
  `;
}

function renderClientModule(route) {
  const client = selectedPreviewClient();
  const descriptions = {
    orders: ['طلباتي', 'ستظهر طلبات الإعلانات والاستوديو المرتبطة بمشروعاتك مع حالة كل طلب.'],
    finance: ['الفواتير والمدفوعات', 'ستظهر الفواتير الصادرة والمدفوعات والرصيد المستحق دون أي تكلفة داخلية.'],
    documents: ['المستندات والتسليمات', 'ستظهر روابط التسليم والفواتير وملفات المشروعات المصرح للعميل بها.']
  };
  const [heading, copy] = descriptions[route] || [pageMetadata[route].title, 'لا توجد بيانات متاحة بعد.'];
  return `
    <section class="portal-hero compact">
      <div><span class="hero-kicker">${svg(route)} ${escapeHtml(client?.name || 'حساب العميل')}</span><h2>${heading}</h2><p>${copy}</p></div>
      ${client ? clientPreviewSelector(client) : ''}
    </section>
    <section class="empty-state"><div><span class="empty-state-icon">${svg(route)}</span><h2>لا توجد سجلات بعد</h2><p>هذه الواجهة جاهزة لاستقبال البيانات بعد توصيل API وقاعدة بيانات الاختبار.</p></div></section>
  `;
}

function employeeVisibleProjects() {
  return state.projects.filter((project) => !project.archived && !['CANCELLED', 'COMPLETED'].includes(project.status));
}

function renderEmployeeDashboard() {
  const projects = employeeVisibleProjects();
  const dueSoon = projects.filter((project) => project.dueDate && new Date(project.dueDate).getTime() - Date.now() < 7 * 86400000).length;
  return `
    <section class="portal-hero employee-hero">
      <div>
        <span class="hero-kicker">${svg('tasks')} Employee Portal</span>
        <h2>مساحة التنفيذ الخاصة بالموظف</h2>
        <p>تظهر تفاصيل العميل والتنفيذ والموعد والتسليم فقط. الميزانية وسعر البيع والتكلفة والربح محجوبة بالكامل.</p>
      </div>
      <span class="privacy-badge">Financial data hidden</span>
    </section>
    <section class="metrics-grid">
      ${[
        ['tasks', 'المهام المسندة', projects.length, 'محاكاة من المشروعات المفتوحة'],
        ['projects', 'قيد التنفيذ', projects.filter((item) => item.status === 'ACTIVE').length, 'تحتاج تحديث التقدم'],
        ['alerts', 'استحقاق قريب', dueSoon, 'خلال 7 أيام'],
        ['documents', 'روابط التسليم', projects.filter((item) => item.deliveryLink).length, 'مسجلة بواسطة فريق التنفيذ']
      ].map(([icon, label, value, note]) => `<article class="metric-card"><span class="metric-icon">${svg(icon)}</span><div><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><small class="metric-note">${note}</small></div></article>`).join('')}
    </section>
    ${renderEmployeeTaskList(projects, true)}
  `;
}

function renderEmployeeTasks() {
  return `
    <div class="page-toolbar"><div class="toolbar-copy"><h2>المهام الموكلة إليّ</h2><p>يمكن تحديث التقدم وكتابة ملاحظة وإضافة رابط تسليم، ولا تظهر أي بيانات مالية.</p></div></div>
    ${renderEmployeeTaskList(employeeVisibleProjects(), false)}
  `;
}

function renderEmployeeTaskList(projects, limited) {
  const visible = limited ? projects.slice(0, 6) : projects;
  if (!visible.length) return emptyState('tasks', 'لا توجد مهام مسندة', 'ستظهر هنا المشروعات والطلبات التي يُسندها المدير لهذا الموظف.', 'العودة للرئيسية', 'go-dashboard');
  return `<section class="entity-grid">${visible.map(employeeTaskCard).join('')}</section>`;
}

function employeeTaskCard(project) {
  const client = state.clients.find((item) => item.id === project.clientId);
  return `
    <article class="entity-card employee-task-card">
      <div class="entity-card-top">
        <div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(client?.name || 'عميل غير موجود')} · ${escapeHtml(project.description || 'لا توجد تفاصيل تنفيذية إضافية.')}</p></div>
        <span class="status-badge" data-status="${recordStatus(project)}">${statusLabel(recordStatus(project))}</span>
      </div>
      <div class="progress-track" aria-label="نسبة الإنجاز"><span style="width: ${Math.min(100, Math.max(0, Number(project.progress || 0)))}%"></span></div>
      <div class="entity-meta">
        <div><span>الإنجاز</span><strong>${Number(project.progress || 0)}%</strong></div>
        <div><span>موعد التسليم</span><strong>${formatDate(project.dueDate)}</strong></div>
        <div><span>آخر تحديث</span><strong>${formatDate(project.progressUpdatedAt || project.updatedAt)}</strong></div>
        <div><span>التسليم</span><strong>${project.deliveryLink ? 'تمت إضافة رابط' : 'لم يُضف بعد'}</strong></div>
      </div>
      ${project.progressNote ? `<p class="execution-note">${escapeHtml(project.progressNote)}</p>` : ''}
      <div class="entity-actions"><button class="soft-button" type="button" data-action="update-progress" data-id="${escapeHtml(project.id)}">تحديث التقدم والتسليم</button></div>
    </article>
  `;
}

function renderApprovals() {
  const items = [...state.approvals].reverse();
  const pending = items.filter((request) => request.status === 'PENDING').length;
  return `
    ${rolePreviewBanner()}
    <div class="page-toolbar">
      <div class="toolbar-copy"><h2>طلبات الاعتماد</h2><p>${currentRole === 'PRIMARY_MANAGER' ? 'راجع التغيير قبل تطبيقه على السجل.' : 'تابع حالة طلباتك؛ لا يُنفذ أي تغيير قبل موافقة المدير الأساسي.'}</p></div>
      <span class="approval-counter">${pending} معلّق</span>
    </div>
    ${items.length ? `<section class="approval-list">${items.map(approvalCard).join('')}</section>` : emptyState('approvals', 'لا توجد طلبات اعتماد', 'تعديلات المدير المساعد ستظهر هنا تلقائيًا.', 'العودة للرئيسية', 'go-dashboard')}
  `;
}

function approvalCard(request) {
  const entityName = request.entityType === 'client' ? 'عميل' : 'مشروع';
  const canReview = canReviewApprovals() && request.status === 'PENDING';
  return `
    <article class="approval-card" data-status="${request.status}">
      <header>
        <div><span>${entityName} · ${actionLabel(request.action)}</span><h3>${escapeHtml(request.description)}</h3></div>
        <span class="status-badge" data-status="${request.status}">${statusLabel(request.status)}</span>
      </header>
      <div class="approval-meta">
        <span>بواسطة <strong>${escapeHtml(request.requestedBy)}</strong></span>
        <span>${formatDateTime(request.createdAt)}</span>
      </div>
      <div class="change-summary">${changeSummary(request)}</div>
      ${request.reviewedAt ? `<p class="review-note">تمت المراجعة بواسطة ${escapeHtml(request.reviewedBy || 'المدير الأساسي')} في ${formatDateTime(request.reviewedAt)}.</p>` : ''}
      ${canReview ? `<footer><button class="ghost-button danger-button" type="button" data-action="reject-approval" data-id="${escapeHtml(request.id)}">رفض</button><button class="primary-button" type="button" data-action="approve-approval" data-id="${escapeHtml(request.id)}">اعتماد وتنفيذ</button></footer>` : ''}
    </article>
  `;
}

function actionLabel(action) {
  return ({ CREATE: 'إنشاء', UPDATE: 'تعديل', STATUS: 'تغيير حالة', ARCHIVE: 'أرشفة', RESTORE: 'استعادة' })[action] || action;
}

function changeSummary(request) {
  if (request.action === 'ARCHIVE') return '<span>أرشفة السجل مع الاحتفاظ بالتاريخ والروابط.</span>';
  if (request.action === 'RESTORE') return '<span>استعادة السجل المؤرشف إلى القوائم النشطة.</span>';
  const labels = {
    name: 'الاسم', status: 'الحالة', primaryContact: 'جهة الاتصال', industry: 'النشاط',
    phone: 'الهاتف', email: 'البريد', notes: 'الملاحظات', clientId: 'العميل',
    priority: 'الأولوية', accountManager: 'مدير الحساب', budget: 'الميزانية',
    currency: 'العملة', startDate: 'البداية', dueDate: 'الاستحقاق', description: 'الوصف'
  };
  const entries = Object.entries(request.payload || {}).filter(([key]) => !['id', 'createdAt', 'updatedAt', 'archived'].includes(key));
  return entries.map(([key, value]) => `<span><strong>${labels[key] || escapeHtml(key)}:</strong> ${escapeHtml(value === '' ? 'فارغ' : value)}</span>`).join('') || '<span>لا توجد تفاصيل إضافية.</span>';
}

function formatDateTime(value) {
  if (!value) return 'غير محدد';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function renderClients() {
  const items = filteredClients();
  return `
    ${pageToolbar('إدارة العملاء', 'العميل هو نقطة البداية لكل مشروع وطلب وفاتورة.', 'ابحث بالاسم أو جهة الاتصال...', 'add-client')}
    ${items.length ? `<section class="entity-grid">${items.map(clientCard).join('')}</section>` : emptyState('clients', 'لا يوجد عملاء مطابقون', state.clients.length ? 'غيّر كلمة البحث لعرض نتائج أخرى.' : 'أضف أول عميل حتى تتمكن من إنشاء مشروع وربط الطلبات به.', 'إضافة عميل', 'add-client')}
  `;
}

function clientCard(client) {
  const projectCount = state.projects.filter((project) => project.clientId === client.id && !project.archived).length;
  const pending = pendingForEntity('client', client.id);
  return `
    <article class="entity-card ${client.archived ? 'is-archived' : ''}">
      <div class="entity-card-top">
        <div><h3>${escapeHtml(client.name)}</h3><p>${escapeHtml(client.industry || 'لم يُحدد النشاط')} · ${escapeHtml(client.primaryContact || 'لا توجد جهة اتصال')}</p></div>
        <span class="status-badge" data-status="${recordStatus(client)}">${statusLabel(recordStatus(client))}</span>
      </div>
      ${pending ? '<p class="pending-change">يوجد طلب تعديل ينتظر اعتماد المدير الأساسي.</p>' : ''}
      <div class="entity-meta">
        <div><span>المشروعات</span><strong>${projectCount}</strong></div>
        <div><span>الهاتف</span><strong>${escapeHtml(client.phone || 'غير مسجل')}</strong></div>
        <div><span>البريد</span><strong>${escapeHtml(client.email || 'غير مسجل')}</strong></div>
        <div><span>آخر تحديث</span><strong>${formatDate(client.updatedAt || client.createdAt)}</strong></div>
      </div>
      ${entityActions('client', client)}
    </article>
  `;
}

function renderProjects() {
  const items = filteredProjects();
  const filterOptions = ['ALL', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
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
  const pending = pendingForEntity('project', project.id);
  return `
    <article class="entity-card ${project.archived ? 'is-archived' : ''}">
      <div class="entity-card-top">
        <div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(client?.name || 'عميل غير موجود')} · أولوية ${priorityLabel(project.priority)}</p></div>
        <span class="status-badge" data-status="${recordStatus(project)}">${statusLabel(recordStatus(project))}</span>
      </div>
      ${pending ? '<p class="pending-change">يوجد طلب تعديل ينتظر اعتماد المدير الأساسي.</p>' : ''}
      <div class="entity-meta">
        <div><span>الميزانية</span><strong>${money(project.budget, project.currency)}</strong></div>
        <div><span>مدير الحساب</span><strong>${escapeHtml(project.accountManager || 'غير محدد')}</strong></div>
        <div><span>البداية</span><strong>${formatDate(project.startDate)}</strong></div>
        <div><span>الاستحقاق</span><strong>${formatDate(project.dueDate)}</strong></div>
      </div>
      ${entityActions('project', project)}
    </article>
  `;
}

function entityActions(entityType, entity) {
  if (!canManageRecords()) return '';
  const pending = pendingForEntity(entityType, entity.id);
  const suffix = currentRole === 'ASSISTANT_MANAGER' ? ' (طلب اعتماد)' : '';
  return `
    <div class="entity-actions">
      <button class="ghost-button" type="button" data-action="edit-${entityType}" data-id="${escapeHtml(entity.id)}" ${pending || entity.archived ? 'disabled' : ''}>تعديل${suffix}</button>
      <button class="ghost-button" type="button" data-action="status-${entityType}" data-id="${escapeHtml(entity.id)}" ${pending || entity.archived ? 'disabled' : ''}>تغيير الحالة${suffix}</button>
      <button class="ghost-button ${entity.archived ? '' : 'danger-button'}" type="button" data-action="${entity.archived ? 'restore' : 'archive'}-${entityType}" data-id="${escapeHtml(entity.id)}" ${pending ? 'disabled' : ''}>${entity.archived ? 'استعادة' : 'أرشفة'}${suffix}</button>
    </div>
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
    const statusMatches = filter === 'ALL' || recordStatus(project) === filter;
    return queryMatches && statusMatches;
  });
}

function recordStatus(record) {
  return record?.archived ? 'ARCHIVED' : record?.status;
}

function statusLabel(status) {
  return ({
    ACTIVE: 'نشط', INACTIVE: 'غير نشط', PLANNED: 'مخطط', ON_HOLD: 'متوقف',
    COMPLETED: 'مكتمل', CANCELLED: 'ملغي', ARCHIVED: 'مؤرشف',
    PENDING: 'معلّق', APPROVED: 'معتمد', REJECTED: 'مرفوض'
  })[status] || status;
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

function findEntity(entityType, entityId) {
  const collection = entityType === 'client' ? state.clients : state.projects;
  return collection.find((item) => item.id === entityId) || null;
}

function openEntityDialog(type, entityId = '') {
  currentFormType = type;
  editingEntityId = entityId;
  form.reset();
  hideFormError();
  const isClient = type === 'client';
  const record = entityId ? findEntity(type, entityId) : null;

  if (!isClient && !state.clients.some((client) => !client.archived)) {
    showToast('أضف العميل أولًا', 'لا يمكن إنشاء مشروع دون ربطه بعميل نشط.');
    openEntityDialog('client');
    return;
  }

  document.querySelector('#dialog-eyebrow').textContent = isClient ? 'CRM' : 'Projects';
  document.querySelector('#dialog-title').textContent = record
    ? `تعديل ${isClient ? 'العميل' : 'المشروع'}`
    : `إضافة ${isClient ? 'عميل جديد' : 'مشروع جديد'}`;
  dialogFields.innerHTML = isClient ? clientFormFields() : projectFormFields();
  if (record) fillEntityForm(record);
  dialog.showModal();
  setTimeout(() => dialog.querySelector('input, select, textarea')?.focus(), 40);
}

function fillEntityForm(record) {
  Object.entries(record).forEach(([key, value]) => {
    const control = form.elements.namedItem(key);
    if (control && typeof control.value !== 'undefined') control.value = value ?? '';
  });
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
    ${selectField('clientId', 'العميل', state.clients.filter((client) => !client.archived).map((client) => [client.id, client.name]), true)}
    ${field('name', 'اسم المشروع', 'text', true, 'مثال: حملة صيف 2026')}
    ${selectField('status', 'الحالة', [['PLANNED', 'مخطط'], ['ACTIVE', 'نشط'], ['ON_HOLD', 'متوقف'], ['COMPLETED', 'مكتمل'], ['CANCELLED', 'ملغي']])}
    ${selectField('priority', 'الأولوية', [['LOW', 'منخفضة'], ['MEDIUM', 'متوسطة'], ['HIGH', 'عالية'], ['URGENT', 'عاجلة']])}
    ${field('accountManager', 'مدير الحساب', 'text', false, 'المسؤول عن متابعة العميل')}
    ${field('budget', 'ميزانية المشروع', 'number', false, '0', 'min="0" step="0.01"')}
    ${selectField('currency', 'العملة', [['EGP', 'EGP - جنيه مصري'], ['USD', 'USD - دولار أمريكي'], ['SAR', 'SAR - ريال سعودي']])}
    ${field('startDate', 'تاريخ البداية', 'date')}
    ${field('dueDate', 'تاريخ الاستحقاق', 'date')}
    ${textareaField('description', 'وصف المشروع', 'الهدف والنطاق العام. الطلبات التنفيذية ستُضاف داخله لاحقًا.')}
  `;
}

function openStatusDialog(entityType, entityId) {
  const record = findEntity(entityType, entityId);
  if (!record || record.archived) return;
  currentFormType = `${entityType}-status`;
  editingEntityId = entityId;
  form.reset();
  hideFormError();
  const options = entityType === 'client'
    ? [['ACTIVE', 'نشط'], ['INACTIVE', 'غير نشط']]
    : [['PLANNED', 'مخطط'], ['ACTIVE', 'نشط'], ['ON_HOLD', 'متوقف'], ['COMPLETED', 'مكتمل'], ['CANCELLED', 'ملغي']];
  document.querySelector('#dialog-eyebrow').textContent = 'Status';
  document.querySelector('#dialog-title').textContent = `تغيير حالة ${entityType === 'client' ? 'العميل' : 'المشروع'}`;
  dialogFields.innerHTML = `
    ${selectField('status', 'الحالة الجديدة', options, true)}
    ${textareaField('reason', 'سبب التغيير', 'اكتب سببًا واضحًا، خصوصًا عند الإيقاف أو الإلغاء.')}
  `;
  form.elements.status.value = record.status;
  dialog.showModal();
}

function openProgressDialog(projectId) {
  const project = findEntity('project', projectId);
  if (!project) return;
  currentFormType = 'progress';
  editingEntityId = projectId;
  form.reset();
  hideFormError();
  document.querySelector('#dialog-eyebrow').textContent = 'Employee Update';
  document.querySelector('#dialog-title').textContent = 'تحديث التقدم والتسليم';
  dialogFields.innerHTML = `
    ${field('progress', 'نسبة الإنجاز %', 'number', true, '0', 'min="0" max="100" step="1"')}
    ${field('deliveryLink', 'رابط التسليم', 'url', false, 'https://drive.google.com/...')}
    ${textareaField('progressNote', 'تفاصيل التقدم', 'ما الذي تم إنجازه؟ وما الخطوة التالية؟')}
  `;
  fillEntityForm(project);
  dialog.showModal();
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

async function submitEntityForm() {
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const now = new Date().toISOString();

  if (currentFormType === 'progress') {
    const project = findEntity('project', editingEntityId);
    if (!project) return;
    await ANCAuth.request('employee.update', 'POST', {
      taskId: project.id,
      progressPercent: Math.min(100, Math.max(0, Number(values.progress || 0))),
      progressDetails: values.progressNote.trim(),
      deliveryUrl: values.deliveryLink.trim()
    });
    await loadProductionState();
    dialog.close();
    showToast('تم تحديث التنفيذ', 'تم حفظ التقدم ورابط التسليم دون كشف أو تعديل أي بيانات مالية.');
    navigate('tasks');
    return;
  }

  if (currentFormType.endsWith('-status')) {
    const entityType = currentFormType.split('-')[0];
    const record = findEntity(entityType, editingEntityId);
    if (!record) return;
    await requestOrApplyChange(
      entityType,
      editingEntityId,
      'STATUS',
      { ...record, status: values.status },
      `تغيير حالة «${record.name}» إلى ${statusLabel(values.status)}${values.reason.trim() ? ` — ${values.reason.trim()}` : ''}`
    );
    return;
  }

  const isClient = currentFormType === 'client';
  const collection = isClient ? state.clients : state.projects;
  const entityType = isClient ? 'client' : 'project';
  const duplicate = collection.some((item) => item.id !== editingEntityId && item.name.trim().toLowerCase() === values.name.trim().toLowerCase());
  if (duplicate) {
    showFormError(`يوجد ${isClient ? 'عميل' : 'مشروع'} بنفس الاسم في نسخة الاختبار.`);
    return;
  }

  if (!isClient) {
    const startDate = values.startDate ? new Date(values.startDate) : null;
    const dueDate = values.dueDate ? new Date(values.dueDate) : null;
    if (startDate && dueDate && dueDate < startDate) {
      showFormError('تاريخ الاستحقاق يجب ألا يسبق تاريخ بداية المشروع.');
      return;
    }
  }

  const existing = editingEntityId ? findEntity(entityType, editingEntityId) : null;
  const payload = isClient ? {
    ...(existing || {}),
    id: existing?.id || makeId('CLT'),
    name: values.name.trim(),
    status: values.status || 'ACTIVE',
    primaryContact: values.primaryContact.trim(),
    industry: values.industry.trim(),
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    notes: values.notes.trim(),
    archived: Boolean(existing?.archived),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  } : {
    ...(existing || {}),
    id: existing?.id || makeId('PRJ'),
    clientId: values.clientId,
    name: values.name.trim(),
    status: values.status || 'PLANNED',
    priority: values.priority || 'MEDIUM',
    accountManager: values.accountManager.trim(),
    budget: Number(values.budget || 0),
    currency: values.currency || 'EGP',
    startDate: values.startDate || '',
    dueDate: values.dueDate || '',
    description: values.description.trim(),
    archived: Boolean(existing?.archived),
    progress: Number(existing?.progress || 0),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  await requestOrApplyChange(
    entityType,
    payload.id,
    existing ? 'UPDATE' : 'CREATE',
    payload,
    `${existing ? 'تعديل' : 'إنشاء'} ${isClient ? 'العميل' : 'المشروع'} «${payload.name}»`
  );
}

function serverPayload(entityType, entityId, action, payload) {
  const isCreate = action === 'CREATE';
  const source = { ...payload };
  if (action === 'ARCHIVE') source.status = entityType === 'client' ? 'ARCHIVED' : 'CANCELLED';
  if (action === 'RESTORE') source.status = entityType === 'client' ? 'ACTIVE' : 'PLANNED';

  if (entityType === 'client') {
    return {
      ...(isCreate ? {} : { clientId: entityId }),
      clientName: source.name,
      status: source.status,
      primaryContact: source.primaryContact,
      email: source.email,
      phone: source.phone,
      industry: source.industry,
      accountManager: source.accountManager
    };
  }

  return {
    ...(isCreate ? {} : { projectId: entityId }),
    clientId: source.clientId,
    projectName: source.name,
    status: source.status,
    priority: source.priority,
    accountManager: source.accountManager,
    budget: source.budget,
    currency: source.currency,
    startDate: source.startDate,
    dueDate: source.dueDate,
    description: source.description
  };
}

async function requestOrApplyChange(entityType, entityId, action, payload, description) {
  if (!canManageRecords()) throw new Error('ليس لديك صلاحية تعديل هذا السجل.');
  const apiPayload = serverPayload(entityType, entityId, action, payload);

  if (currentRole === 'ASSISTANT_MANAGER') {
    await ANCAuth.request('approvals', 'POST', {
      entityType,
      entityId,
      action,
      payload: apiPayload,
      description
    });
    await loadProductionState();
    dialog.close();
    showToast('تم إرسال طلب الاعتماد', 'لن يُطبّق التغيير قبل موافقة المدير الأساسي.', { icon: 'approvals' });
    navigate('approvals');
    return;
  }

  const route = entityType === 'client' ? 'clients' : 'projects';
  await ANCAuth.request(route, action === 'CREATE' ? 'POST' : 'PUT', apiPayload);
  await loadProductionState();
  dialog.close();
  showToast('تم حفظ التغيير', `${description} — تم تسجيل العملية في الخادم وسجل التدقيق.`);
  navigate(entityType === 'client' ? 'clients' : 'projects');
}

function applyApprovedChange(entityType, entityId, action, payload) {
  const collection = entityType === 'client' ? state.clients : state.projects;
  if (action === 'CREATE') {
    if (entityType === 'project') {
      const client = state.clients.find((item) => item.id === payload.clientId && !item.archived);
      if (!client) throw new Error('لا يمكن إنشاء المشروع لأن العميل غير موجود أو مؤرشف.');
    }
    if (!collection.some((item) => item.id === entityId)) collection.push({ ...payload });
    return;
  }
  const record = collection.find((item) => item.id === entityId);
  if (!record) throw new Error('السجل المطلوب لم يعد موجودًا.');
  const now = new Date().toISOString();
  if (action === 'UPDATE' || action === 'STATUS') Object.assign(record, payload, { updatedAt: now });
  if (action === 'ARCHIVE') {
    record.archived = true;
    record.archivedAt = now;
    record.status = entityType === 'client' ? 'INACTIVE' : 'CANCELLED';
    record.updatedAt = now;
  }
  if (action === 'RESTORE') {
    record.archived = false;
    record.archivedAt = '';
    record.status = entityType === 'client' ? 'ACTIVE' : 'PLANNED';
    record.updatedAt = now;
  }
}

async function archiveOrRestoreEntity(entityType, entityId, restore) {
  const record = findEntity(entityType, entityId);
  if (!record) return;
  if (!restore && entityType === 'client') {
    const activeProjects = state.projects.some((project) => project.clientId === entityId && !project.archived && !['COMPLETED', 'CANCELLED'].includes(project.status));
    if (activeProjects) {
      showToast('تعذر أرشفة العميل', 'أوقف أو أكمل أو أرشف المشروعات المفتوحة المرتبطة به أولًا.', { icon: 'alerts' });
      return;
    }
  }
  const verb = restore ? 'استعادة' : 'أرشفة';
  if (!window.confirm(`هل تريد ${verb} «${record.name}»؟ لن يتم حذف التاريخ أو الروابط.`)) return;
  await requestOrApplyChange(entityType, entityId, restore ? 'RESTORE' : 'ARCHIVE', record, `${verb} «${record.name}»`);
}

async function reviewApproval(requestId, decision) {
  if (!canReviewApprovals()) return;
  const request = state.approvals.find((item) => item.id === requestId);
  if (!request || request.status !== 'PENDING') return;
  try {
    await ANCAuth.request('approvals', 'PUT', {
      approvalId: requestId,
      decision,
      reviewNote: ''
    });
    await loadProductionState();
    showToast(
      decision === 'APPROVED' ? 'تم اعتماد وتنفيذ الطلب' : 'تم رفض الطلب',
      request.description,
      { icon: 'approvals' }
    );
    renderPage();
  } catch (error) {
    showToast('تعذرت مراجعة الطلب', error.message || 'حاول مرة أخرى.', { icon: 'alerts' });
  }
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
  if (!navigator.serviceWorker?.register || location.protocol === 'file:') return;
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

document.addEventListener('click', async (event) => {
  const routeTarget = event.target.closest('[data-route]');
  if (routeTarget) {
    event.preventDefault();
    navigate(routeTarget.dataset.route);
    return;
  }

  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  const entityId = actionTarget.dataset.id || '';
  if (action === 'open-more') openMoreSheet();
  if (action === 'add-client') openEntityDialog('client');
  if (action === 'add-project') openEntityDialog('project');
  if (action === 'go-projects') navigate('projects');
  if (action === 'go-approvals') navigate('approvals');
  if (action === 'go-dashboard') navigate('dashboard');

  if (action === 'edit-client') openEntityDialog('client', entityId);
  if (action === 'edit-project') openEntityDialog('project', entityId);
  if (action === 'status-client') openStatusDialog('client', entityId);
  if (action === 'status-project') openStatusDialog('project', entityId);
  if (action === 'archive-client') await archiveOrRestoreEntity('client', entityId, false);
  if (action === 'archive-project') await archiveOrRestoreEntity('project', entityId, false);
  if (action === 'restore-client') await archiveOrRestoreEntity('client', entityId, true);
  if (action === 'restore-project') await archiveOrRestoreEntity('project', entityId, true);
  if (action === 'approve-approval') await reviewApproval(entityId, 'APPROVED');
  if (action === 'reject-approval') await reviewApproval(entityId, 'REJECTED');
  if (action === 'update-progress') openProgressDialog(entityId);
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

  if (event.target.id === 'status-filter') {
    sessionStorage.setItem('filter:projects', event.target.value);
    renderPage();
  }
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

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    await submitEntityForm();
  } catch (error) {
    showFormError(error.message || 'تعذر حفظ التغيير.');
  } finally {
    submitButton.disabled = false;
  }
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

function setAuthState(name, message = '') {
  ['loading', 'login', 'denied'].forEach((stateName) => {
    document.querySelector(`#auth-${stateName}`).hidden = stateName !== name;
  });
  document.querySelector('#auth-gate').hidden = false;
  if (name === 'denied' && message) document.querySelector('#auth-denied-message').textContent = message;
  if (name === 'login') document.querySelector('#auth-login-message').textContent = message;
}

function finishBootScreen() {
  const bootScreen = document.querySelector('#boot-screen');
  if (!bootScreen) return;
  bootScreen.classList.add('is-done');
  setTimeout(() => bootScreen.remove(), 320);
}

function renderGoogleButton() {
  if (!window.google?.accounts?.id) {
    setTimeout(renderGoogleButton, 200);
    return;
  }
  const target = document.querySelector('#google-signin-button');
  target.innerHTML = '';
  google.accounts.id.initialize({
    client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
    callback: async (response) => {
      setAuthState('loading');
      try {
        const user = await ANCAuth.acceptCredential(response.credential);
        await startAuthenticatedApp(user);
      } catch (error) {
        const denied = ['ACCESS_DENIED', 'USER_NOT_FOUND', 'ACCOUNT_INACTIVE', 'FORBIDDEN'].includes(String(error.code || '').toUpperCase()) || error.status === 403;
        if (denied) setAuthState('denied', error.message);
        else {
          setAuthState('login', error.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.');
          renderGoogleButton();
        }
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true
  });
  google.accounts.id.renderButton(target, {
    theme: document.documentElement.dataset.theme === 'dark' ? 'filled_black' : 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    width: 310,
    locale: 'ar'
  });
}

async function showLogin(message = '') {
  app.hidden = true;
  finishBootScreen();
  setAuthState('login', message);
  renderGoogleButton();
}

async function startAuthenticatedApp(user) {
  currentUser = user;
  currentRole = roleFromUser(user);
  currentRoute = routeFromLocation();
  await loadProductionState();
  document.querySelector('#auth-gate').hidden = true;
  app.hidden = false;
  updateConnectionStatus();
  renderPage();
  registerServiceWorker();
  finishBootScreen();
}

async function bootstrapProduction() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  setAuthState('loading');
  try {
    const user = await ANCAuth.requireUser();
    if (!user) {
      await showLogin();
      return;
    }
    await startAuthenticatedApp(user);
  } catch (error) {
    const denied = ['ACCESS_DENIED', 'USER_NOT_FOUND', 'ACCOUNT_INACTIVE', 'FORBIDDEN'].includes(String(error.code || '').toUpperCase()) || error.status === 403;
    finishBootScreen();
    if (denied) setAuthState('denied', error.message);
    else await showLogin(error.message || 'انتهت الجلسة أو تعذر التحقق منها. سجل الدخول من جديد.');
  }
}

document.querySelector('#logout-button').addEventListener('click', async () => {
  await ANCAuth.logout();
  location.replace('/');
});

document.querySelector('#auth-retry-button').addEventListener('click', async () => {
  await ANCAuth.logout();
  await showLogin();
});

bootstrapProduction();
