 function approvalToApi(row) {
    reviewedBy: row.reviewed_by_email,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    archived: Boolean(row.archived),
    archivedAt: row.archived_at,
    archivedBy: row.archived_by
  };
}
__name(approvalToApi, "approvalToApi");
@ -670,22 +667,14 @@ async function approvalEntity(env, entityType, entityId) {
__name(approvalEntity, "approvalEntity");
async function listApprovalRequests({ env, actor, data }) {
  const limit = Math.max(1, Math.min(500, Number(data.limit || 200)));
  const clauses = [];
  const bindings = [];
  if (!(primaryManager(actor) && bool(data.includeArchived))) clauses.push("archived=0");
  if (actor.role === "ASSISTANT_MANAGER") {
    clauses.push("requested_by_user_id=?");
    bindings.push(actor.userId);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  bindings.push(limit);
  const rows = await all(env, `SELECT * FROM approval_requests ${where} ORDER BY created_at DESC LIMIT ?`, bindings);
  return { approvals: rows.map(approvalToApi), total: rows.length };
}
__name(listApprovalRequests, "listApprovalRequests");
async function createApprovalRequest({ env, actor, data }) {
  if (!["ADMIN", "MANAGER", "ASSISTANT_MANAGER"].includes(actor.role) && actor.userType !== "ADMIN") throw new ApiError("APPROVAL_REQUEST_NOT_ALLOWED", "Approval requests are available to management roles only.", {}, 403);
  if (primaryManager(actor)) return applyPrimaryChange({ env, actor, data });
  required(data, ["entityType", "action", "description"]);
  const entityType = String(data.entityType).toUpperCase();
  const action = String(data.action).toUpperCase();
@ -703,6 +692,7 @@ async function createApprovalRequest({ env, actor, data }) {
  if (action !== "CREATE" && !existing) throw new ApiError("APPROVAL_ENTITY_NOT_FOUND", "السجل المطلوب تعديله غير موجود.", {}, 404);
  const duplicate = await first(env, "SELECT approval_id FROM approval_requests WHERE requested_by_user_id = ? AND entity_type = ? AND entity_id = ? AND action = ? AND status IN ('PENDING','PROCESSING')", [actor.userId, entityType, entityId, action]);
  if (duplicate) throw new ApiError("APPROVAL_ALREADY_PENDING", "يوجد بالفعل طلب مماثل ينتظر الاعتماد.", { approvalId: duplicate.approval_id }, 409);
  const record = {
    approval_id: approvalId,
    requested_by_user_id: actor.userId,
@ -713,15 +703,20 @@ async function createApprovalRequest({ env, actor, data }) {
    payload_json: JSON.stringify(data.payload),
    before_json: JSON.stringify(existing || {}),
    description: text(data.description).slice(0, 500),
    status: "PENDING",
    reviewed_by_user_id: null,
    reviewed_by_email: "",
    review_note: "",
    created_at: now(),
    reviewed_at: null
  };
  await insert(env, "approval_requests", record);
  await audit(env, actor, "APPROVAL_REQUESTED", entityType, entityId, { approvalId, action, description: record.description });
  return { approval: approvalToApi(record) };
}
__name(createApprovalRequest, "createApprovalRequest");
@ -848,47 +843,6 @@ async function reviewApprovalRequest({ env, actor, data }) {
  }
}
__name(reviewApprovalRequest, "reviewApprovalRequest");
async function applyPrimaryChange({ env, actor, data }) {
  requirePrimaryManager(actor);
  required(data, ["entityType", "action", "description"]);
  const entityType = String(data.entityType).toUpperCase();
  const action = String(data.action).toUpperCase();
  if (!APPROVAL_ENTITY_TYPES.includes(entityType)) throw new ApiError("INVALID_APPROVAL_ENTITY", "نوع السجل المطلوب تعديله غير مدعوم.");
  if (!APPROVAL_ACTIONS.includes(action)) throw new ApiError("INVALID_APPROVAL_ACTION", "نوع التعديل غير مدعوم.");
  if (!data.payload || typeof data.payload !== "object" || Array.isArray(data.payload)) throw new ApiError("INVALID_APPROVAL_PAYLOAD", "بيانات التعديل غير صالحة.");
  const directId = id("DIRECT");
  const entityId = action === "CREATE" ? text(data.entityId || `NEW-${directId}`) : text(data.entityId);
  if (action !== "CREATE" && !entityId) throw new ApiError("VALIDATION_ERROR", "معرف السجل مطلوب.");
  const request = {
    approval_id: directId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    payload_json: JSON.stringify(data.payload),
    description: text(data.description).slice(0, 500)
  };
  const result = await executeApprovedChange(env, actor, request);
  const appliedEntityId = action === "CREATE"
    ? result.client?.["Client ID"] || result.project?.["Project ID"] || entityId
    : entityId;
  await audit(env, actor, "PRIMARY_CHANGE_APPLIED", entityType, appliedEntityId, { action, description: request.description });
  return { applied: true, approval: null, result };
}
__name(applyPrimaryChange, "applyPrimaryChange");
async function archiveApprovalRequest({ env, actor, data }) {
  requirePrimaryManager(actor);
  required(data, ["approvalId"]);
  const request = await first(env, "SELECT * FROM approval_requests WHERE approval_id=?", [data.approvalId]);
  if (!request) throw new ApiError("APPROVAL_NOT_FOUND", "طلب الاعتماد غير موجود.", {}, 404);
  if (["PENDING", "PROCESSING"].includes(request.status)) throw new ApiError("APPROVAL_NOT_FINAL", "يجب اعتماد الطلب أو رفضه قبل أرشفته.", { status: request.status }, 409);
  if (request.archived) return { archived: true, approval: approvalToApi(request) };
  const archivedAt = now();
  await run(env, "UPDATE approval_requests SET archived=1,archived_at=?,archived_by=? WHERE approval_id=?", [archivedAt, actor.email, request.approval_id]);
  const saved = await first(env, "SELECT * FROM approval_requests WHERE approval_id=?", [request.approval_id]);
  await audit(env, actor, "APPROVAL_ARCHIVED", request.entity_type, request.entity_id, { approvalId: request.approval_id });
  return { archived: true, approval: approvalToApi(saved) };
}
__name(archiveApprovalRequest, "archiveApprovalRequest");
// src/routes/tasks.js
var STATUSES2 = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
var PRIORITIES2 = ["LOW", "MEDIUM", "HIGH", "URGENT"];
@ -1013,80 +967,8 @@ async function addWorkUpdate({ env, actor, data }) {
__name(addWorkUpdate, "addWorkUpdate");

// src/routes/studio.js
var DEFAULT_STUDIO_JOB_TYPES = Object.freeze([
  { code: "PHOTOGRAPHY", nameAr: "تصوير فوتوغرافي", nameEn: "Photography", sortOrder: 10 },
  { code: "VIDEOGRAPHY", nameAr: "تصوير فيديو", nameEn: "Videography", sortOrder: 20 },
  { code: "EDITING", nameAr: "مونتاج", nameEn: "Editing", sortOrder: 30 },
  { code: "DESIGN", nameAr: "تصميم", nameEn: "Design", sortOrder: 40 },
  { code: "DELIVERY", nameAr: "تسليم", nameEn: "Delivery", sortOrder: 50 },
  { code: "EQUIPMENT_RENTAL", nameAr: "تأجير معدات", nameEn: "Equipment Rental", sortOrder: 60 }
]);
var unrestricted2 = /* @__PURE__ */ __name((actor) => actor.userType === "ADMIN" || ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "ACCOUNT_MANAGER"].includes(actor.role), "unrestricted");
function normalizeStudioJobTypeCode(value) {
  return text(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);
}
__name(normalizeStudioJobTypeCode, "normalizeStudioJobTypeCode");
async function activeStudioJobType(env, value) {
  const code = normalizeStudioJobTypeCode(value);
  const row = code ? await first(env, "SELECT * FROM studio_job_types WHERE job_type_code=? AND active=1", [code]) : null;
  if (row) return row;
  const allowed = (await all(env, "SELECT job_type_code FROM studio_job_types WHERE active=1 ORDER BY sort_order,name_en")).map((item) => item.job_type_code);
  throw new ApiError("INVALID_JOB_TYPE", "نوع عمل الاستوديو غير صالح أو غير نشط.", { allowed });
}
__name(activeStudioJobType, "activeStudioJobType");
async function listStudioJobTypes({ env, actor, data }) {
  const includeInactive = primaryManager(actor) && bool(data.includeInactive);
  const rows = await all(env, `SELECT * FROM studio_job_types ${includeInactive ? "" : "WHERE active=1"} ORDER BY sort_order,name_en`);
  return { jobTypes: toApiList(rows) };
}
__name(listStudioJobTypes, "listStudioJobTypes");
async function createStudioJobType({ env, actor, data }) {
  requirePrimaryManager(actor);
  required(data, ["nameAr", "nameEn"]);
  const code = normalizeStudioJobTypeCode(data.jobTypeCode || data.nameEn);
  if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(code)) {
    throw new ApiError("INVALID_JOB_TYPE_CODE", "كود نوع العمل يجب أن يبدأ بحرف إنجليزي ويحتوي على حروف وأرقام وشرطة سفلية فقط.");
  }
  if (await first(env, "SELECT 1 AS found FROM studio_job_types WHERE job_type_code=?", [code])) {
    throw new ApiError("JOB_TYPE_EXISTS", "نوع العمل موجود بالفعل.", { jobTypeCode: code }, 409);
  }
  const timestamp = now();
  const record = {
    job_type_code: code,
    name_ar: text(data.nameAr).slice(0, 120),
    name_en: text(data.nameEn).slice(0, 120),
    active: data.active === void 0 ? 1 : Number(bool(data.active)),
    sort_order: Math.round(clamp(data.sortOrder || 100, 0, 9999)),
    created_by: actor.email,
    created_at: timestamp,
    updated_at: timestamp
  };
  if (!record.name_ar || !record.name_en) throw new ApiError("VALIDATION_ERROR", "اسما نوع العمل بالعربية والإنجليزية مطلوبان.");
  await insert(env, "studio_job_types", record);
  await audit(env, actor, "STUDIO_JOB_TYPE_CREATED", "STUDIO_JOB_TYPE", code, record);
  return { jobType: toApi(record) };
}
__name(createStudioJobType, "createStudioJobType");
async function updateStudioJobType({ env, actor, data }) {
  requirePrimaryManager(actor);
  required(data, ["jobTypeCode"]);
  const code = normalizeStudioJobTypeCode(data.jobTypeCode);
  const existing = await first(env, "SELECT * FROM studio_job_types WHERE job_type_code=?", [code]);
  if (!existing) throw new ApiError("JOB_TYPE_NOT_FOUND", "نوع العمل غير موجود.", { jobTypeCode: code }, 404);
  const nameAr = data.nameAr === void 0 ? existing.name_ar : text(data.nameAr).slice(0, 120);
  const nameEn = data.nameEn === void 0 ? existing.name_en : text(data.nameEn).slice(0, 120);
  if (!nameAr || !nameEn) throw new ApiError("VALIDATION_ERROR", "اسما نوع العمل بالعربية والإنجليزية مطلوبان.");
  const saved = await update(env, "studio_job_types", {
    name_ar: nameAr,
    name_en: nameEn,
    active: data.active === void 0 ? existing.active : Number(bool(data.active)),
    sort_order: data.sortOrder === void 0 ? existing.sort_order : Math.round(clamp(data.sortOrder, 0, 9999)),
    updated_at: now()
  }, "job_type_code", code);
  await audit(env, actor, "STUDIO_JOB_TYPE_UPDATED", "STUDIO_JOB_TYPE", code, data);
  return { jobType: toApi(saved) };
}
__name(updateStudioJobType, "updateStudioJobType");
async function selectedEmployee2(env, value) {
  const employeeId = text(value);
  if (!employeeId) return null;
@ -1130,7 +1012,8 @@ async function listStudioJobs({ env, actor }) {
__name(listStudioJobs, "listStudioJobs");
async function createStudioJob({ env, actor, data }) {
  required(data, ["clientId", "jobType", "title"]);
  const type = (await activeStudioJobType(env, data.jobType)).job_type_code;
  const [client, project, employee] = await Promise.all([
    selectedClient(env, data.clientId),
    selectedProject2(env, data.projectId),
@ -1177,8 +1060,8 @@ async function updateStudioJob({ env, actor, data }) {
      brief: data.brief
    };
  }
  const requestedType = data.jobType ? normalizeStudioJobTypeCode(data.jobType) : existing.job_type;
  const type = requestedType === existing.job_type ? existing.job_type : (await activeStudioJobType(env, requestedType)).job_type_code;
  const clientChanged = data.clientId !== void 0;
  const projectChanged = data.projectId !== void 0;
  const employeeChanged = data.employeeId !== void 0;
@ -1421,22 +1304,34 @@ async function statement2(env, clientId) {
  return { entries: toApiList(entries), totalDebit, totalCredit, outstandingBalance: Math.round((totalDebit - totalCredit) * 100) / 100 };
}
__name(statement2, "statement");
async function clientPortal({ env, actor }) {
  if (actor.userType !== "CLIENT" || !actor.clientId) throw new ApiError("CLIENT_ACCOUNT_REQUIRED", "\u0647\u0630\u0647 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629.", {}, 403);
  const client = await first(env, "SELECT * FROM clients WHERE client_id = ?", [actor.clientId]);
  if (!client) throw new ApiError("CLIENT_NOT_FOUND", "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.", {}, 404);
  const [projects, ads, invoices, payments, assets, account] = await Promise.all([
    all(env, "SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC", [actor.clientId]),
    all(env, "SELECT * FROM paid_ads WHERE client_id = ? ORDER BY created_at DESC", [actor.clientId]),
    all(env, "SELECT * FROM invoices WHERE client_id = ? ORDER BY issue_date DESC", [actor.clientId]),
    all(env, "SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC", [actor.clientId]),
    all(env, `SELECT sa.* FROM studio_assets sa JOIN studio_jobs sj ON sj.studio_job_id = sa.studio_job_id WHERE sj.client_id = ? ORDER BY sa.created_at DESC`, [actor.clientId]),
    statement2(env, actor.clientId)
  ]);
  return {
    client: toApi(client),
    projects: toApiList(projects),
    ads: ads.map((row) => toApi(sanitizeAd(row, actor))),
    invoices: toApiList(invoices),
    payments: toApiList(payments),
    statement: account,
@ -1640,7 +1535,6 @@ async function bootstrap({ env, actor, data }) {
  const statements = [];
  for (const [key, value] of Object.entries(DEFAULT_AD_SETTINGS)) statements.push(statement(env, `INSERT INTO ads_settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO NOTHING`, [key, value, key, timestamp]));
  for (const [key, value] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) statements.push(statement(env, "INSERT INTO settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO NOTHING", [key, value, key, timestamp]));
  for (const type of DEFAULT_STUDIO_JOB_TYPES) statements.push(statement(env, "INSERT INTO studio_job_types (job_type_code,name_ar,name_en,active,sort_order,created_by,created_at,updated_at) VALUES (?,?,?,1,?,?,?,?) ON CONFLICT(job_type_code) DO NOTHING", [type.code, type.nameAr, type.nameEn, type.sortOrder, "SYSTEM", timestamp, timestamp]));
  for (const role of ROLES) statements.push(statement(env, `INSERT INTO roles (role_id,role_code,role_name,description,active,created_at) VALUES (?,?,?,?,1,?) ON CONFLICT(role_code) DO NOTHING`, [id("ROLE"), role, role, `\u062F\u0648\u0631 ${role}`, timestamp]));
  for (const module of MODULES) for (const action of ACTIONS) statements.push(statement(env, `INSERT INTO permissions (permission_id,module,action,description,created_at) VALUES (?,?,?,?,?) ON CONFLICT(module,action) DO NOTHING`, [id("PERM"), module, action, `${module}:${action}`, timestamp]));
  const adminEmail = email(actor?.email || data.adminEmail);
@ -2015,24 +1909,6 @@ async function updatePopupNotification({ env, actor, data }) {
  return { notification: toApi(saved) };
}
__name(updatePopupNotification, "updatePopupNotification");
async function deletePopupNotification({ env, actor, data }) {
  requirePrimaryManager(actor);
  required(data, ["notificationId"]);
  const notificationId = text(data.notificationId);
  const existing = await first(env, "SELECT * FROM popup_notifications WHERE notification_id=?", [notificationId]);
  if (!existing) throw new ApiError("NOTIFICATION_NOT_FOUND", "Notification not found.", {}, 404);
  await batch(env, [
    statement(env, "DELETE FROM popup_notification_receipts WHERE notification_id=?", [notificationId]),
    statement(env, "DELETE FROM popup_notifications WHERE notification_id=?", [notificationId])
  ]);
  await audit(env, actor, "POPUP_NOTIFICATION_DELETED", "NOTIFICATION", notificationId, {
    titleAr: existing.title_ar,
    titleEn: existing.title_en,
    audience: existing.audience
  });
  return { deleted: true, notificationId };
}
__name(deletePopupNotification, "deletePopupNotification");
async function acknowledgePopupNotification({ env, actor, data }) {
  required(data, ["notificationId"]);
  const notification = await first(env, "SELECT * FROM popup_notifications WHERE notification_id=? AND active=1", [data.notificationId]);
@ -2207,18 +2083,17 @@ async function authorizePagePolicy(env, actor, routeName, method) {
    dashboard:'dashboard', clients:'clients', contacts:'clients', projects:'projects',
    'service.requests':'orders', 'service.request':'orders', 'service.request.reply':'orders', 'service.request.read':'orders',
    ads:'ads', 'ads.cancel':'ads', 'ads.archive':'ads', 'ads.settings':'ads', 'ads.summary':'ads',
    'studio.jobs':'studio', 'studio.jobTypes':'studio', 'studio.assets':'studio', 'studio.assignments':'studio',
    tasks:'tasks', 'task.comments':'tasks', 'task.attachments':'tasks', 'task.workUpdates':'tasks',
    invoices:'finance', 'invoices.project':'finance', 'invoices.projectPreview':'finance', 'invoices.pdf':'finance', payments:'finance', expenses:'finance', 'client.statement':'finance',
    'bank.accounts':'banking', 'bank.transactions':'banking', 'bank.deposit':'banking', 'bank.adjustment':'banking',
    'reports.revenue':'reports', 'reports.profitability':'reports', 'reports.productivity':'reports', 'reports.campaigns':'reports',
    documents:'documents', users:'employees', 'users.setActive':'employees', 'users.permissions':'employees',
    approvals:'approvals', 'approvals.apply':'approvals', 'approvals.archive':'approvals', audit:'audit', diagnostics:'settings', 'system.settings':'settings', 'system.health':'settings', 'page.policies':'settings'
  };
  const pageKey = pageByRoute[routeName];
  if (!pageKey) return;
  const portal = managementActor(actor) ? "ADMIN" : actor.userType === "CLIENT" ? "CLIENT" : "EMPLOYEE";
  if (routeName === "studio.jobTypes" && primaryManager(actor)) return;
  if (pageKey === "settings" && primaryManager(actor)) return;
  if (pageKey === "documents" && portal !== "ADMIN") throw new ApiError("FORBIDDEN", "Documents are restricted to management.", {}, 403);
  const policy = await first(env, "SELECT visibility,access_level FROM page_policies WHERE page_key=? AND portal=?", [pageKey, portal]);
@ -2245,8 +2120,6 @@ var ROUTES = Object.freeze({
  "GET approvals": route(listApprovalRequests, "APPROVALS", "VIEW"),
  "POST approvals": route(createApprovalRequest, "APPROVALS", "CREATE"),
  "PUT approvals": route(reviewApprovalRequest, "APPROVALS", "APPROVE"),
  "POST approvals.apply": route(applyPrimaryChange, "APPROVALS", "APPROVE"),
  "POST approvals.archive": route(archiveApprovalRequest, "APPROVALS", "APPROVE"),
  "GET tasks": route(listTasks, "TASKS", "VIEW"),
  "POST tasks": route(createTask, "TASKS", "CREATE"),
  "PUT tasks": route(updateTask, "TASKS", "EDIT"),
@ -2283,9 +2156,6 @@ var ROUTES = Object.freeze({
  "GET studio.jobs": route(listStudioJobs, "STUDIO", "VIEW"),
  "POST studio.jobs": route(createStudioJob, "STUDIO", "CREATE"),
  "PUT studio.jobs": route(updateStudioJob, "STUDIO", "EDIT"),
  "GET studio.jobTypes": route(listStudioJobTypes, "STUDIO", "VIEW"),
  "POST studio.jobTypes": route(createStudioJobType, "SYSTEM", "EDIT"),
  "PUT studio.jobTypes": route(updateStudioJobType, "SYSTEM", "EDIT"),
  "POST studio.assets": route(addStudioAsset, "STUDIO", "EDIT"),
  "GET studio.assignments": route(listStudioAssignments, "STUDIO", "VIEW"),
  "PUT studio.assignments": route(saveStudioAssignments, "STUDIO", "EDIT"),
@ -2307,7 +2177,6 @@ var ROUTES = Object.freeze({
  "GET notifications.manage": route(listManagedNotifications, "SYSTEM", "VIEW"),
  "POST notifications": route(createPopupNotification, "SYSTEM", "EDIT"),
  "PUT notifications": route(updatePopupNotification, "SYSTEM", "EDIT"),
  "DELETE notifications": route(deletePopupNotification, "SYSTEM", "EDIT"),
  "POST notifications.ack": route(acknowledgePopupNotification, "PORTALS", "EDIT"),
  "GET service.requests": route(listServiceRequests, "PORTALS", "VIEW"),
  "GET service.request": route(getServiceRequest, "PORTALS", "VIEW"),
