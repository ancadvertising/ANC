@ -642,7 +642,10 @@ function approvalToApi(row) {
    reviewedBy: row.reviewed_by_email,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  };
}
__name(approvalToApi, "approvalToApi");
@ -667,14 +670,22 @@ async function approvalEntity(env, entityType, entityId) {
__name(approvalEntity, "approvalEntity");
async function listApprovalRequests({ env, actor, data }) {
  const limit = Math.max(1, Math.min(500, Number(data.limit || 200)));
  const rows = actor.role === "ASSISTANT_MANAGER"
    ? await all(env, "SELECT * FROM approval_requests WHERE requested_by_user_id = ? ORDER BY created_at DESC LIMIT ?", [actor.userId, limit])
    : await all(env, "SELECT * FROM approval_requests ORDER BY created_at DESC LIMIT ?", [limit]);
  return { approvals: rows.map(approvalToApi), total: rows.length };
}
__name(listApprovalRequests, "listApprovalRequests");
async function createApprovalRequest({ env, actor, data }) {
  if (!["ADMIN", "MANAGER", "ASSISTANT_MANAGER"].includes(actor.role) && actor.userType !== "ADMIN") throw new ApiError("APPROVAL_REQUEST_NOT_ALLOWED", "Approval requests are available to management roles only.", {}, 403);
  required(data, ["entityType", "action", "description"]);
  const entityType = String(data.entityType).toUpperCase();
  const action = String(data.action).toUpperCase();
@ -837,6 +848,47 @@ async function reviewApprovalRequest({ env, actor, data }) {
  }
}
__name(reviewApprovalRequest, "reviewApprovalRequest");
// src/routes/tasks.js
var STATUSES2 = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
var PRIORITIES2 = ["LOW", "MEDIUM", "HIGH", "URGENT"];
@ -961,8 +1013,80 @@ async function addWorkUpdate({ env, actor, data }) {
__name(addWorkUpdate, "addWorkUpdate");

// src/routes/studio.js
var JOB_TYPES = ["PHOTOGRAPHY", "VIDEOGRAPHY", "EDITING", "DESIGN", "DELIVERY", "EQUIPMENT_RENTAL"];
var unrestricted2 = /* @__PURE__ */ __name((actor) => actor.userType === "ADMIN" || ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "ACCOUNT_MANAGER"].includes(actor.role), "unrestricted");
async function selectedEmployee2(env, value) {
  const employeeId = text(value);
  if (!employeeId) return null;
@ -1006,8 +1130,7 @@ async function listStudioJobs({ env, actor }) {
__name(listStudioJobs, "listStudioJobs");
async function createStudioJob({ env, actor, data }) {
  required(data, ["clientId", "jobType", "title"]);
  const type = String(data.jobType).toUpperCase();
  if (!JOB_TYPES.includes(type)) throw new ApiError("INVALID_JOB_TYPE", "\u0646\u0648\u0639 \u0639\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", { allowed: JOB_TYPES });
  const [client, project, employee] = await Promise.all([
    selectedClient(env, data.clientId),
    selectedProject2(env, data.projectId),
@ -1054,8 +1177,8 @@ async function updateStudioJob({ env, actor, data }) {
      brief: data.brief
    };
  }
  const type = data.jobType ? String(data.jobType).toUpperCase() : existing.job_type;
  if (!JOB_TYPES.includes(type)) throw new ApiError("INVALID_JOB_TYPE", "\u0646\u0648\u0639 \u0639\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", { allowed: JOB_TYPES });
  const clientChanged = data.clientId !== void 0;
  const projectChanged = data.projectId !== void 0;
  const employeeChanged = data.employeeId !== void 0;
@ -1517,6 +1640,7 @@ async function bootstrap({ env, actor, data }) {
  const statements = [];
  for (const [key, value] of Object.entries(DEFAULT_AD_SETTINGS)) statements.push(statement(env, `INSERT INTO ads_settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO NOTHING`, [key, value, key, timestamp]));
  for (const [key, value] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) statements.push(statement(env, "INSERT INTO settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO NOTHING", [key, value, key, timestamp]));
  for (const role of ROLES) statements.push(statement(env, `INSERT INTO roles (role_id,role_code,role_name,description,active,created_at) VALUES (?,?,?,?,1,?) ON CONFLICT(role_code) DO NOTHING`, [id("ROLE"), role, role, `\u062F\u0648\u0631 ${role}`, timestamp]));
  for (const module of MODULES) for (const action of ACTIONS) statements.push(statement(env, `INSERT INTO permissions (permission_id,module,action,description,created_at) VALUES (?,?,?,?,?) ON CONFLICT(module,action) DO NOTHING`, [id("PERM"), module, action, `${module}:${action}`, timestamp]));
  const adminEmail = email(actor?.email || data.adminEmail);
@ -2083,17 +2207,18 @@ async function authorizePagePolicy(env, actor, routeName, method) {
    dashboard:'dashboard', clients:'clients', contacts:'clients', projects:'projects',
    'service.requests':'orders', 'service.request':'orders', 'service.request.reply':'orders', 'service.request.read':'orders',
    ads:'ads', 'ads.cancel':'ads', 'ads.archive':'ads', 'ads.settings':'ads', 'ads.summary':'ads',
    'studio.jobs':'studio', 'studio.assets':'studio', 'studio.assignments':'studio',
    tasks:'tasks', 'task.comments':'tasks', 'task.attachments':'tasks', 'task.workUpdates':'tasks',
    invoices:'finance', 'invoices.project':'finance', 'invoices.projectPreview':'finance', 'invoices.pdf':'finance', payments:'finance', expenses:'finance', 'client.statement':'finance',
    'bank.accounts':'banking', 'bank.transactions':'banking', 'bank.deposit':'banking', 'bank.adjustment':'banking',
    'reports.revenue':'reports', 'reports.profitability':'reports', 'reports.productivity':'reports', 'reports.campaigns':'reports',
    documents:'documents', users:'employees', 'users.setActive':'employees', 'users.permissions':'employees',
    approvals:'approvals', audit:'audit', diagnostics:'settings', 'system.settings':'settings', 'system.health':'settings', 'page.policies':'settings'
  };
  const pageKey = pageByRoute[routeName];
  if (!pageKey) return;
  const portal = managementActor(actor) ? "ADMIN" : actor.userType === "CLIENT" ? "CLIENT" : "EMPLOYEE";
  if (pageKey === "settings" && primaryManager(actor)) return;
  if (pageKey === "documents" && portal !== "ADMIN") throw new ApiError("FORBIDDEN", "Documents are restricted to management.", {}, 403);
  const policy = await first(env, "SELECT visibility,access_level FROM page_policies WHERE page_key=? AND portal=?", [pageKey, portal]);
@ -2120,6 +2245,8 @@ var ROUTES = Object.freeze({
  "GET approvals": route(listApprovalRequests, "APPROVALS", "VIEW"),
  "POST approvals": route(createApprovalRequest, "APPROVALS", "CREATE"),
  "PUT approvals": route(reviewApprovalRequest, "APPROVALS", "APPROVE"),
  "GET tasks": route(listTasks, "TASKS", "VIEW"),
  "POST tasks": route(createTask, "TASKS", "CREATE"),
  "PUT tasks": route(updateTask, "TASKS", "EDIT"),
@ -2156,6 +2283,9 @@ var ROUTES = Object.freeze({
  "GET studio.jobs": route(listStudioJobs, "STUDIO", "VIEW"),
  "POST studio.jobs": route(createStudioJob, "STUDIO", "CREATE"),
  "PUT studio.jobs": route(updateStudioJob, "STUDIO", "EDIT"),
  "POST studio.assets": route(addStudioAsset, "STUDIO", "EDIT"),
  "GET studio.assignments": route(listStudioAssignments, "STUDIO", "VIEW"),
  "PUT studio.assignments": route(saveStudioAssignments, "STUDIO", "EDIT"),
