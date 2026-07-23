import { buildInvoicePdf } from './invoice-pdf.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/errors.js
var ApiError = class extends Error {
  static {
    __name(this, "ApiError");
  }
  constructor(code, message, details = {}, status = 400) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
};
function required(data, fields) {
  const missing = fields.filter((field) => data[field] === void 0 || data[field] === null || String(data[field]).trim() === "");
  if (missing.length) throw new ApiError("VALIDATION_ERROR", "\u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.", { fields: missing });
}
__name(required, "required");

// src/lib/cors.js
function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!origin) return "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!allowed.includes(origin)) throw new ApiError("ORIGIN_DENIED", "\u0627\u0644\u0645\u0635\u062F\u0631 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D.", { origin }, 403);
  return origin;
}
__name(allowedOrigin, "allowedOrigin");
function cors(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Idempotency-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
__name(cors, "cors");

// src/constants.js
var APP = Object.freeze({
  name: "ANC Marketing Agency ERP",
  version: "3.1.0",
  currency: "EGP",
  timezone: "Africa/Cairo"
});
var USER_TYPES = Object.freeze(["ADMIN", "EMPLOYEE", "CLIENT"]);
var ACTIONS = Object.freeze(["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT", "PRINT"]);
var ROLES = Object.freeze(["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "ACCOUNT_MANAGER", "FINANCE", "MEDIA_BUYER", "CREATIVE", "STUDIO", "EMPLOYEE", "VIEWER"]);
var DEFAULT_AD_SETTINGS = Object.freeze({
  "Default Cost Rate": "1.19",
  "Default Commission Rate": "0.2997",
  "Default Currency": "EGP",
  "Minimum Profit Amount": "300",
  "Minimum Profit Margin": "10",
  "Default Bank Account": "",
  "Allow Negative Bank Balance": "FALSE"
});
var DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  "Company Name": "ANC Advertising",
  "Company Legal Name": "ANC Advertising For Advertising Solutions",
  "Company Email": "anc.adv.agency@gmail.com",
  "Company Phone": "+2010 9797 5454",
  "Company Address": "Damanhour, Egypt",
  "Invoice Prefix": "ANC",
  "Invoice Tax Rate": "0",
  "Payment Terms Days": "14",
  "Invoice Footer": "This invoice excludes cancelled orders and cancelled services.",
  "Default Currency": "EGP"
});

// src/lib/response.js
function meta() {
  return { timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: APP.version };
}
__name(meta, "meta");
function success(data = {}, status = 200, headers = {}) {
  return new Response(JSON.stringify({ ok: true, data, meta: meta() }), {
    status,
    headers: { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store", ...headers }
  });
}
__name(success, "success");
function failure(error, headers = {}) {
  const known = error?.code;
  const body = {
    ok: false,
    error: {
      code: known || "INTERNAL_ERROR",
      message: known ? error.message : "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
      details: known ? error.details || {} : {}
    },
    meta: meta()
  };
  return new Response(JSON.stringify(body), {
    status: error?.status || 500,
    headers: { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store", ...headers }
  });
}
__name(failure, "failure");

// src/lib/db.js
var IDENTIFIER = /^[a-z][a-z0-9_]*$/;
function safeIdentifier(value) {
  if (!IDENTIFIER.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
  return value;
}
__name(safeIdentifier, "safeIdentifier");
async function all(env, sql, bindings = []) {
  const result = await env.DB.prepare(sql).bind(...bindings).all();
  return result.results || [];
}
__name(all, "all");
async function first(env, sql, bindings = []) {
  return env.DB.prepare(sql).bind(...bindings).first();
}
__name(first, "first");
async function run(env, sql, bindings = []) {
  return env.DB.prepare(sql).bind(...bindings).run();
}
__name(run, "run");
function statement(env, sql, bindings = []) {
  return env.DB.prepare(sql).bind(...bindings);
}
__name(statement, "statement");
async function batch(env, statements) {
  if (!statements.length) return [];
  return env.DB.batch(statements);
}
__name(batch, "batch");
async function insert(env, table, data) {
  safeIdentifier(table);
  const keys = Object.keys(data).map(safeIdentifier);
  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`;
  await run(env, sql, keys.map((key) => data[key]));
  return data;
}
__name(insert, "insert");
async function update(env, table, data, idField, idValue) {
  safeIdentifier(table);
  safeIdentifier(idField);
  const keys = Object.keys(data).map(safeIdentifier);
  if (!keys.length) return null;
  const sql = `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(",")} WHERE ${idField} = ?`;
  await run(env, sql, [...keys.map((key) => data[key]), idValue]);
  return first(env, `SELECT * FROM ${table} WHERE ${idField} = ?`, [idValue]);
}
__name(update, "update");
async function count(env, table, where = "1=1", bindings = []) {
  safeIdentifier(table);
  const row = await first(env, `SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`, bindings);
  return Number(row?.count || 0);
}
__name(count, "count");

// src/lib/utils.js
var now = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "now");
var id = /* @__PURE__ */ __name((prefix) => `${prefix}-${crypto.randomUUID()}`, "id");
var text = /* @__PURE__ */ __name((value) => value === null || value === void 0 ? "" : String(value).trim(), "text");
var email = /* @__PURE__ */ __name((value) => text(value).toLowerCase(), "email");
var number = /* @__PURE__ */ __name((value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback, "number");
var round = /* @__PURE__ */ __name((value) => Math.round((number(value) + Number.EPSILON) * 100) / 100, "round");
var bool = /* @__PURE__ */ __name((value) => value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true", "bool");
var clamp = /* @__PURE__ */ __name((value, minimum, maximum) => Math.min(maximum, Math.max(minimum, number(value))), "clamp");
function searchMatch(row, query, fields) {
  const needle = text(query).toLowerCase();
  return !needle || fields.some((field) => text(row[field]).toLowerCase().includes(needle));
}
__name(searchMatch, "searchMatch");
function without(object, fields) {
  const blocked = new Set(fields);
  return Object.fromEntries(Object.entries(object).filter(([key]) => !blocked.has(key)));
}
__name(without, "without");

// src/lib/audit.js
async function audit(env, actor, action, entityType = "", entityId = "", details = {}) {
  const record = {
    audit_id: id("AUD"),
    timestamp: now(),
    actor: actor?.email || String(actor || "SYSTEM"),
    action,
    entity_type: entityType,
    entity_id: entityId || "",
    details: JSON.stringify(details || {})
  };
  await insert(env, "audit_log", record);
  return record;
}
__name(audit, "audit");
async function auditError(env, actor, error, requestId, route2) {
  try {
    await audit(env, actor, "ERROR", route2 || "UNKNOWN", "", {
      requestId,
      code: error?.code || "INTERNAL_ERROR",
      message: error?.message || String(error),
      stack: error?.stack || ""
    });
  } catch {
  }
}
__name(auditError, "auditError");

// src/auth/google.js
var keyCache = { expiresAt: 0, keys: [] };
function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
__name(decodeBase64Url, "decodeBase64Url");
function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}
__name(decodeJson, "decodeJson");
async function googleKeys() {
  if (Date.now() < keyCache.expiresAt && keyCache.keys.length) return keyCache.keys;
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!response.ok) throw new ApiError("GOOGLE_KEYS_UNAVAILABLE", "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062C\u0644\u0633\u0629 Google \u062D\u0627\u0644\u064A\u064B\u0627.", {}, 503);
  const payload = await response.json();
  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  keyCache = { keys: payload.keys || [], expiresAt: Date.now() + maxAge * 1e3 };
  return keyCache.keys;
}
__name(googleKeys, "googleKeys");
async function verifyGoogleIdToken(token, clientId) {
  if (!token) throw new ApiError("AUTH_REQUIRED", "\u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u062D\u0633\u0627\u0628 Google.", {}, 401);
  if (!clientId) throw new ApiError("OAUTH_NOT_CONFIGURED", "\u0644\u0645 \u064A\u062A\u0645 \u0625\u0639\u062F\u0627\u062F Google Client ID.", {}, 500);
  const parts = token.split(".");
  if (parts.length !== 3) throw new ApiError("INVALID_GOOGLE_TOKEN", "\u062C\u0644\u0633\u0629 Google \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", {}, 401);
  let header;
  let claims;
  try {
    header = decodeJson(parts[0]);
    claims = decodeJson(parts[1]);
  } catch {
    throw new ApiError("INVALID_GOOGLE_TOKEN", "\u062C\u0644\u0633\u0629 Google \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", {}, 401);
  }
  if (header.alg !== "RS256" || !header.kid) throw new ApiError("INVALID_GOOGLE_TOKEN", "\u062A\u0648\u0642\u064A\u0639 \u062C\u0644\u0633\u0629 Google \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", {}, 401);
  const jwk = (await googleKeys()).find((key2) => key2.kid === header.kid);
  if (!jwk) {
    keyCache.expiresAt = 0;
    throw new ApiError("GOOGLE_KEY_NOT_FOUND", "\u062A\u0639\u0630\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0641\u062A\u0627\u062D \u062A\u0648\u0642\u064A\u0639 Google. \u0623\u0639\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644.", {}, 401);
  }
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const validSignature = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!validSignature) throw new ApiError("INVALID_GOOGLE_TOKEN", "\u062A\u0648\u0642\u064A\u0639 \u062C\u0644\u0633\u0629 Google \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", {}, 401);
  const nowSeconds = Math.floor(Date.now() / 1e3);
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)) throw new ApiError("INVALID_TOKEN_ISSUER", "\u062C\u0647\u0629 \u0625\u0635\u062F\u0627\u0631 \u062C\u0644\u0633\u0629 Google \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", {}, 401);
  if (claims.aud !== clientId) throw new ApiError("INVALID_TOKEN_AUDIENCE", "\u062C\u0644\u0633\u0629 Google \u0644\u0627 \u062A\u062E\u0635 \u0647\u0630\u0627 \u0627\u0644\u0646\u0638\u0627\u0645.", {}, 401);
  if (Number(claims.exp) <= nowSeconds) throw new ApiError("TOKEN_EXPIRED", "\u0627\u0646\u062A\u0647\u062A \u062C\u0644\u0633\u0629 Google. \u0633\u062C\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.", {}, 401);
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new ApiError("EMAIL_NOT_VERIFIED", "\u0628\u0631\u064A\u062F Google \u063A\u064A\u0631 \u0645\u0648\u062B\u0651\u0642.", {}, 403);
  if (!claims.sub || !claims.email) throw new ApiError("INVALID_GOOGLE_TOKEN", "\u062C\u0644\u0633\u0629 Google \u0644\u0627 \u062A\u062D\u062A\u0648\u064A \u0647\u0648\u064A\u0629 \u0645\u0643\u062A\u0645\u0644\u0629.", {}, 401);
  return claims;
}
__name(verifyGoogleIdToken, "verifyGoogleIdToken");

// src/auth/security.js
var ROLE_RULES = Object.freeze({
  MANAGER: { DASHBOARD: ["VIEW"], CRM: ["VIEW", "CREATE", "EDIT"], TASKS: ["VIEW", "CREATE", "EDIT", "APPROVE"], ADS: ["VIEW", "CREATE", "EDIT", "APPROVE"], BANKING: ["VIEW", "CREATE", "EDIT", "APPROVE"], FINANCE: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT", "PRINT"], STUDIO: ["VIEW", "CREATE", "EDIT"], USERS: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE"], REPORTS: ["VIEW", "EXPORT"], PORTALS: ["VIEW", "CREATE", "EDIT", "DELETE"], APPROVALS: ["VIEW", "APPROVE"], SYSTEM: ["VIEW", "EDIT"] },
  ASSISTANT_MANAGER: { DASHBOARD: ["VIEW"], CRM: ["VIEW"], TASKS: ["VIEW"], ADS: ["VIEW"], BANKING: ["VIEW"], FINANCE: ["VIEW"], STUDIO: ["VIEW"], USERS: ["VIEW"], REPORTS: ["VIEW"], PORTALS: ["VIEW"], APPROVALS: ["VIEW", "CREATE"], SYSTEM: ["VIEW"] },
  ACCOUNT_MANAGER: { DASHBOARD: ["VIEW"], CRM: ["VIEW", "CREATE", "EDIT"], TASKS: ["VIEW", "CREATE", "EDIT"], ADS: ["VIEW", "CREATE", "EDIT"], STUDIO: ["VIEW", "CREATE", "EDIT"], PORTALS: ["VIEW"] },
  FINANCE: { DASHBOARD: ["VIEW"], CRM: ["VIEW"], ADS: ["VIEW"], BANKING: ["VIEW", "CREATE", "EDIT", "APPROVE"], FINANCE: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT", "PRINT"], REPORTS: ["VIEW", "EXPORT", "PRINT"] },
  MEDIA_BUYER: { ADS: ["VIEW", "EDIT"], TASKS: ["VIEW", "EDIT"], PORTALS: ["VIEW", "EDIT"] },
  CREATIVE: { TASKS: ["VIEW", "EDIT"], STUDIO: ["VIEW", "EDIT", "CREATE"], PORTALS: ["VIEW", "EDIT"] },
  STUDIO: { TASKS: ["VIEW", "EDIT"], STUDIO: ["VIEW", "EDIT", "CREATE"], PORTALS: ["VIEW", "EDIT"] },
  EMPLOYEE: { PORTALS: ["VIEW", "EDIT"], TASKS: ["VIEW", "EDIT"] },
  VIEWER: { DASHBOARD: ["VIEW"] },
  CLIENT: { PORTALS: ["VIEW"] }
});
async function authenticate(env, token) {
  const claims = await verifyGoogleIdToken(token, env.GOOGLE_CLIENT_ID);
  let user = await first(env, "SELECT * FROM users WHERE google_sub = ?", [claims.sub]);
  if (!user) user = await first(env, "SELECT * FROM users WHERE email = ? COLLATE NOCASE", [email(claims.email)]);
  if (!user || !user.active || !["ADMIN", "EMPLOYEE", "CLIENT"].includes(user.user_type)) {
    throw new ApiError("ACCESS_DENIED", "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u063A\u064A\u0631 \u0645\u0633\u062C\u0644 \u0623\u0648 \u0623\u0646 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0648\u0642\u0648\u0641.", {}, 403);
  }
  if (user.google_sub && user.google_sub !== claims.sub) throw new ApiError("GOOGLE_ACCOUNT_MISMATCH", "\u062D\u0633\u0627\u0628 Google \u0644\u0627 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0633\u062C\u0644.", {}, 403);
  if (!user.google_sub) {
    await run(env, "UPDATE users SET google_sub = ?, updated_at = ? WHERE user_id = ?", [claims.sub, (/* @__PURE__ */ new Date()).toISOString(), user.user_id]);
    user.google_sub = claims.sub;
  }
  return {
    userId: user.user_id,
    employeeId: user.employee_id,
    clientId: user.client_id,
    email: email(user.email),
    name: user.full_name,
    userType: user.user_type,
    role: user.role || user.user_type,
    googleSub: claims.sub
  };
}
__name(authenticate, "authenticate");
async function authorize(env, actor, module, action) {
  if (actor.userType === "ADMIN" || actor.role === "ADMIN" || module === "AUTH") return actor;
  if (actor.employeeId) {
    const override = await first(env, `SELECT ep.allowed FROM employee_permissions ep JOIN permissions p ON p.permission_id = ep.permission_id WHERE ep.employee_id = ? AND p.module = ? AND p.action = ?`, [actor.employeeId, module, action]);
    if (override) {
      if (override.allowed) return actor;
      throw new ApiError("FORBIDDEN", "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629.", { module, action }, 403);
    }
  }
  const role = actor.userType === "CLIENT" ? "CLIENT" : actor.role;
  if (!(ROLE_RULES[role]?.[module] || []).includes(action)) throw new ApiError("FORBIDDEN", "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629.", { module, action }, 403);
  return actor;
}
__name(authorize, "authorize");
function publicActor(actor) {
  return { userId: actor.userId, employeeId: actor.employeeId, clientId: actor.clientId, email: actor.email, name: actor.name, userType: actor.userType, role: actor.role };
}
__name(publicActor, "publicActor");
function sanitizeAd(ad, actor) {
  if (actor.userType === "ADMIN" || ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "FINANCE", "ACCOUNT_MANAGER"].includes(actor.role)) return ad;
  return without(ad, ["internal_cost", "commission", "profit", "profit_margin", "sale_price", "cost_rate", "commission_rate", "minimum_profit_amount", "minimum_profit_margin", "bank_account_id"]);
}
__name(sanitizeAd, "sanitizeAd");

// src/routes/auth.js
async function googleLogin({ env, actor }) {
  await run(env, "UPDATE users SET last_login = ?, updated_at = ? WHERE user_id = ?", [now(), now(), actor.userId]);
  await audit(env, actor, "AUTH_GOOGLE", "USER", actor.userId);
  return { user: publicActor(actor) };
}
__name(googleLogin, "googleLogin");
async function currentUser({ actor }) {
  return { user: publicActor(actor) };
}
__name(currentUser, "currentUser");
async function logout({ env, actor }) {
  await audit(env, actor, "AUTH_LOGOUT", "USER", actor.userId);
  return { loggedOut: true };
}
__name(logout, "logout");

// src/routes/dashboard.js
var sum = /* @__PURE__ */ __name((rows, field) => round(rows.reduce((total, row) => total + number(row[field]), 0)), "sum");
function monthKey(value) {
  return String(value || "").slice(0, 7);
}
__name(monthKey, "monthKey");
function monthly(invoices, expenses, payments) {
  const result = [];
  const today = /* @__PURE__ */ new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1));
    const key = date.toISOString().slice(0, 7);
    result.push({
      month: key,
      revenue: sum(invoices.filter((row) => monthKey(row.issue_date) === key), "amount"),
      expenses: sum(expenses.filter((row) => monthKey(row.expense_date) === key), "amount"),
      collected: sum(payments.filter((row) => monthKey(row.payment_date) === key), "amount")
    });
  }
  return result;
}
__name(monthly, "monthly");
async function dashboard({ env }) {
  const [ads, invoices, payments, expenses, accounts, statements, clients, projects, tasks] = await Promise.all([
    all(env, "SELECT * FROM paid_ads"),
    all(env, `SELECT * FROM invoices WHERE status != 'CANCELLED'`),
    all(env, "SELECT * FROM payments"),
    all(env, "SELECT * FROM expenses"),
    all(env, "SELECT * FROM bank_accounts WHERE active = 1"),
    all(env, "SELECT * FROM client_statements"),
    all(env, "SELECT * FROM clients"),
    all(env, "SELECT * FROM projects"),
    all(env, "SELECT * FROM tasks")
  ]);
  const validAds = ads.filter((row) => row.status !== "CANCELLED");
  const revenue = sum(invoices, "amount") + sum(validAds, "sale_price");
  const adExpenses = sum(validAds, "base_spend") + sum(validAds, "internal_cost");
  const otherExpenses = sum(expenses, "amount");
  const collected = sum(payments, "amount");
  const outstanding = round(sum(statements, "debit") - sum(statements, "credit"));
  const netProfit = round(revenue - adExpenses - otherExpenses);
  const current = Date.now();
  const taskStatus = {};
  tasks.forEach((row) => {
    taskStatus[row.status] = (taskStatus[row.status] || 0) + 1;
  });
  return {
    metrics: {
      revenue,
      adExpenses,
      expenses: otherExpenses,
      netProfit,
      profitMargin: revenue ? round(netProfit / revenue * 100) : 0,
      collected,
      outstanding,
      bankBalance: sum(accounts, "current_balance"),
      activeClients: clients.filter((row) => row.status === "ACTIVE").length,
      activeProjects: projects.filter((row) => row.status === "ACTIVE").length,
      activeAds: ads.filter((row) => ["ACTIVE", "ON_AIR"].includes(row.status)).length,
      lowProfitAds: ads.filter((row) => number(row.profit) < number(row.minimum_profit_amount) || number(row.profit_margin) < number(row.minimum_profit_margin)).length,
      overdueTasks: tasks.filter((row) => row.due_date && new Date(row.due_date).getTime() < current && row.status !== "DONE").length
    },
    taskStatus,
    monthly: monthly(invoices, expenses, payments)
  };
}
__name(dashboard, "dashboard");

// src/lib/serialize.js
var ACRONYMS = /* @__PURE__ */ new Map([
  ["id", "ID"],
  ["url", "URL"],
  ["pdf", "PDF"],
  ["api", "API"]
]);
var SPECIAL = Object.freeze({
  file_key: "File ID",
  pdf_key: "PDF File ID",
  pdf_url: "PDF URL",
  is_read: "Read"
});
var BOOLEAN_FIELDS = /* @__PURE__ */ new Set(["active", "allowed", "auto_debit", "must_change_password", "primary_contact", "is_read"]);
function label(key) {
  if (SPECIAL[key]) return SPECIAL[key];
  return key.split("_").map((part) => ACRONYMS.get(part) || `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}
__name(label, "label");
function toApi(row) {
  if (!row) return null;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [label(key), BOOLEAN_FIELDS.has(key) ? Boolean(value) : value]));
}
__name(toApi, "toApi");
var toApiList = /* @__PURE__ */ __name((rows) => rows.map(toApi), "toApiList");

// src/routes/clients.js
var CLIENT_STATUSES = ["LEAD", "ACTIVE", "INACTIVE", "ARCHIVED"];
async function activity(env, actor, clientId, type, title, details = "") {
  return insert(env, "client_activities", {
    activity_id: id("ACT"),
    client_id: clientId,
    employee_id: actor?.employeeId || null,
    activity_type: type,
    title,
    details,
    activity_date: now(),
    created_at: now()
  });
}
__name(activity, "activity");
async function listClients({ env, data }) {
  const rows = await all(env, "SELECT * FROM clients ORDER BY created_at DESC");
  const filtered = rows.filter((row) => (!data.status || row.status === data.status) && searchMatch(row, data.q, ["client_name", "primary_contact", "email", "phone", "industry"]));
  return { clients: toApiList(filtered), total: filtered.length };
}
__name(listClients, "listClients");
async function createClient({ env, actor, data }) {
  required(data, ["clientName"]);
  const status = String(data.status || "LEAD").toUpperCase();
  if (!CLIENT_STATUSES.includes(status)) throw new ApiError("INVALID_STATUS", "\u062D\u0627\u0644\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", { allowed: CLIENT_STATUSES });
  const timestamp = now();
  const record = {
    client_id: id("CLI"),
    client_name: text(data.clientName),
    status,
    primary_contact: text(data.primaryContact),
    email: email(data.email),
    phone: text(data.phone),
    industry: text(data.industry),
    account_manager: text(data.accountManager || actor.employeeId),
    created_at: timestamp,
    updated_at: timestamp
  };
  await insert(env, "clients", record);
  await activity(env, actor, record.client_id, "CLIENT_CREATED", "\u0625\u0646\u0634\u0627\u0621 \u0639\u0645\u064A\u0644", record.client_name);
  await audit(env, actor, "CLIENT_CREATED", "CLIENT", record.client_id, record);
  return { client: toApi(record) };
}
__name(createClient, "createClient");
async function updateClient({ env, actor, data }) {
  required(data, ["clientId"]);
  const existing = await first(env, "SELECT * FROM clients WHERE client_id = ?", [data.clientId]);
  if (!existing) throw new ApiError("CLIENT_NOT_FOUND", "\u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const status = data.status ? String(data.status).toUpperCase() : existing.status;
  if (!CLIENT_STATUSES.includes(status)) throw new ApiError("INVALID_STATUS", "\u062D\u0627\u0644\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", { allowed: CLIENT_STATUSES });
  const changes = {
    client_name: data.clientName === void 0 ? existing.client_name : text(data.clientName),
    status,
    primary_contact: data.primaryContact === void 0 ? existing.primary_contact : text(data.primaryContact),
    email: data.email === void 0 ? existing.email : email(data.email),
    phone: data.phone === void 0 ? existing.phone : text(data.phone),
    industry: data.industry === void 0 ? existing.industry : text(data.industry),
    account_manager: data.accountManager === void 0 ? existing.account_manager : text(data.accountManager),
    updated_at: now()
  };
  const saved = await update(env, "clients", changes, "client_id", data.clientId);
  await activity(env, actor, data.clientId, "CLIENT_UPDATED", "\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644", JSON.stringify(data));
  await audit(env, actor, "CLIENT_UPDATED", "CLIENT", data.clientId, data);
  return { client: toApi(saved) };
}
__name(updateClient, "updateClient");
async function listContacts({ env, data }) {
  const rows = data.clientId ? await all(env, "SELECT * FROM contacts WHERE client_id = ? ORDER BY created_at DESC", [data.clientId]) : await all(env, "SELECT * FROM contacts ORDER BY created_at DESC");
  return { contacts: toApiList(rows) };
}
__name(listContacts, "listContacts");
async function createContact({ env, actor, data }) {
  required(data, ["clientId", "fullName"]);
  if (!await first(env, "SELECT client_id FROM clients WHERE client_id = ?", [data.clientId])) throw new ApiError("CLIENT_NOT_FOUND", "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const timestamp = now();
  const record = {
    contact_id: id("CON"),
    client_id: data.clientId,
    full_name: text(data.fullName),
    job_title: text(data.jobTitle),
    email: email(data.email),
    phone: text(data.phone),
    primary_contact: data.primaryContact ? 1 : 0,
    created_at: timestamp,
    updated_at: timestamp
  };
  await insert(env, "contacts", record);
  await activity(env, actor, data.clientId, "CONTACT_CREATED", "\u062C\u0647\u0629 \u0627\u062A\u0635\u0627\u0644 \u062C\u062F\u064A\u062F\u0629", record.full_name);
  await audit(env, actor, "CONTACT_CREATED", "CONTACT", record.contact_id, record);
  return { contact: toApi(record) };
}
__name(createContact, "createContact");

// src/routes/projects.js
var STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
var PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
async function listProjects({ env, data }) {
  const rows = data.clientId ? await all(env, "SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC", [data.clientId]) : await all(env, "SELECT * FROM projects ORDER BY created_at DESC");
  return { projects: toApiList(rows) };
}
__name(listProjects, "listProjects");
async function createProject({ env, actor, data }) {
  required(data, ["clientId", "projectName"]);
  if (!await first(env, "SELECT client_id FROM clients WHERE client_id = ?", [data.clientId])) throw new ApiError("CLIENT_NOT_FOUND", "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const status = String(data.status || "PLANNED").toUpperCase();
  const priority = String(data.priority || "MEDIUM").toUpperCase();
  if (!STATUSES.includes(status) || !PRIORITIES.includes(priority)) throw new ApiError("INVALID_PROJECT_DATA", "\u062D\u0627\u0644\u0629 \u0623\u0648 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.");
  const timestamp = now();
  const record = {
    project_id: id("PRJ"),
    client_id: data.clientId,
    project_name: text(data.projectName),
    status,
    priority,
    account_manager: text(data.accountManager || actor.employeeId),
    start_date: data.startDate || timestamp.slice(0, 10),
    due_date: data.dueDate || null,
    budget: round(data.budget),
    currency: data.currency || "EGP",
    created_at: timestamp,
    updated_at: timestamp
  };
  await insert(env, "projects", record);
  await activity(env, actor, data.clientId, "PROJECT_CREATED", "\u0625\u0646\u0634\u0627\u0621 \u0645\u0634\u0631\u0648\u0639", record.project_name);
  await audit(env, actor, "PROJECT_CREATED", "PROJECT", record.project_id, record);
  return { project: toApi(record) };
}
__name(createProject, "createProject");
async function updateProject({ env, actor, data }) {
  required(data, ["projectId"]);
  const existing = await first(env, "SELECT * FROM projects WHERE project_id = ?", [data.projectId]);
  if (!existing) throw new ApiError("PROJECT_NOT_FOUND", "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const status = data.status ? String(data.status).toUpperCase() : existing.status;
  const priority = data.priority ? String(data.priority).toUpperCase() : existing.priority;
  if (!STATUSES.includes(status) || !PRIORITIES.includes(priority)) throw new ApiError("INVALID_PROJECT_DATA", "\u062D\u0627\u0644\u0629 \u0623\u0648 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.");
  const saved = await update(env, "projects", {
    client_id: data.clientId ?? existing.client_id,
    project_name: data.projectName ?? existing.project_name,
    status,
    priority,
    account_manager: data.accountManager ?? existing.account_manager,
    start_date: data.startDate ?? existing.start_date,
    due_date: data.dueDate ?? existing.due_date,
    budget: data.budget === void 0 ? existing.budget : round(data.budget),
    currency: data.currency ?? existing.currency,
    updated_at: now()
  }, "project_id", data.projectId);
  await audit(env, actor, "PROJECT_UPDATED", "PROJECT", data.projectId, data);
  return { project: toApi(saved) };
}
__name(updateProject, "updateProject");

// src/routes/approvals.js
var APPROVAL_ENTITY_TYPES = ["CLIENT", "PROJECT"];
var APPROVAL_ACTIONS = ["CREATE", "UPDATE", "STATUS", "ARCHIVE", "RESTORE"];
function approvalJson(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}
__name(approvalJson, "approvalJson");
function approvalToApi(row) {
  return {
    approvalId: row.approval_id,
    requestedByUserId: row.requested_by_user_id,
    requestedBy: row.requested_by_email,
    entityType: String(row.entity_type || "").toLowerCase(),
    entityId: row.entity_id,
    action: row.action,
    payload: approvalJson(row.payload_json),
    before: approvalJson(row.before_json),
    description: row.description,
    status: row.status,
    reviewedBy: row.reviewed_by_email,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  };
}
__name(approvalToApi, "approvalToApi");
async function approvalEntity(env, entityType, entityId) {
  if (!entityId) return null;
  if (entityType === "CLIENT") return first(env, "SELECT * FROM clients WHERE client_id = ?", [entityId]);
  return first(env, "SELECT * FROM projects WHERE project_id = ?", [entityId]);
}
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
  if (actor.role !== "ASSISTANT_MANAGER") throw new ApiError("APPROVAL_REQUEST_NOT_REQUIRED", "طلبات الاعتماد مخصصة لتعديلات المدير المساعد.", {}, 403);
  required(data, ["entityType", "action", "description"]);
  const entityType = String(data.entityType).toUpperCase();
  const action = String(data.action).toUpperCase();
  if (!APPROVAL_ENTITY_TYPES.includes(entityType)) throw new ApiError("INVALID_APPROVAL_ENTITY", "نوع السجل المطلوب اعتماده غير مدعوم.");
  if (!APPROVAL_ACTIONS.includes(action)) throw new ApiError("INVALID_APPROVAL_ACTION", "نوع التعديل المطلوب اعتماده غير مدعوم.");
  if (!data.payload || typeof data.payload !== "object" || Array.isArray(data.payload)) throw new ApiError("INVALID_APPROVAL_PAYLOAD", "بيانات التعديل غير صالحة.");
  if (action === "CREATE") {
    if (entityType === "CLIENT") required(data.payload, ["clientName"]);
    else required(data.payload, ["clientId", "projectName"]);
  }
  const approvalId = id("APR");
  const entityId = action === "CREATE" ? text(data.entityId || `NEW-${approvalId}`) : text(data.entityId);
  if (action !== "CREATE" && !entityId) throw new ApiError("VALIDATION_ERROR", "معرف السجل مطلوب.");
  const existing = action === "CREATE" ? null : await approvalEntity(env, entityType, entityId);
  if (action !== "CREATE" && !existing) throw new ApiError("APPROVAL_ENTITY_NOT_FOUND", "السجل المطلوب تعديله غير موجود.", {}, 404);
  const duplicate = await first(env, "SELECT approval_id FROM approval_requests WHERE requested_by_user_id = ? AND entity_type = ? AND entity_id = ? AND action = ? AND status IN ('PENDING','PROCESSING')", [actor.userId, entityType, entityId, action]);
  if (duplicate) throw new ApiError("APPROVAL_ALREADY_PENDING", "يوجد بالفعل طلب مماثل ينتظر الاعتماد.", { approvalId: duplicate.approval_id }, 409);
  const record = {
    approval_id: approvalId,
    requested_by_user_id: actor.userId,
    requested_by_email: actor.email,
    entity_type: entityType,
    entity_id: entityId,
    action,
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
async function executeApprovedChange(env, actor, request) {
  const payload = approvalJson(request.payload_json);
  if (request.entity_type === "CLIENT") {
    if (request.action === "CREATE") return createClient({ env, actor, data: payload });
    payload.clientId = request.entity_id;
    if (request.action === "ARCHIVE") payload.status = "ARCHIVED";
    if (request.action === "RESTORE") payload.status = "ACTIVE";
    return updateClient({ env, actor, data: payload });
  }
  if (request.action === "CREATE") return createProject({ env, actor, data: payload });
  payload.projectId = request.entity_id;
  if (request.action === "ARCHIVE") payload.status = "CANCELLED";
  if (request.action === "RESTORE") payload.status = "PLANNED";
  return updateProject({ env, actor, data: payload });
}
__name(executeApprovedChange, "executeApprovedChange");
async function reviewApprovalRequest({ env, actor, data }) {
  required(data, ["approvalId", "decision"]);
  const decision = String(data.decision).toUpperCase();
  if (!["APPROVED", "REJECTED"].includes(decision)) throw new ApiError("INVALID_APPROVAL_DECISION", "قرار الاعتماد غير صالح.");
  const request = await first(env, "SELECT * FROM approval_requests WHERE approval_id = ?", [data.approvalId]);
  if (!request) throw new ApiError("APPROVAL_NOT_FOUND", "طلب الاعتماد غير موجود.", {}, 404);
  if (request.status !== "PENDING") throw new ApiError("APPROVAL_ALREADY_REVIEWED", "تمت مراجعة هذا الطلب من قبل.", { status: request.status }, 409);
  const reviewedAt = now();
  const reviewNote = text(data.reviewNote).slice(0, 500);
  if (decision === "REJECTED") {
    const result = await run(env, "UPDATE approval_requests SET status='REJECTED', reviewed_by_user_id=?, reviewed_by_email=?, review_note=?, reviewed_at=? WHERE approval_id=? AND status='PENDING'", [actor.userId, actor.email, reviewNote, reviewedAt, request.approval_id]);
    if (!number(result.meta?.changes)) throw new ApiError("APPROVAL_ALREADY_REVIEWED", "تمت مراجعة هذا الطلب من قبل.", {}, 409);
    const saved = await first(env, "SELECT * FROM approval_requests WHERE approval_id = ?", [request.approval_id]);
    await audit(env, actor, "APPROVAL_REJECTED", request.entity_type, request.entity_id, { approvalId: request.approval_id, reviewNote });
    return { approval: approvalToApi(saved), result: null };
  }
  const claim = await run(env, "UPDATE approval_requests SET status='PROCESSING', reviewed_by_user_id=?, reviewed_by_email=?, review_note=?, reviewed_at=? WHERE approval_id=? AND status='PENDING'", [actor.userId, actor.email, reviewNote, reviewedAt, request.approval_id]);
  if (!number(claim.meta?.changes)) throw new ApiError("APPROVAL_ALREADY_REVIEWED", "تمت مراجعة هذا الطلب من قبل.", {}, 409);
  try {
    const applied = await executeApprovedChange(env, actor, request);
    const createdEntityId = request.action === "CREATE"
      ? applied.client?.["Client ID"] || applied.project?.["Project ID"] || request.entity_id
      : request.entity_id;
    await run(env, "UPDATE approval_requests SET status='APPROVED', entity_id=? WHERE approval_id=? AND status='PROCESSING'", [createdEntityId, request.approval_id]);
    const saved = await first(env, "SELECT * FROM approval_requests WHERE approval_id = ?", [request.approval_id]);
    await audit(env, actor, "APPROVAL_APPROVED", request.entity_type, createdEntityId, { approvalId: request.approval_id, action: request.action, reviewNote });
    return { approval: approvalToApi(saved), result: applied };
  } catch (error) {
    await run(env, "UPDATE approval_requests SET status='PENDING', reviewed_by_user_id=NULL, reviewed_by_email='', review_note='', reviewed_at=NULL WHERE approval_id=? AND status='PROCESSING'", [request.approval_id]);
    throw error;
  }
}
__name(reviewApprovalRequest, "reviewApprovalRequest");
// src/routes/tasks.js
var STATUSES2 = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
var PRIORITIES2 = ["LOW", "MEDIUM", "HIGH", "URGENT"];
var unrestricted = /* @__PURE__ */ __name((actor) => actor.userType === "ADMIN" || ["ADMIN", "MANAGER", "ACCOUNT_MANAGER"].includes(actor.role), "unrestricted");
async function selectedEmployee(env, value) {
  const employeeId = text(value);
  if (!employeeId) return null;
  const employee = await first(env, "SELECT * FROM employees WHERE employee_id = ? AND active = 1", [employeeId]);
  if (!employee) throw new ApiError("EMPLOYEE_NOT_FOUND", "\u0627\u0644\u0645\u0648\u0638\u0641 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0646\u0634\u0637.", { employeeId }, 404);
  return employee;
}
__name(selectedEmployee, "selectedEmployee");
async function selectedProject(env, value) {
  const projectId = text(value);
  if (!projectId) return null;
  const project = await first(env, "SELECT * FROM projects WHERE project_id = ?", [projectId]);
  if (!project) throw new ApiError("PROJECT_NOT_FOUND", "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", { projectId }, 404);
  return project;
}
__name(selectedProject, "selectedProject");
async function accessibleTask(env, taskId, actor) {
  const task = await first(env, "SELECT * FROM tasks WHERE task_id = ?", [taskId]);
  if (!task || !unrestricted(actor) && task.employee_id !== actor.employeeId && email(task.assigned_email) !== actor.email) throw new ApiError("TASK_NOT_FOUND", "\u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u0644\u0643.", {}, 404);
  return task;
}
__name(accessibleTask, "accessibleTask");
async function listTasks({ env, actor, data }) {
  let rows = unrestricted(actor) ? await all(env, "SELECT * FROM tasks ORDER BY created_at DESC") : await all(env, "SELECT * FROM tasks WHERE employee_id = ? OR assigned_email = ? COLLATE NOCASE ORDER BY created_at DESC", [actor.employeeId, actor.email]);
  if (data.status) rows = rows.filter((row) => row.status === data.status);
  const employees = await all(env, "SELECT employee_id,full_name,email,role FROM employees WHERE active = 1 ORDER BY full_name");
  return { tasks: toApiList(rows), employees: toApiList(employees) };
}
__name(listTasks, "listTasks");
async function createTask({ env, actor, data }) {
  required(data, ["taskName"]);
  const status = String(data.status || "TODO").toUpperCase();
  const priority = String(data.priority || "MEDIUM").toUpperCase();
  if (!STATUSES2.includes(status) || !PRIORITIES2.includes(priority)) throw new ApiError("INVALID_TASK_DATA", "\u062D\u0627\u0644\u0629 \u0623\u0648 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.");
  const [employee, project] = await Promise.all([selectedEmployee(env, data.employeeId), selectedProject(env, data.projectId)]);
  const timestamp = now();
  const record = {
    task_id: id("TSK"),
    project_id: project?.project_id || null,
    task_name: text(data.taskName),
    status,
    priority,
    assignee: employee?.full_name || text(data.assignee),
    employee_id: employee?.employee_id || null,
    assigned_email: employee?.email || email(data.assignedEmail),
    description: text(data.description),
    brief: text(data.brief),
    estimated_hours: number(data.estimatedHours),
    due_date: data.dueDate || null,
    created_at: timestamp,
    updated_at: timestamp
  };
  await insert(env, "tasks", record);
  await audit(env, actor, "TASK_CREATED", "TASK", record.task_id, record);
  return { task: toApi(record) };
}
__name(createTask, "createTask");
async function updateTask({ env, actor, data }) {
  required(data, ["taskId"]);
  const existing = await accessibleTask(env, data.taskId, actor);
  const status = data.status ? String(data.status).toUpperCase() : existing.status;
  const priority = data.priority ? String(data.priority).toUpperCase() : existing.priority;
  if (!STATUSES2.includes(status) || !PRIORITIES2.includes(priority)) throw new ApiError("INVALID_TASK_DATA", "\u062D\u0627\u0644\u0629 \u0623\u0648 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0645\u0647\u0645\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.");
  const employeeChanged = data.employeeId !== void 0;
  const projectChanged = data.projectId !== void 0;
  const [employee, project] = await Promise.all([
    employeeChanged ? selectedEmployee(env, data.employeeId) : null,
    projectChanged ? selectedProject(env, data.projectId) : null
  ]);
  const saved = await update(env, "tasks", {
    project_id: projectChanged ? project?.project_id || null : existing.project_id,
    task_name: data.taskName ?? existing.task_name,
    status,
    priority,
    assignee: employeeChanged ? employee?.full_name || text(data.assignee) : data.assignee ?? existing.assignee,
    employee_id: employeeChanged ? employee?.employee_id || null : existing.employee_id,
    assigned_email: employeeChanged ? employee?.email || email(data.assignedEmail) : data.assignedEmail === void 0 ? existing.assigned_email : email(data.assignedEmail),
    description: data.description ?? existing.description,
    brief: data.brief ?? existing.brief,
    estimated_hours: data.estimatedHours === void 0 ? existing.estimated_hours : number(data.estimatedHours),
    due_date: data.dueDate ?? existing.due_date,
    updated_at: now()
  }, "task_id", data.taskId);
  await audit(env, actor, "TASK_UPDATED", "TASK", data.taskId, data);
  return { task: toApi(saved) };
}
__name(updateTask, "updateTask");
async function addTaskComment({ env, actor, data }) {
  required(data, ["taskId", "comment"]);
  await accessibleTask(env, data.taskId, actor);
  const timestamp = now();
  const record = { comment_id: id("COM"), task_id: data.taskId, employee_id: actor.employeeId || null, comment: text(data.comment), created_at: timestamp, updated_at: timestamp };
  await insert(env, "task_comments", record);
  await audit(env, actor, "TASK_COMMENTED", "TASK", data.taskId);
  return { comment: toApi(record) };
}
__name(addTaskComment, "addTaskComment");
async function addTaskAttachment({ env, actor, data }) {
  required(data, ["taskId", "fileName", "fileUrl"]);
  await accessibleTask(env, data.taskId, actor);
  const record = { attachment_id: id("ATT"), task_id: data.taskId, file_key: text(data.fileId), file_name: text(data.fileName), file_url: text(data.fileUrl), uploaded_by: actor.email, created_at: now() };
  await insert(env, "task_attachments", record);
  await audit(env, actor, "TASK_ATTACHMENT_ADDED", "TASK", data.taskId, { url: record.file_url });
  return { attachment: toApi(record) };
}
__name(addTaskAttachment, "addTaskAttachment");
async function addWorkUpdate({ env, actor, data }) {
  required(data, ["taskId", "progressPercent"]);
  await accessibleTask(env, data.taskId, actor);
  const progress = clamp(data.progressPercent, 0, 100);
  const record = { update_id: id("UPD"), task_id: data.taskId, employee_id: actor.employeeId || null, progress_percent: progress, progress_details: text(data.progressDetails), delivery_url: text(data.deliveryUrl), created_at: now() };
  await insert(env, "task_work_updates", record);
  if (progress === 100) await update(env, "tasks", { status: "IN_REVIEW", updated_at: now() }, "task_id", data.taskId);
  await audit(env, actor, "TASK_WORK_UPDATED", "TASK", data.taskId, { progress });
  return { update: toApi(record) };
}
__name(addWorkUpdate, "addWorkUpdate");

// src/routes/studio.js
var JOB_TYPES = ["PHOTOGRAPHY", "VIDEOGRAPHY", "EDITING", "DESIGN", "DELIVERY"];
var unrestricted2 = /* @__PURE__ */ __name((actor) => actor.userType === "ADMIN" || ["ADMIN", "MANAGER", "ACCOUNT_MANAGER"].includes(actor.role), "unrestricted");
async function selectedEmployee2(env, value) {
  const employeeId = text(value);
  if (!employeeId) return null;
  const employee = await first(env, "SELECT * FROM employees WHERE employee_id = ? AND active = 1", [employeeId]);
  if (!employee) throw new ApiError("EMPLOYEE_NOT_FOUND", "\u0627\u0644\u0645\u0648\u0638\u0641 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0646\u0634\u0637.", { employeeId }, 404);
  return employee;
}
__name(selectedEmployee2, "selectedEmployee");
async function selectedClient(env, value) {
  const clientId = text(value);
  if (!clientId) throw new ApiError("CLIENT_REQUIRED", "\u064A\u062C\u0628 \u0627\u062E\u062A\u064A\u0627\u0631 \u0639\u0645\u064A\u0644.", {}, 400);
  const client = await first(env, "SELECT * FROM clients WHERE client_id = ?", [clientId]);
  if (!client) throw new ApiError("CLIENT_NOT_FOUND", "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", { clientId }, 404);
  return client;
}
__name(selectedClient, "selectedClient");
async function selectedProject2(env, value) {
  const projectId = text(value);
  if (!projectId) return null;
  const project = await first(env, "SELECT * FROM projects WHERE project_id = ?", [projectId]);
  if (!project) throw new ApiError("PROJECT_NOT_FOUND", "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", { projectId }, 404);
  return project;
}
__name(selectedProject2, "selectedProject");
async function accessibleJob(env, jobId, actor) {
  const job = await first(env, "SELECT * FROM studio_jobs WHERE studio_job_id = ?", [jobId]);
  if (!job || !unrestricted2(actor) && job.employee_id !== actor.employeeId) throw new ApiError("JOB_NOT_FOUND", "\u0639\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0644\u0643.", {}, 404);
  return job;
}
__name(accessibleJob, "accessibleJob");
async function listStudioJobs({ env, actor }) {
  const rows = unrestricted2(actor) ? await all(env, "SELECT * FROM studio_jobs ORDER BY created_at DESC") : await all(env, "SELECT * FROM studio_jobs WHERE employee_id = ? ORDER BY created_at DESC", [actor.employeeId]);
  const employees = await all(env, "SELECT employee_id,full_name,email,role FROM employees WHERE active = 1 ORDER BY full_name");
  return { jobs: toApiList(rows), employees: toApiList(employees) };
}
__name(listStudioJobs, "listStudioJobs");
async function createStudioJob({ env, actor, data }) {
  required(data, ["clientId", "jobType", "title"]);
  const type = String(data.jobType).toUpperCase();
  if (!JOB_TYPES.includes(type)) throw new ApiError("INVALID_JOB_TYPE", "\u0646\u0648\u0639 \u0639\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", { allowed: JOB_TYPES });
  const [client, project, employee] = await Promise.all([
    selectedClient(env, data.clientId),
    selectedProject2(env, data.projectId),
    selectedEmployee2(env, data.employeeId)
  ]);
  const timestamp = now();
  const record = {
    studio_job_id: id("JOB"),
    client_id: client.client_id,
    project_id: project?.project_id || null,
    job_type: type,
    title: text(data.title),
    status: data.status || "TODO",
    assigned_to: employee?.full_name || text(data.assignedTo),
    employee_id: employee?.employee_id || null,
    due_date: data.dueDate || null,
    delivery_url: text(data.deliveryUrl),
    brief: text(data.brief),
    created_at: timestamp,
    updated_at: timestamp
  };
  await insert(env, "studio_jobs", record);
  await audit(env, actor, "STUDIO_JOB_CREATED", "STUDIO_JOB", record.studio_job_id, record);
  return { job: toApi(record) };
}
__name(createStudioJob, "createStudioJob");
async function updateStudioJob({ env, actor, data }) {
  required(data, ["studioJobId"]);
  const existing = await accessibleJob(env, data.studioJobId, actor);
  const type = data.jobType ? String(data.jobType).toUpperCase() : existing.job_type;
  if (!JOB_TYPES.includes(type)) throw new ApiError("INVALID_JOB_TYPE", "\u0646\u0648\u0639 \u0639\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", { allowed: JOB_TYPES });
  const clientChanged = data.clientId !== void 0;
  const projectChanged = data.projectId !== void 0;
  const employeeChanged = data.employeeId !== void 0;
  const [client, project, employee] = await Promise.all([
    clientChanged ? selectedClient(env, data.clientId) : null,
    projectChanged ? selectedProject2(env, data.projectId) : null,
    employeeChanged ? selectedEmployee2(env, data.employeeId) : null
  ]);
  const saved = await update(env, "studio_jobs", {
    client_id: clientChanged ? client.client_id : existing.client_id,
    project_id: projectChanged ? project?.project_id || null : existing.project_id,
    job_type: type,
    title: data.title ?? existing.title,
    status: data.status ?? existing.status,
    assigned_to: employeeChanged ? employee?.full_name || text(data.assignedTo) : data.assignedTo ?? existing.assigned_to,
    employee_id: employeeChanged ? employee?.employee_id || null : existing.employee_id,
    due_date: data.dueDate ?? existing.due_date,
    delivery_url: data.deliveryUrl ?? existing.delivery_url,
    brief: data.brief ?? existing.brief,
    updated_at: now()
  }, "studio_job_id", data.studioJobId);
  await audit(env, actor, "STUDIO_JOB_UPDATED", "STUDIO_JOB", data.studioJobId, data);
  return { job: toApi(saved) };
}
__name(updateStudioJob, "updateStudioJob");
async function addStudioAsset({ env, actor, data }) {
  required(data, ["studioJobId", "fileName", "fileUrl"]);
  await accessibleJob(env, data.studioJobId, actor);
  const record = { asset_id: id("AST"), studio_job_id: data.studioJobId, file_key: text(data.fileId), file_name: text(data.fileName), file_url: text(data.fileUrl), asset_type: text(data.assetType), uploaded_by: actor.email, created_at: now() };
  await insert(env, "studio_assets", record);
  await audit(env, actor, "STUDIO_ASSET_ADDED", "STUDIO_JOB", data.studioJobId, { url: record.file_url });
  return { asset: toApi(record) };
}
__name(addStudioAsset, "addStudioAsset");

// src/routes/users.js
var safe = /* @__PURE__ */ __name((user) => toApi(without(user, ["password_salt", "password_hash"])), "safe");
async function ensureEmployee(env, data) {
  if (data.userType === "CLIENT") return null;
  let employee = data.employeeId ? await first(env, "SELECT * FROM employees WHERE employee_id = ?", [data.employeeId]) : await first(env, "SELECT * FROM employees WHERE email = ? COLLATE NOCASE", [email(data.email)]);
  const timestamp = now();
  if (employee) {
    employee = await update(env, "employees", { full_name: data.fullName, email: email(data.email), role: data.role || employee.role, department: data.department ?? employee.department, active: data.active === void 0 ? employee.active : Number(bool(data.active)), updated_at: timestamp }, "employee_id", employee.employee_id);
    return employee.employee_id;
  }
  const record = { employee_id: id("EMP"), full_name: data.fullName, email: email(data.email), role: data.role || "EMPLOYEE", department: text(data.department), active: data.active === void 0 ? 1 : Number(bool(data.active)), start_date: timestamp.slice(0, 10), created_at: timestamp, updated_at: timestamp };
  await insert(env, "employees", record);
  return record.employee_id;
}
__name(ensureEmployee, "ensureEmployee");
function validate(data) {
  required(data, ["email", "userType", "fullName"]);
  const type = String(data.userType).toUpperCase();
  if (!USER_TYPES.includes(type)) throw new ApiError("INVALID_USER_TYPE", "\u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", { allowed: USER_TYPES });
  if (type === "CLIENT" && !data.clientId) throw new ApiError("CLIENT_REQUIRED", "\u064A\u062C\u0628 \u0631\u0628\u0637 \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064A\u0644 \u0628\u0639\u0645\u064A\u0644 \u0645\u0633\u062C\u0644.");
  return type;
}
__name(validate, "validate");
async function listUsers({ env }) {
  const [users, employees, roles, permissionCatalog, permissionAssignments] = await Promise.all([
    all(env, "SELECT * FROM users ORDER BY created_at DESC"),
    all(env, "SELECT * FROM employees ORDER BY full_name"),
    all(env, "SELECT * FROM roles WHERE active = 1 ORDER BY role_code"),
    all(env, "SELECT * FROM permissions ORDER BY module, action"),
    all(env, "SELECT * FROM employee_permissions ORDER BY employee_id, permission_id")
  ]);
  return {
    users: users.map(safe),
    employees: toApiList(employees),
    roles: toApiList(roles),
    permissionCatalog: toApiList(permissionCatalog),
    permissionAssignments: toApiList(permissionAssignments)
  };
}
__name(listUsers, "listUsers");async function createUser({ env, actor, data }) {
  data.userType = validate(data);
  if (await first(env, "SELECT user_id FROM users WHERE email = ? COLLATE NOCASE", [email(data.email)])) throw new ApiError("USER_EXISTS", "\u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062C\u0644 \u0628\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F.", {}, 409);
  if (data.userType === "CLIENT" && !await first(env, "SELECT client_id FROM clients WHERE client_id = ?", [data.clientId])) throw new ApiError("CLIENT_NOT_FOUND", "\u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const employeeId = await ensureEmployee(env, data);
  const timestamp = now();
  const record = {
    user_id: id("USR"),
    google_sub: null,
    username: email(data.email),
    password_salt: "",
    password_hash: "",
    user_type: data.userType,
    employee_id: employeeId,
    client_id: data.clientId || null,
    role: data.role || data.userType,
    full_name: text(data.fullName),
    email: email(data.email),
    active: data.active === void 0 ? 1 : Number(bool(data.active)),
    must_change_password: 0,
    last_login: null,
    created_at: timestamp,
    updated_at: timestamp
  };
  await insert(env, "users", record);
  await audit(env, actor, "USER_CREATED", "USER", record.user_id, without(record, ["password_salt", "password_hash"]));
  return { user: safe(record) };
}
__name(createUser, "createUser");
async function updateUser({ env, actor, data }) {
  required(data, ["userId"]);
  const existing = await first(env, "SELECT * FROM users WHERE user_id = ?", [data.userId]);
  if (!existing) throw new ApiError("USER_NOT_FOUND", "المستخدم غير موجود.", {}, 404);
  const type = String(data.userType || existing.user_type).toUpperCase();
  if (!USER_TYPES.includes(type)) throw new ApiError("INVALID_USER_TYPE", "نوع المستخدم غير صالح.");
  const nextEmail = data.email === void 0 ? existing.email : email(data.email);
  const duplicate = await first(env, "SELECT user_id FROM users WHERE email = ? COLLATE NOCASE AND user_id != ?", [nextEmail, data.userId]);
  if (duplicate) throw new ApiError("USER_EXISTS", "يوجد مستخدم آخر مسجل بهذا البريد.", {}, 409);
  const clientId = type === "CLIENT" ? text(data.clientId ?? existing.client_id) : null;
  if (type === "CLIENT" && !clientId) throw new ApiError("CLIENT_REQUIRED", "يجب ربط حساب العميل بعميل مسجل.");
  if (clientId && !await first(env, "SELECT client_id FROM clients WHERE client_id = ?", [clientId])) {
    throw new ApiError("CLIENT_NOT_FOUND", "العميل غير موجود.", {}, 404);
  }
  const employeeId = type === "CLIENT" ? null : await ensureEmployee(env, {
    userType: type,
    employeeId: data.employeeId || existing.employee_id,
    email: nextEmail,
    fullName: data.fullName || existing.full_name,
    role: data.role || existing.role,
    department: data.department,
    active: data.active === void 0 ? existing.active : data.active
  });
  const saved = await update(env, "users", {
    username: nextEmail,
    user_type: type,
    employee_id: employeeId,
    client_id: clientId,
    role: data.role ?? existing.role,
    full_name: data.fullName ?? existing.full_name,
    email: nextEmail,
    active: data.active === void 0 ? existing.active : Number(bool(data.active)),
    updated_at: now()
  }, "user_id", data.userId);
  await audit(env, actor, "USER_UPDATED", "USER", data.userId, without(saved, ["password_salt", "password_hash"]));
  return { user: safe(saved) };
}
__name(updateUser, "updateUser");async function setUserActive({ env, actor, data }) {
  required(data, ["userId", "active"]);
  if (data.userId === actor.userId && !bool(data.active)) throw new ApiError("SELF_DISABLE_DENIED", "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0625\u064A\u0642\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062D\u0627\u0644\u064A.");
  const saved = await update(env, "users", { active: Number(bool(data.active)), updated_at: now() }, "user_id", data.userId);
  if (!saved) throw new ApiError("USER_NOT_FOUND", "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  if (saved.employee_id) await update(env, "employees", { active: Number(bool(data.active)), updated_at: now() }, "employee_id", saved.employee_id);
  await audit(env, actor, "USER_ACTIVE_CHANGED", "USER", data.userId, { active: bool(data.active) });
  return { user: safe(saved) };
}
__name(setUserActive, "setUserActive");
async function deleteUser({ env, actor, data }) {
  required(data, ["userId"]);
  if (data.userId === actor.userId) throw new ApiError("SELF_DELETE_DENIED", "لا يمكنك حذف حسابك الحالي.");
  const existing = await first(env, "SELECT * FROM users WHERE user_id = ?", [data.userId]);
  if (!existing) throw new ApiError("USER_NOT_FOUND", "المستخدم غير موجود.", {}, 404);
  if (existing.active && (existing.user_type === "ADMIN" || existing.role === "ADMIN")) {
    const activeAdmins = await first(env, "SELECT COUNT(*) AS count FROM users WHERE active = 1 AND (user_type = 'ADMIN' OR role = 'ADMIN')");
    if (Number(activeAdmins?.count || 0) <= 1) throw new ApiError("LAST_ADMIN_DELETE_DENIED", "لا يمكن حذف آخر مدير أساسي نشط.");
  }
  const timestamp = now();
  const statements = [
    statement(env, "UPDATE users SET active = 0, google_sub = NULL, updated_at = ? WHERE user_id = ?", [timestamp, data.userId])
  ];
  if (existing.employee_id) statements.push(statement(env, "UPDATE employees SET active = 0, updated_at = ? WHERE employee_id = ?", [timestamp, existing.employee_id]));
  await batch(env, statements);
  await audit(env, actor, "USER_DELETED_SAFE", "USER", data.userId, { email: existing.email });
  return { deleted: true, user: safe({ ...existing, active: 0, google_sub: null, updated_at: timestamp }) };
}
__name(deleteUser, "deleteUser");

async function setUserPermissions({ env, actor, data }) {
  required(data, ["employeeId", "permissions"]);
  if (!Array.isArray(data.permissions)) throw new ApiError("INVALID_PERMISSIONS", "قائمة الصلاحيات غير صالحة.");
  if (!await first(env, "SELECT employee_id FROM employees WHERE employee_id = ?", [data.employeeId])) {
    throw new ApiError("EMPLOYEE_NOT_FOUND", "الموظف غير موجود.", {}, 404);
  }
  const catalog = await all(env, "SELECT permission_id FROM permissions");
  const validIds = new Set(catalog.map((row) => row.permission_id));
  const invalid = data.permissions.find((item) => !validIds.has(item.permissionId));
  if (invalid) throw new ApiError("PERMISSION_NOT_FOUND", "صلاحية غير معروفة.", { permissionId: invalid.permissionId });
  const timestamp = now();
  const statements = [statement(env, "DELETE FROM employee_permissions WHERE employee_id = ?", [data.employeeId])];
  for (const item of data.permissions) {
    statements.push(statement(env, "INSERT INTO employee_permissions (employee_permission_id,employee_id,permission_id,allowed,reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?)", [
      id("EP"), data.employeeId, item.permissionId, Number(bool(item.allowed)), text(item.reason), timestamp, timestamp
    ]));
  }
  await batch(env, statements);
  await audit(env, actor, "USER_PERMISSIONS_CHANGED", "EMPLOYEE", data.employeeId, { count: data.permissions.length });
  const rows = await all(env, "SELECT * FROM employee_permissions WHERE employee_id = ?", [data.employeeId]);
  return { permissions: toApiList(rows) };
}
__name(setUserPermissions, "setUserPermissions");
// src/routes/portals.js
async function employeePortal({ env, actor }) {
  if (!actor.employeeId) throw new ApiError("EMPLOYEE_LINK_REQUIRED", "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0645\u0648\u0638\u0641.", {}, 403);
  const [employee, tasks, updates, jobs, timesheets] = await Promise.all([
    first(env, "SELECT * FROM employees WHERE employee_id = ?", [actor.employeeId]),
    all(env, "SELECT * FROM tasks WHERE employee_id = ? OR assigned_email = ? COLLATE NOCASE ORDER BY created_at DESC", [actor.employeeId, actor.email]),
    all(env, "SELECT * FROM task_work_updates WHERE employee_id = ? ORDER BY created_at DESC", [actor.employeeId]),
    all(env, "SELECT * FROM studio_jobs WHERE employee_id = ? ORDER BY created_at DESC", [actor.employeeId]),
    all(env, "SELECT * FROM timesheets WHERE employee_id = ? ORDER BY work_date DESC", [actor.employeeId])
  ]);
  return { employee: toApi(employee), tasks: toApiList(tasks), workUpdates: toApiList(updates), studioJobs: toApiList(jobs), timesheets: toApiList(timesheets) };
}
__name(employeePortal, "employeePortal");
async function employeeUpdate({ env, actor, data }) {
  if (!actor.employeeId) throw new ApiError("EMPLOYEE_LINK_REQUIRED", "\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0645\u0648\u0638\u0641.", {}, 403);
  if (data.kind === "TIMESHEET") {
    required(data, ["workDate", "hours"]);
    const timestamp = now();
    const record2 = { timesheet_id: id("TIME"), employee_id: actor.employeeId, project_id: data.projectId || null, task_id: data.taskId || null, work_date: data.workDate, hours: number(data.hours), description: text(data.description), approval_status: "PENDING", created_at: timestamp, updated_at: timestamp };
    await insert(env, "timesheets", record2);
    await audit(env, actor, "TIMESHEET_CREATED", "TIMESHEET", record2.timesheet_id, record2);
    return { timesheet: toApi(record2) };
  }
  required(data, ["taskId", "progressPercent"]);
  await accessibleTask(env, data.taskId, actor);
  const progress = clamp(data.progressPercent, 0, 100);
  const record = { update_id: id("UPD"), task_id: data.taskId, employee_id: actor.employeeId, progress_percent: progress, progress_details: text(data.progressDetails), delivery_url: text(data.deliveryUrl), created_at: now() };
  await insert(env, "task_work_updates", record);
  if (progress === 100) await update(env, "tasks", { status: "IN_REVIEW", updated_at: now() }, "task_id", data.taskId);
  await audit(env, actor, "TASK_WORK_UPDATED", "TASK", data.taskId, { progress });
  return { update: toApi(record) };
}
__name(employeeUpdate, "employeeUpdate");
async function statement2(env, clientId) {
  const entries = await all(env, "SELECT * FROM client_statements WHERE client_id = ? ORDER BY entry_date DESC", [clientId]);
  const totalDebit = entries.reduce((sum2, row) => sum2 + number(row.debit), 0);
  const totalCredit = entries.reduce((sum2, row) => sum2 + number(row.credit), 0);
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
    deliveries: assets.map((row) => ({ name: row.file_name, url: row.file_url, type: row.asset_type, createdAt: row.created_at }))
  };
}
__name(clientPortal, "clientPortal");

// src/services/accounting.js
function settingsObject(rows) {
  return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
}
__name(settingsObject, "settingsObject");
function calculateAd(data, settings2) {
  const days = number(data.days);
  const dailyRate = number(data.dailyRate);
  if (days <= 0 || dailyRate < 0) throw new ApiError("INVALID_AD_AMOUNT", "\u0639\u062F\u062F \u0627\u0644\u0623\u064A\u0627\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631 \u0648\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u063A\u064A\u0631 \u0633\u0627\u0644\u0628\u0629.");
  const costRate = data.costRate === void 0 || data.costRate === "" ? number(settings2["Default Cost Rate"], 1.19) : number(data.costRate);
  const commissionRate = data.commissionRate === void 0 || data.commissionRate === "" ? number(settings2["Default Commission Rate"], 0.2997) : number(data.commissionRate);
  const baseSpend = round(days * dailyRate);
  const internalCost = round(baseSpend * costRate);
  const commission = round(baseSpend * commissionRate);
  const computedSalePrice = round(baseSpend + internalCost + commission);
  const salePrice = data.salePrice === void 0 || data.salePrice === "" ? computedSalePrice : round(data.salePrice);
  const bankDebit = round(baseSpend + internalCost);
  const profit = round(salePrice - bankDebit);
  const profitMargin = salePrice ? round(profit / salePrice * 100) : 0;
  const minimumProfitAmount = number(data.minimumProfitAmount, number(settings2["Minimum Profit Amount"], 300));
  const minimumProfitMargin = number(data.minimumProfitMargin, number(settings2["Minimum Profit Margin"], 0));
  const belowMinimum = profit < minimumProfitAmount || profitMargin < minimumProfitMargin;
  if (belowMinimum && !text(data.overrideReason)) throw new ApiError("PROFIT_OVERRIDE_REQUIRED", "\u0627\u0644\u0631\u0628\u062D \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D. \u0627\u0643\u062A\u0628 \u0633\u0628\u0628 \u0627\u0644\u062A\u062C\u0627\u0648\u0632 \u0642\u0628\u0644 \u0627\u0644\u062D\u0641\u0638.", { profit, profitMargin, minimumProfitAmount, minimumProfitMargin });
  return { days, dailyRate, baseSpend, costRate, internalCost, commissionRate, commission, salePrice, bankDebit, profit, profitMargin, minimumProfitAmount, minimumProfitMargin, belowMinimum };
}
__name(calculateAd, "calculateAd");

// src/routes/finance-read.js
async function listAds({ env, actor, data }) {
  const clauses = [];
  const bindings = [];
  if (!bool(data.includeArchived)) clauses.push("a.archived = 0");
  if (actor.userType === "CLIENT") {
    clauses.push("a.client_id = ?");
    bindings.push(actor.clientId);
  }
  if (data.clientId) {
    clauses.push("a.client_id = ?");
    bindings.push(data.clientId);
  }
  if (data.projectId) {
    clauses.push("a.project_id = ?");
    bindings.push(data.projectId);
  }
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const rows = await all(env, "SELECT a.*, c.client_name, p.project_name FROM paid_ads a JOIN clients c ON c.client_id=a.client_id LEFT JOIN projects p ON p.project_id=a.project_id " + where + " ORDER BY a.created_at DESC", bindings);
  return { ads: rows.map((row) => toApi(sanitizeAd(row, actor))) };
}
__name(listAds, "listAds");async function getAdSettings({ env }) {
  return { settings: settingsObject(await all(env, "SELECT * FROM ads_settings ORDER BY setting_key")) };
}
__name(getAdSettings, "getAdSettings");
async function adSummary(context) {
  const { ads } = await listAds(context);
  return {
    count: ads.length,
    active: ads.filter((row) => ["ACTIVE", "ON_AIR"].includes(row.Status)).length,
    totalSalePrice: round(ads.reduce((sum2, row) => sum2 + number(row["Sale Price"]), 0)),
    totalProfit: round(ads.reduce((sum2, row) => sum2 + number(row.Profit), 0)),
    belowMinimum: ads.filter((row) => number(row.Profit) < number(row["Minimum Profit Amount"]) || number(row["Profit Margin"]) < number(row["Minimum Profit Margin"])).length
  };
}
__name(adSummary, "adSummary");
async function listBankAccounts({ env }) {
  return { accounts: toApiList(await all(env, "SELECT * FROM bank_accounts ORDER BY created_at DESC")) };
}
__name(listBankAccounts, "listBankAccounts");
async function listBankTransactions({ env, data }) {
  const rows = data.bankAccountId ? await all(env, "SELECT * FROM bank_transactions WHERE bank_account_id = ? ORDER BY transaction_date DESC", [data.bankAccountId]) : await all(env, "SELECT * FROM bank_transactions ORDER BY transaction_date DESC");
  return { transactions: toApiList(rows) };
}
__name(listBankTransactions, "listBankTransactions");
async function listInvoices({ env, actor, data }) {
  const clauses = [];
  const bindings = [];
  if (actor.userType === "CLIENT") {
    clauses.push("i.client_id = ?");
    bindings.push(actor.clientId);
  }
  if (data.clientId) {
    clauses.push("i.client_id = ?");
    bindings.push(data.clientId);
  }
  if (data.projectId) {
    clauses.push("i.project_id = ?");
    bindings.push(data.projectId);
  }
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const rows = await all(env, "SELECT i.*, c.client_name, p.project_name, COALESCE(pay.paid_amount,0) AS paid_amount, (i.amount+i.tax_amount-COALESCE(pay.paid_amount,0)) AS balance_due FROM invoices i JOIN clients c ON c.client_id=i.client_id LEFT JOIN projects p ON p.project_id=i.project_id LEFT JOIN (SELECT invoice_id,SUM(amount) AS paid_amount FROM payments GROUP BY invoice_id) pay ON pay.invoice_id=i.invoice_id " + where + " ORDER BY i.issue_date DESC", bindings);
  return { invoices: toApiList(rows) };
}
__name(listInvoices, "listInvoices");async function listPayments({ env, actor, data }) {
  const clauses = [];
  const bindings = [];
  if (actor.userType === "CLIENT") {
    clauses.push("pay.client_id = ?");
    bindings.push(actor.clientId);
  }
  if (data.clientId) {
    clauses.push("pay.client_id = ?");
    bindings.push(data.clientId);
  }
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const rows = await all(env, "SELECT pay.*, c.client_name, i.invoice_number FROM payments pay JOIN clients c ON c.client_id=pay.client_id JOIN invoices i ON i.invoice_id=pay.invoice_id " + where + " ORDER BY pay.payment_date DESC", bindings);
  return { payments: toApiList(rows) };
}
__name(listPayments, "listPayments");

async function projectInvoicePreview({ env, actor, data }) {
  required(data, ["clientId", "projectId"]);
  if (actor.userType === "CLIENT" && actor.clientId !== data.clientId) throw new ApiError("FORBIDDEN", "لا يمكنك عرض مشروع عميل آخر.", {}, 403);
  const project = await first(env, "SELECT p.*, c.client_name FROM projects p JOIN clients c ON c.client_id=p.client_id WHERE p.project_id=? AND p.client_id=?", [data.projectId, data.clientId]);
  if (!project) throw new ApiError("PROJECT_NOT_FOUND", "المشروع غير موجود أو لا يتبع العميل المحدد.", {}, 404);
  const items = await all(env, "SELECT cs.statement_entry_id AS source_id, cs.reference_type AS source_type, cs.reference_id, cs.description, 1 AS quantity, cs.debit AS unit_price, cs.debit AS amount, cs.currency FROM client_statements cs WHERE cs.client_id=? AND cs.project_id=? AND cs.debit>0 AND cs.status!='CANCELLED' AND cs.reference_type!='INVOICE' AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.source_type=cs.reference_type AND ii.source_id=cs.statement_entry_id) ORDER BY cs.entry_date", [data.clientId, data.projectId]);
  const subtotal = round(items.reduce((sum2, item) => sum2 + number(item.amount), 0));
  const config = { ...DEFAULT_SYSTEM_SETTINGS, ...settingsObject(await all(env, "SELECT * FROM settings")) };
  const taxRate = number(config["Invoice Tax Rate"], 0);
  return {
    client: { clientId: project.client_id, clientName: project.client_name },
    project: toApi(project),
    items: toApiList(items),
    subtotal,
    taxRate,
    taxAmount: round(subtotal * taxRate / 100),
    total: round(subtotal * (1 + taxRate / 100))
  };
}
__name(projectInvoicePreview, "projectInvoicePreview");async function listExpenses({ env }) {
  return { expenses: toApiList(await all(env, "SELECT * FROM expenses ORDER BY expense_date DESC")) };
}
__name(listExpenses, "listExpenses");
async function getClientStatement({ env, data }) {
  return statement2(env, data.clientId);
}
__name(getClientStatement, "getClientStatement");

// src/routes/reports.js
function group(rows, keyField, valueField) {
  const values = {};
  rows.forEach((row) => {
    const key = row[keyField] || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F";
    values[key] = round((values[key] || 0) + number(row[valueField]));
  });
  return Object.entries(values).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}
__name(group, "group");
async function revenueReport({ env }) {
  const invoices = await all(env, `SELECT * FROM invoices WHERE status != 'CANCELLED'`);
  return { byClient: group(invoices, "client_id", "amount"), byProject: group(invoices, "project_id", "amount") };
}
__name(revenueReport, "revenueReport");
async function profitabilityReport({ env }) {
  const ads = await all(env, `SELECT * FROM paid_ads WHERE status != 'CANCELLED'`);
  return { byClient: group(ads, "client_id", "profit"), byCampaign: group(ads, "project_id", "profit") };
}
__name(profitabilityReport, "profitabilityReport");
async function productivityReport({ env }) {
  const tasks = await all(env, "SELECT * FROM tasks");
  const result = {};
  tasks.forEach((row) => {
    const key = row.employee_id || "\u063A\u064A\u0631 \u0645\u0633\u0646\u062F";
    result[key] ||= { employeeId: key, total: 0, done: 0 };
    result[key].total += 1;
    if (row.status === "DONE") result[key].done += 1;
  });
  return { employees: Object.values(result).map((item) => ({ ...item, completionRate: item.total ? round(item.done / item.total * 100) : 0 })) };
}
__name(productivityReport, "productivityReport");
async function campaignReport({ env }) {
  const [ads, campaigns] = await Promise.all([all(env, "SELECT * FROM paid_ads"), all(env, "SELECT * FROM campaigns")]);
  return { platforms: group(ads, "platform", "sale_price"), campaigns };
}
__name(campaignReport, "campaignReport");

// src/routes/system.js
var MODULES = ["AUTH", "DASHBOARD", "CRM", "TASKS", "ADS", "BANKING", "FINANCE", "STUDIO", "USERS", "PORTALS", "REPORTS", "APPROVALS", "SYSTEM"];
async function health({ env }) {
  return { status: "UP", app: APP.name, version: APP.version, timezone: APP.timezone, configured: Boolean(env.DB && env.FILES && env.GOOGLE_CLIENT_ID), timestamp: now() };
}
__name(health, "health");
async function bootstrap({ env, actor, data }) {
  const users = await count(env, "users");
  if (users === 0) {
    required(data, ["bootstrapSecret", "adminEmail"]);
    if (!env.BOOTSTRAP_SECRET || data.bootstrapSecret !== env.BOOTSTRAP_SECRET) throw new ApiError("INVALID_BOOTSTRAP_SECRET", "\u0631\u0645\u0632 \u0627\u0644\u062A\u0647\u064A\u0626\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.", {}, 403);
  } else if (!actor || actor.userType !== "ADMIN" && actor.role !== "ADMIN") {
    throw new ApiError("FORBIDDEN", "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0647\u064A\u0626\u0629 \u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u0645\u062F\u064A\u0631 \u0641\u0642\u0637.", {}, 403);
  }
  const timestamp = now();
  const statements = [];
  for (const [key, value] of Object.entries(DEFAULT_AD_SETTINGS)) statements.push(statement(env, `INSERT INTO ads_settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO NOTHING`, [key, value, key, timestamp]));
  for (const [key, value] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) statements.push(statement(env, "INSERT INTO settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO NOTHING", [key, value, key, timestamp]));
  for (const role of ROLES) statements.push(statement(env, `INSERT INTO roles (role_id,role_code,role_name,description,active,created_at) VALUES (?,?,?,?,1,?) ON CONFLICT(role_code) DO NOTHING`, [id("ROLE"), role, role, `\u062F\u0648\u0631 ${role}`, timestamp]));
  for (const module of MODULES) for (const action of ACTIONS) statements.push(statement(env, `INSERT INTO permissions (permission_id,module,action,description,created_at) VALUES (?,?,?,?,?) ON CONFLICT(module,action) DO NOTHING`, [id("PERM"), module, action, `${module}:${action}`, timestamp]));
  const adminEmail = email(actor?.email || data.adminEmail);
  const existing = await first(env, "SELECT * FROM users WHERE email = ? COLLATE NOCASE", [adminEmail]);
  const employeeId = existing?.employee_id || id("EMP");
  const userId = existing?.user_id || id("USR");
  statements.push(statement(env, `INSERT INTO employees (employee_id,full_name,email,role,department,active,start_date,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?,?) ON CONFLICT(email) DO UPDATE SET role='ADMIN',active=1,updated_at=excluded.updated_at`, [employeeId, text(data.adminName || actor?.name || adminEmail.split("@")[0]), adminEmail, "ADMIN", "Management", timestamp.slice(0, 10), timestamp, timestamp]));
  statements.push(statement(env, `INSERT INTO users (user_id,google_sub,username,password_salt,password_hash,user_type,employee_id,client_id,role,full_name,email,active,must_change_password,last_login,created_at,updated_at) VALUES (?,?,?,?,?,'ADMIN',?,NULL,'ADMIN',?,?,1,0,NULL,?,?) ON CONFLICT(email) DO UPDATE SET user_type='ADMIN',role='ADMIN',active=1,updated_at=excluded.updated_at`, [userId, actor?.googleSub || null, adminEmail, "", "", employeeId, text(data.adminName || actor?.name || adminEmail.split("@")[0]), adminEmail, timestamp, timestamp]));
  await batch(env, statements);
  await audit(env, actor || adminEmail, "SYSTEM_INITIALIZED", "SYSTEM", APP.version, { adminEmail });
  return { initialized: true, adminEmail, version: APP.version, statements: statements.length };
}
__name(bootstrap, "bootstrap");
async function auditLog({ env, data }) {
  const limit = Math.max(1, Math.min(500, Number(data.limit || 100)));
  const entries = await all(env, "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", [limit]);
  return { entries: toApiList(entries), total: await count(env, "audit_log") };
}
__name(auditLog, "auditLog");
async function diagnostics({ env }) {
  const tables = ["employees", "users", "clients", "projects", "tasks", "paid_ads", "bank_accounts", "bank_transactions", "client_statements", "studio_jobs", "invoices", "payments", "expenses", "audit_log"];
  const counts = {};
  for (const table of tables) counts[table] = await count(env, table);
  return { health: await health({ env }), counts };
}
__name(diagnostics, "diagnostics");

// src/services/files.js
function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64Url, "base64Url");
async function signature(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
__name(signature, "signature");
async function signedFileUrl(env, key, ttlSeconds = 900) {
  if (env.R2_PUBLIC_URL) return `${String(env.R2_PUBLIC_URL).replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
  if (!env.API_PUBLIC_URL || !env.FILE_SIGNING_SECRET) throw new ApiError("FILE_URL_NOT_CONFIGURED", "\u0627\u0636\u0628\u0637 API_PUBLIC_URL \u0648FILE_SIGNING_SECRET \u0644\u0625\u0646\u0634\u0627\u0621 \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0644\u0641\u0627\u062A.", {}, 500);
  const expires = Math.floor(Date.now() / 1e3) + ttlSeconds;
  const token = await signature(env.FILE_SIGNING_SECRET, `${key}:${expires}`);
  return `${String(env.API_PUBLIC_URL).replace(/\/$/, "")}/files/${key.split("/").map(encodeURIComponent).join("/")}?expires=${expires}&signature=${token}`;
}
__name(signedFileUrl, "signedFileUrl");
async function verifyFileRequest(env, key, expires, token) {
  if (!env.FILE_SIGNING_SECRET || Number(expires) < Math.floor(Date.now() / 1e3)) return false;
  const expected = await signature(env.FILE_SIGNING_SECRET, `${key}:${expires}`);
  if (expected.length !== String(token || "").length) return false;
  const left = new TextEncoder().encode(expected);
  const right = new TextEncoder().encode(String(token));
  return crypto.subtle.timingSafeEqual ? crypto.subtle.timingSafeEqual(left, right) : expected === token;
}
__name(verifyFileRequest, "verifyFileRequest");
async function serveFile(request, env, key) {
  const url = new URL(request.url);
  if (!await verifyFileRequest(env, key, url.searchParams.get("expires"), url.searchParams.get("signature"))) return new Response("Forbidden", { status: 403 });
  const object = await env.FILES.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "private, max-age=300");
  return new Response(object.body, { headers });
}
__name(serveFile, "serveFile");

// src/routes/files.js
function decodeBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
__name(decodeBase64, "decodeBase64");
async function uploadFile({ env, actor, data }) {
  required(data, ["fileName", "contentType", "base64"]);
  const bytes = decodeBase64(data.base64);
  if (bytes.byteLength > 10 * 1024 * 1024) throw new ApiError("FILE_TOO_LARGE", "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0645\u0644\u0641 10 \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A.", {}, 413);
  const safeName = text(data.fileName).replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 120) || "file";
  const key = `${data.folder || "uploads"}/${id("FILE")}-${safeName}`;
  await env.FILES.put(key, bytes, { httpMetadata: { contentType: data.contentType }, customMetadata: { uploadedBy: actor.email } });
  const url = await signedFileUrl(env, key, 3600);
  await audit(env, actor, "FILE_UPLOADED", "FILE", key, { fileName: data.fileName, size: bytes.byteLength });
  return { fileId: key, fileName: data.fileName, fileUrl: url, size: bytes.byteLength };
}
__name(uploadFile, "uploadFile");

// src/routes/platform-settings.js
async function getSystemSettings({ env }) {
  const [rows, accounts] = await Promise.all([
    all(env, "SELECT * FROM settings ORDER BY setting_key"),
    all(env, "SELECT * FROM bank_accounts WHERE active = 1 ORDER BY account_name")
  ]);
  return {
    settings: { ...DEFAULT_SYSTEM_SETTINGS, ...settingsObject(rows) },
    adSettings: await settings(env),
    bankAccounts: toApiList(accounts)
  };
}
__name(getSystemSettings, "getSystemSettings");

async function saveSystemSettings({ env, actor, data }) {
  const allowed = new Set(Object.keys(DEFAULT_SYSTEM_SETTINGS));
  const updates = Object.entries(data).filter(([key]) => allowed.has(key));
  if (!updates.length) throw new ApiError("NO_SETTINGS", "لم يتم إرسال إعدادات صالحة للحفظ.");
  if (data["Company Email"] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(data["Company Email"]))) {
    throw new ApiError("INVALID_EMAIL", "بريد الشركة غير صالح.");
  }
  if (data["Payment Terms Days"] !== void 0) {
    const days = Number(data["Payment Terms Days"]);
    if (!Number.isInteger(days) || days < 0 || days > 365) throw new ApiError("INVALID_PAYMENT_TERMS", "مدة الاستحقاق يجب أن تكون بين 0 و365 يومًا.");
  }
  if (data["Invoice Tax Rate"] !== void 0) {
    const rate = Number(data["Invoice Tax Rate"]);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new ApiError("INVALID_TAX_RATE", "نسبة الضريبة يجب أن تكون بين 0 و100.");
  }
  const timestamp = now();
  await batch(env, updates.map(([key, value]) => statement(env, "INSERT INTO settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at", [
    key, String(value ?? ""), key, timestamp
  ])));
  await audit(env, actor, "SYSTEM_SETTINGS_UPDATED", "SETTINGS", "SYSTEM", Object.fromEntries(updates));
  return getSystemSettings({ env });
}
__name(saveSystemSettings, "saveSystemSettings");

// src/routes/documents.js
async function validateDocumentLinks(env, clientId, projectId) {
  let project = null;
  if (projectId) {
    project = await first(env, "SELECT * FROM projects WHERE project_id = ?", [projectId]);
    if (!project) throw new ApiError("PROJECT_NOT_FOUND", "المشروع غير موجود.", {}, 404);
    if (clientId && project.client_id !== clientId) throw new ApiError("PROJECT_CLIENT_MISMATCH", "المشروع لا يتبع العميل المحدد.");
  }
  if (clientId && !await first(env, "SELECT client_id FROM clients WHERE client_id = ?", [clientId])) {
    throw new ApiError("CLIENT_NOT_FOUND", "العميل غير موجود.", {}, 404);
  }
  return { clientId: clientId || project?.client_id || null, project };
}
__name(validateDocumentLinks, "validateDocumentLinks");

async function listDocuments({ env, actor, data }) {
  const clauses = [];
  const bindings = [];
  if (!bool(data.includeArchived)) clauses.push("d.status = 'ACTIVE'");
  if (data.clientId) {
    clauses.push("d.client_id = ?");
    bindings.push(data.clientId);
  }
  if (data.projectId) {
    clauses.push("d.project_id = ?");
    bindings.push(data.projectId);
  }
  if (actor.userType === "CLIENT") {
    clauses.push("d.client_id = ?");
    bindings.push(actor.clientId);
    clauses.push("d.visibility = 'CLIENT'");
  }
  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const rows = await all(env, "SELECT d.*, c.client_name, p.project_name FROM documents d LEFT JOIN clients c ON c.client_id=d.client_id LEFT JOIN projects p ON p.project_id=d.project_id " + where + " ORDER BY d.created_at DESC", bindings);
  const documents = await Promise.all(rows.map(async (row) => ({
    ...toApi(row),
    "File URL": row.status === "ACTIVE" ? await signedFileUrl(env, row.r2_key, 3600) : ""
  })));
  return { documents };
}
__name(listDocuments, "listDocuments");

async function createDocument({ env, actor, data }) {
  required(data, ["title", "category", "fileName", "contentType", "base64"]);
  const links = await validateDocumentLinks(env, text(data.clientId) || null, text(data.projectId) || null);
  const visibility = String(data.visibility || "INTERNAL").toUpperCase();
  if (!["INTERNAL", "CLIENT"].includes(visibility)) throw new ApiError("INVALID_VISIBILITY", "نطاق ظهور المستند غير صالح.");
  const upload = await uploadFile({ env, actor, data: {
    fileName: data.fileName,
    contentType: data.contentType,
    base64: data.base64,
    folder: links.clientId ? "documents/" + links.clientId : "documents/general"
  } });
  const timestamp = now();
  const record = {
    document_id: id("DOC"),
    client_id: links.clientId,
    project_id: data.projectId || null,
    category: text(data.category),
    title: text(data.title),
    file_name: text(data.fileName),
    content_type: text(data.contentType),
    file_size: Number(upload.size || 0),
    r2_key: upload.fileId,
    visibility,
    status: "ACTIVE",
    uploaded_by: actor.email,
    created_at: timestamp,
    updated_at: timestamp,
    archived_at: null
  };
  await insert(env, "documents", record);
  await audit(env, actor, "DOCUMENT_CREATED", "DOCUMENT", record.document_id, without(record, ["r2_key"]));
  return { document: { ...toApi(record), "File URL": upload.fileUrl } };
}
__name(createDocument, "createDocument");

async function archiveDocument({ env, actor, data }) {
  required(data, ["documentId"]);
  const existing = await first(env, "SELECT * FROM documents WHERE document_id = ?", [data.documentId]);
  if (!existing) throw new ApiError("DOCUMENT_NOT_FOUND", "المستند غير موجود.", {}, 404);
  const timestamp = now();
  const saved = await update(env, "documents", { status: "ARCHIVED", archived_at: timestamp, updated_at: timestamp }, "document_id", data.documentId);
  await audit(env, actor, "DOCUMENT_ARCHIVED", "DOCUMENT", data.documentId, { fileName: existing.file_name });
  return { archived: true, document: toApi(saved) };
}
__name(archiveDocument, "archiveDocument");
// src/router.js
var route = /* @__PURE__ */ __name((handler, module, action, options = {}) => ({ handler, module, action, ...options }), "route");
var financial = /* @__PURE__ */ __name((module, action) => route(null, module, action, { financial: true }), "financial");
var ROUTES = Object.freeze({
  "POST auth.google": route(googleLogin, "AUTH", "VIEW"),
  "POST auth.logout": route(logout, "AUTH", "VIEW"),
  "GET auth.me": route(currentUser, "AUTH", "VIEW"),
  "GET dashboard": route(dashboard, "DASHBOARD", "VIEW"),
  "GET clients": route(listClients, "CRM", "VIEW"),
  "POST clients": route(createClient, "CRM", "CREATE"),
  "PUT clients": route(updateClient, "CRM", "EDIT"),
  "GET contacts": route(listContacts, "CRM", "VIEW"),
  "POST contacts": route(createContact, "CRM", "CREATE"),
  "GET projects": route(listProjects, "CRM", "VIEW"),
  "POST projects": route(createProject, "CRM", "CREATE"),
  "PUT projects": route(updateProject, "CRM", "EDIT"),
  "GET approvals": route(listApprovalRequests, "APPROVALS", "VIEW"),
  "POST approvals": route(createApprovalRequest, "APPROVALS", "CREATE"),
  "PUT approvals": route(reviewApprovalRequest, "APPROVALS", "APPROVE"),
  "GET tasks": route(listTasks, "TASKS", "VIEW"),
  "POST tasks": route(createTask, "TASKS", "CREATE"),
  "PUT tasks": route(updateTask, "TASKS", "EDIT"),
  "POST task.comments": route(addTaskComment, "TASKS", "EDIT"),
  "POST task.attachments": route(addTaskAttachment, "TASKS", "EDIT"),
  "POST task.workUpdates": route(addWorkUpdate, "TASKS", "EDIT"),
  "GET ads": route(listAds, "ADS", "VIEW"),
  "POST ads": financial("ADS", "CREATE"),
  "PUT ads": financial("ADS", "EDIT"),
  "POST ads.cancel": financial("ADS", "EDIT"),
  "POST ads.archive": financial("ADS", "EDIT"),
  "GET ads.settings": route(getAdSettings, "ADS", "VIEW"),
  "POST ads.settings": financial("ADS", "EDIT"),
  "GET ads.summary": route(adSummary, "ADS", "VIEW"),
  "GET bank.accounts": route(listBankAccounts, "BANKING", "VIEW"),
  "POST bank.accounts": financial("BANKING", "CREATE"),
  "PUT bank.accounts": financial("BANKING", "EDIT"),
  "GET bank.transactions": route(listBankTransactions, "BANKING", "VIEW"),
  "POST bank.deposit": financial("BANKING", "CREATE"),
  "POST bank.adjustment": financial("BANKING", "APPROVE"),
  "GET invoices": route(listInvoices, "FINANCE", "VIEW"),
  "GET invoices.projectPreview": route(projectInvoicePreview, "FINANCE", "VIEW"),
  "POST invoices": financial("FINANCE", "CREATE"),
  "POST invoices.project": financial("FINANCE", "CREATE"),
  "PUT invoices": financial("FINANCE", "EDIT"),
  "POST invoices.pdf": financial("FINANCE", "PRINT"),
  "GET payments": route(listPayments, "FINANCE", "VIEW"),
  "POST payments": financial("FINANCE", "CREATE"),
  "GET expenses": route(listExpenses, "FINANCE", "VIEW"),
  "POST expenses": financial("FINANCE", "CREATE"),
  "GET client.statement": route(getClientStatement, "FINANCE", "VIEW"),
  "GET studio.jobs": route(listStudioJobs, "STUDIO", "VIEW"),
  "POST studio.jobs": route(createStudioJob, "STUDIO", "CREATE"),
  "PUT studio.jobs": route(updateStudioJob, "STUDIO", "EDIT"),
  "POST studio.assets": route(addStudioAsset, "STUDIO", "EDIT"),
  "GET users": route(listUsers, "USERS", "VIEW"),
  "POST users": route(createUser, "USERS", "CREATE"),
  "PUT users": route(updateUser, "USERS", "EDIT"),
  "POST users.setActive": route(setUserActive, "USERS", "EDIT"),
  "DELETE users": route(deleteUser, "USERS", "DELETE"),
  "POST users.permissions": route(setUserPermissions, "USERS", "APPROVE"),
  "GET system.settings": route(getSystemSettings, "SYSTEM", "VIEW"),
  "PUT system.settings": route(saveSystemSettings, "SYSTEM", "EDIT"),
  "GET documents": route(listDocuments, "PORTALS", "VIEW"),
  "POST documents": route(createDocument, "PORTALS", "EDIT"),
  "DELETE documents": route(archiveDocument, "PORTALS", "DELETE"),
  "GET employee.portal": route(employeePortal, "PORTALS", "VIEW"),
  "POST employee.update": route(employeeUpdate, "PORTALS", "EDIT"),
  "GET client.portal": route(clientPortal, "PORTALS", "VIEW"),
  "GET reports.revenue": route(revenueReport, "REPORTS", "VIEW"),
  "GET reports.profitability": route(profitabilityReport, "REPORTS", "VIEW"),
  "GET reports.productivity": route(productivityReport, "REPORTS", "VIEW"),
  "GET reports.campaigns": route(campaignReport, "REPORTS", "VIEW"),
  "POST files.upload": route(uploadFile, "PORTALS", "EDIT"),
  "GET health": route(health, null, null, { public: true }),
  "POST bootstrap": route(bootstrap, "SYSTEM", "APPROVE", { bootstrap: true }),
  "GET audit": route(auditLog, "SYSTEM", "VIEW"),
  "GET diagnostics": route(diagnostics, "SYSTEM", "VIEW")
});
function resolveRoute(method, name) {
  const key = `${String(method || "GET").toUpperCase()} ${name}`;
  const definition = ROUTES[key];
  if (!definition) throw new ApiError("ROUTE_NOT_FOUND", "\u0645\u0633\u0627\u0631 API \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", { method, route: name }, 404);
  return { key, definition };
}
__name(resolveRoute, "resolveRoute");

// src/services/pdf.js
function ascii(value) {
  return String(value ?? "").replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
}
__name(ascii, "ascii");
function simplePdf(lines) {
  const content = ["BT", "/F1 12 Tf", "50 790 Td"].concat(lines.flatMap((line, index) => [`(${ascii(line)}) Tj`, index === lines.length - 1 ? "" : "0 -20 Td"]).filter(Boolean)).concat(["ET"]).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${new TextEncoder().encode(content).length} >>
stream
${content}
endstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj
${objects[index]}
endobj
`;
  }
  const xref = new TextEncoder().encode(pdf).length;
  pdf += `xref
0 ${objects.length + 1}
` + "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xref}
%%EOF`;
  return new TextEncoder().encode(pdf);
}
__name(simplePdf, "simplePdf");

// src/routes/finance-write.js
async function settings(env) {
  return { ...DEFAULT_AD_SETTINGS, ...settingsObject(await all(env, "SELECT * FROM ads_settings")) };
}
__name(settings, "settings");
function adRecord(data, existing, actor, values, config) {
  const timestamp = now();
  return {
    ad_id: existing?.ad_id || id("AD"),
    client_id: data.clientId,
    project_id: data.projectId || null,
    ad_name: text(data.adName),
    period: text(data.period),
    platform: text(data.platform),
    days: values.days,
    daily_rate: values.dailyRate,
    base_spend: values.baseSpend,
    cost_rate: values.costRate,
    internal_cost: values.internalCost,
    commission_rate: values.commissionRate,
    commission: values.commission,
    sale_price: values.salePrice,
    profit: values.profit,
    profit_margin: values.profitMargin,
    minimum_profit_amount: values.minimumProfitAmount,
    minimum_profit_margin: values.minimumProfitMargin,
    override_reason: text(data.overrideReason),
    bank_account_id: text(data.bankAccountId || config["Default Bank Account"]) || null,
    auto_debit: Number(bool(data.autoDebit)),
    payment_status: data.paymentStatus || "UNPAID",
    status: data.status || "DRAFT",
    client_requirements: text(data.clientRequirements),
    created_by: existing?.created_by || actor.email,
    created_at: existing?.created_at || timestamp,
    updated_at: timestamp,
    cancelled_at: existing?.cancelled_at || null,
    cancellation_reason: existing?.cancellation_reason || ""
  };
}
__name(adRecord, "adRecord");
function insertSql(table, record) {
  const keys = Object.keys(record);
  return { sql: `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`, values: keys.map((key) => record[key]) };
}
__name(insertSql, "insertSql");
function updateSql(table, record, idField, idValue) {
  const keys = Object.keys(record).filter((key) => key !== idField);
  return { sql: `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(",")} WHERE ${idField} = ?`, values: [...keys.map((key) => record[key]), idValue] };
}
__name(updateSql, "updateSql");
function prepared(env, operation) {
  return statement(env, operation.sql, operation.values);
}
__name(prepared, "prepared");
function statementForAd(ad, existing) {
  return {
    statement_entry_id: existing?.statement_entry_id || id("STE"),
    client_id: ad.client_id,
    project_id: ad.project_id || null,
    entry_date: existing?.entry_date || now(),
    entry_type: "AD_CHARGE",
    reference_type: "PAID_AD",
    reference_id: ad.ad_id,
    description: [ad.ad_name, ad.platform, ad.period].filter(Boolean).join(" - "),
    debit: ad.sale_price,
    credit: 0,
    currency: "EGP",
    status: ad.status,
    created_at: existing?.created_at || now(),
    updated_at: now()
  };
}
__name(statementForAd, "statementForAd");
function bankTransaction(data) {
  const timestamp = now();
  return {
    transaction_id: id("BTX"),
    bank_account_id: data.bankAccountId,
    transaction_date: data.transactionDate || timestamp,
    transaction_type: data.type,
    amount: round(data.amount),
    reference_type: text(data.referenceType),
    reference_id: text(data.referenceId),
    description: text(data.description),
    status: "POSTED",
    created_at: timestamp,
    updated_at: timestamp
  };
}
__name(bankTransaction, "bankTransaction");
async function debitAccount(env, accountId, amount, overrideReason, config, creditBack = 0) {
  const account = await first(env, "SELECT * FROM bank_accounts WHERE bank_account_id = ? AND active = 1", [accountId]);
  if (!account) throw new ApiError("BANK_ACCOUNT_NOT_FOUND", "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0645\u0648\u0642\u0648\u0641.", {}, 404);
  const next = round(number(account.current_balance) + number(creditBack) - number(amount));
  if (next < 0 && !bool(config["Allow Negative Bank Balance"]) && !text(overrideReason)) throw new ApiError("NEGATIVE_BANK_BALANCE", "\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0628\u0646\u0643\u064A \u0644\u0627 \u064A\u0643\u0641\u064A. \u0627\u0643\u062A\u0628 \u0633\u0628\u0628 \u0627\u0644\u062A\u062C\u0627\u0648\u0632 \u0623\u0648 \u0641\u0639\u0651\u0644 \u0627\u0644\u0633\u0645\u0627\u062D \u0628\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0633\u0627\u0644\u0628.", { currentBalance: account.current_balance, requested: amount });
  return { account, next };
}
__name(debitAccount, "debitAccount");
async function createAd({ env, actor, data }) {
  required(data, ["clientId", "adName", "platform", "days", "dailyRate"]);
  const client = await first(env, "SELECT * FROM clients WHERE client_id = ?", [data.clientId]);
  if (!client) throw new ApiError("CLIENT_NOT_FOUND", "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const config = await settings(env);
  const values = calculateAd(data, config);
  const ad = adRecord(data, null, actor, values, config);
  const clientEntry = statementForAd(ad, null);
  const statements = [prepared(env, insertSql("paid_ads", ad)), prepared(env, insertSql("client_statements", clientEntry))];
  let transaction = null;
  let balance = null;
  if (ad.auto_debit) {
    if (!ad.bank_account_id) throw new ApiError("BANK_ACCOUNT_REQUIRED", "\u0627\u062E\u062A\u0631 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u0639\u0646\u062F \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062E\u0635\u0645 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A.");
    const debit = await debitAccount(env, ad.bank_account_id, values.bankDebit, ad.override_reason, config);
    balance = debit.next;
    transaction = bankTransaction({ bankAccountId: ad.bank_account_id, amount: values.bankDebit, type: "AD_DEBIT", referenceType: "PAID_AD", referenceId: ad.ad_id, description: `${ad.ad_name} - ${client.client_name} - ${ad.platform}` });
    statements.push(statement(env, "UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE bank_account_id = ?", [balance, now(), ad.bank_account_id]));
    statements.push(prepared(env, insertSql("bank_transactions", transaction)));
  }
  await batch(env, statements);
  if (values.belowMinimum) await audit(env, actor, "ADS_PROFIT_OVERRIDE", "PAID_AD", ad.ad_id, { reason: ad.override_reason, profit: ad.profit, margin: ad.profit_margin });
  await audit(env, actor, "AD_CREATED", "PAID_AD", ad.ad_id, { salePrice: ad.sale_price, bankDebit: values.bankDebit, autoDebit: Boolean(ad.auto_debit), balance });
  return { ad: toApi(ad), statement: toApi(clientEntry), bankTransaction: toApi(transaction), warnings: values.belowMinimum ? ["\u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0623\u0642\u0644 \u0645\u0646 \u062D\u062F \u0627\u0644\u0631\u0628\u062D \u0648\u062A\u0645 \u062D\u0641\u0638 \u0633\u0628\u0628 \u0627\u0644\u062A\u062C\u0627\u0648\u0632."] : [] };
}
__name(createAd, "createAd");
function mergedAdInput(existing, data, actor) {
  const merged = {
    clientId: existing.client_id,
    projectId: existing.project_id,
    adName: existing.ad_name,
    period: existing.period,
    platform: existing.platform,
    days: existing.days,
    dailyRate: existing.daily_rate,
    costRate: existing.cost_rate,
    commissionRate: existing.commission_rate,
    salePrice: existing.sale_price,
    overrideReason: existing.override_reason,
    bankAccountId: existing.bank_account_id,
    autoDebit: Boolean(existing.auto_debit),
    paymentStatus: existing.payment_status,
    status: existing.status,
    clientRequirements: existing.client_requirements,
    ...data
  };
  if (["MEDIA_BUYER", "CREATIVE", "STUDIO", "EMPLOYEE"].includes(actor.role)) {
    merged.status = data.status || existing.status;
    merged.clientRequirements = data.clientRequirements ?? existing.client_requirements;
    for (const key of ["clientId", "projectId", "adName", "period", "platform", "days", "dailyRate", "costRate", "commissionRate", "salePrice", "overrideReason", "bankAccountId", "autoDebit", "paymentStatus"]) merged[key] = {
      clientId: existing.client_id,
      projectId: existing.project_id,
      adName: existing.ad_name,
      period: existing.period,
      platform: existing.platform,
      days: existing.days,
      dailyRate: existing.daily_rate,
      costRate: existing.cost_rate,
      commissionRate: existing.commission_rate,
      salePrice: existing.sale_price,
      overrideReason: existing.override_reason,
      bankAccountId: existing.bank_account_id,
      autoDebit: Boolean(existing.auto_debit),
      paymentStatus: existing.payment_status
    }[key];
  }
  return merged;
}
__name(mergedAdInput, "mergedAdInput");
async function updateAd({ env, actor, data }) {
  required(data, ["adId"]);
  const existing = await first(env, "SELECT * FROM paid_ads WHERE ad_id = ?", [data.adId]);
  if (!existing) throw new ApiError("AD_NOT_FOUND", "\u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const input = mergedAdInput(existing, data, actor);
  const config = await settings(env);
  const values = calculateAd(input, config);
  const ad = adRecord(input, existing, actor, values, config);
  const oldStatement = await first(env, `SELECT * FROM client_statements WHERE reference_type = 'PAID_AD' AND reference_id = ?`, [ad.ad_id]);
  const clientEntry = statementForAd(ad, oldStatement);
  const statements = [prepared(env, updateSql("paid_ads", ad, "ad_id", ad.ad_id))];
  statements.push(oldStatement ? prepared(env, updateSql("client_statements", clientEntry, "statement_entry_id", clientEntry.statement_entry_id)) : prepared(env, insertSql("client_statements", clientEntry)));
  let transaction = await first(env, `SELECT * FROM bank_transactions WHERE transaction_type = 'AD_DEBIT' AND reference_type = 'PAID_AD' AND reference_id = ? AND status != 'REVERSED'`, [ad.ad_id]);
  if (ad.auto_debit) {
    if (!ad.bank_account_id) throw new ApiError("BANK_ACCOUNT_REQUIRED", "\u0627\u062E\u062A\u0631 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u0639\u0646\u062F \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062E\u0635\u0645 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A.");
    if (transaction?.bank_account_id === ad.bank_account_id) {
      const debit = await debitAccount(env, ad.bank_account_id, values.bankDebit, ad.override_reason, config, transaction.amount);
      statements.push(statement(env, "UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE bank_account_id = ?", [debit.next, now(), ad.bank_account_id]));
      transaction = { ...transaction, amount: values.bankDebit, description: `${ad.ad_name} - ${ad.client_id} - ${ad.platform}`, updated_at: now() };
      statements.push(prepared(env, updateSql("bank_transactions", transaction, "transaction_id", transaction.transaction_id)));
    } else {
      if (transaction) {
        statements.push(statement(env, "UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE bank_account_id = ?", [transaction.amount, now(), transaction.bank_account_id]));
        statements.push(statement(env, `UPDATE bank_transactions SET status = 'REVERSED', updated_at = ? WHERE transaction_id = ?`, [now(), transaction.transaction_id]));
      }
      const debit = await debitAccount(env, ad.bank_account_id, values.bankDebit, ad.override_reason, config);
      statements.push(statement(env, "UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE bank_account_id = ?", [debit.next, now(), ad.bank_account_id]));
      transaction = bankTransaction({ bankAccountId: ad.bank_account_id, amount: values.bankDebit, type: "AD_DEBIT", referenceType: "PAID_AD", referenceId: ad.ad_id, description: `${ad.ad_name} - ${ad.client_id} - ${ad.platform}` });
      statements.push(prepared(env, insertSql("bank_transactions", transaction)));
    }
  }
  await batch(env, statements);
  if (values.belowMinimum) await audit(env, actor, "ADS_PROFIT_OVERRIDE", "PAID_AD", ad.ad_id, { reason: ad.override_reason, profit: ad.profit, margin: ad.profit_margin });
  await audit(env, actor, "AD_UPDATED", "PAID_AD", ad.ad_id, { salePrice: ad.sale_price, bankDebit: values.bankDebit });
  return { ad: toApi(ad), statement: toApi(clientEntry), bankTransaction: toApi(transaction), warnings: values.belowMinimum ? ["\u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0623\u0642\u0644 \u0645\u0646 \u062D\u062F \u0627\u0644\u0631\u0628\u062D \u0648\u062A\u0645 \u062D\u0641\u0638 \u0633\u0628\u0628 \u0627\u0644\u062A\u062C\u0627\u0648\u0632."] : [] };
}
__name(updateAd, "updateAd");
async function cancelAd({ env, actor, data }) {
  required(data, ["adId", "cancellationReason"]);
  const ad = await first(env, "SELECT * FROM paid_ads WHERE ad_id = ?", [data.adId]);
  if (!ad) throw new ApiError("AD_NOT_FOUND", "\u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  if (ad.status === "CANCELLED") throw new ApiError("AD_ALREADY_CANCELLED", "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0633\u0627\u0628\u0642\u064B\u0627.");
  const timestamp = now();
  const statements = [
    statement(env, `UPDATE paid_ads SET status = 'CANCELLED', cancelled_at = ?, cancellation_reason = ?, updated_at = ? WHERE ad_id = ?`, [timestamp, text(data.cancellationReason), timestamp, ad.ad_id]),
    statement(env, `UPDATE client_statements SET status = 'CANCELLED', updated_at = ? WHERE reference_type = 'PAID_AD' AND reference_id = ?`, [timestamp, ad.ad_id])
  ];
  let refund = null;
  const refundAmount = round(data.refundAmount);
  if (refundAmount > 0) {
    if (!ad.bank_account_id) throw new ApiError("BANK_ACCOUNT_REQUIRED", "\u0644\u0627 \u064A\u0648\u062C\u062F \u062D\u0633\u0627\u0628 \u0628\u0646\u0643\u064A \u0645\u0633\u062C\u0644 \u0644\u0644\u0625\u0639\u0644\u0627\u0646.");
    refund = bankTransaction({ bankAccountId: ad.bank_account_id, amount: refundAmount, type: "REFUND", referenceType: "PAID_AD", referenceId: ad.ad_id, description: `\u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0625\u0639\u0644\u0627\u0646: ${ad.ad_name}` });
    statements.push(prepared(env, insertSql("bank_transactions", refund)));
    statements.push(statement(env, "UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE bank_account_id = ?", [refundAmount, timestamp, ad.bank_account_id]));
  }
  await batch(env, statements);
  await audit(env, actor, "AD_CANCELLED", "PAID_AD", ad.ad_id, { reason: data.cancellationReason, refundAmount });
  return { ad: toApi({ ...ad, status: "CANCELLED", cancelled_at: timestamp, cancellation_reason: text(data.cancellationReason), updated_at: timestamp }), refund: toApi(refund) };
}
__name(cancelAd, "cancelAd");
async function archiveAd({ env, actor, data }) {
  required(data, ["adId"]);
  const existing = await first(env, "SELECT * FROM paid_ads WHERE ad_id = ?", [data.adId]);
  if (!existing) throw new ApiError("AD_NOT_FOUND", "الإعلان غير موجود.", {}, 404);
  const archived = data.archived === void 0 ? true : bool(data.archived);
  const saved = await update(env, "paid_ads", { archived: Number(archived), updated_at: now() }, "ad_id", data.adId);
  await audit(env, actor, archived ? "AD_ARCHIVED" : "AD_RESTORED", "PAID_AD", data.adId, { archived });
  return { archived, ad: toApi(saved) };
}
__name(archiveAd, "archiveAd");
async function saveAdSettings({ env, actor, data }) {
  if (actor.userType !== "ADMIN" && actor.role !== "MANAGER") throw new ApiError("FORBIDDEN", "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u0645\u062F\u064A\u0631 \u0641\u0642\u0637.", {}, 403);
  const allowed = ["Default Cost Rate", "Default Commission Rate", "Default Currency", "Minimum Profit Amount", "Minimum Profit Margin", "Default Bank Account", "Allow Negative Bank Balance"];
  const timestamp = now();
  const statements = allowed.filter((key) => data[key] !== void 0).map((key) => statement(env, `INSERT INTO ads_settings (setting_key,setting_value,description,updated_at) VALUES (?,?,?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at`, [key, String(data[key]), key, timestamp]));
  await batch(env, statements);
  await audit(env, actor, "ADS_SETTINGS_UPDATED", "SETTINGS", "ADS", data);
  return { settings: await settings(env), updated: statements.length };
}
__name(saveAdSettings, "saveAdSettings");
async function createBankAccount({ env, actor, data }) {
  required(data, ["accountName", "bankName"]);
  const timestamp = now();
  const opening = round(data.openingBalance);
  const record = { bank_account_id: id("BNK"), account_name: text(data.accountName), bank_name: text(data.bankName), account_number_masked: text(data.accountNumberMasked), opening_balance: opening, current_balance: opening, currency: data.currency || "EGP", active: data.active === void 0 ? 1 : Number(bool(data.active)), created_at: timestamp, updated_at: timestamp };
  await insert(env, "bank_accounts", record);
  await audit(env, actor, "BANK_ACCOUNT_CREATED", "BANK_ACCOUNT", record.bank_account_id, record);
  return { account: toApi(record) };
}
__name(createBankAccount, "createBankAccount");
async function updateBankAccount({ env, actor, data }) {
  required(data, ["bankAccountId"]);
  const existing = await first(env, "SELECT * FROM bank_accounts WHERE bank_account_id = ?", [data.bankAccountId]);
  if (!existing) throw new ApiError("BANK_ACCOUNT_NOT_FOUND", "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const saved = await update(env, "bank_accounts", { account_name: data.accountName ?? existing.account_name, bank_name: data.bankName ?? existing.bank_name, account_number_masked: data.accountNumberMasked ?? existing.account_number_masked, currency: data.currency ?? existing.currency, active: data.active === void 0 ? existing.active : Number(bool(data.active)), updated_at: now() }, "bank_account_id", data.bankAccountId);
  await audit(env, actor, "BANK_ACCOUNT_UPDATED", "BANK_ACCOUNT", data.bankAccountId, data);
  return { account: toApi(saved) };
}
__name(updateBankAccount, "updateBankAccount");
async function bankDeposit({ env, actor, data }) {
  required(data, ["bankAccountId", "amount"]);
  const amount = round(data.amount);
  if (amount <= 0) throw new ApiError("INVALID_AMOUNT", "\u0642\u064A\u0645\u0629 \u0627\u0644\u0625\u064A\u062F\u0627\u0639 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631.");
  const account = await first(env, "SELECT * FROM bank_accounts WHERE bank_account_id = ? AND active = 1", [data.bankAccountId]);
  if (!account) throw new ApiError("BANK_ACCOUNT_NOT_FOUND", "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0645\u0648\u0642\u0648\u0641.", {}, 404);
  const transaction = bankTransaction({ bankAccountId: data.bankAccountId, amount, type: "DEPOSIT", referenceType: data.referenceType || "MANUAL", referenceId: data.reference || "", description: data.description || "\u0625\u064A\u062F\u0627\u0639 \u0628\u0646\u0643\u064A" });
  const balance = round(number(account.current_balance) + amount);
  await batch(env, [prepared(env, insertSql("bank_transactions", transaction)), statement(env, "UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE bank_account_id = ?", [balance, now(), data.bankAccountId])]);
  await audit(env, actor, "BANK_DEPOSIT", "BANK_TRANSACTION", transaction.transaction_id, { amount, balance });
  return { transaction: toApi(transaction), currentBalance: balance };
}
__name(bankDeposit, "bankDeposit");
async function bankAdjustment({ env, actor, data }) {
  required(data, ["bankAccountId", "amount", "description"]);
  const amount = round(data.amount);
  if (!amount) throw new ApiError("INVALID_AMOUNT", "\u0642\u064A\u0645\u0629 \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0635\u0641\u0631\u064B\u0627.");
  const account = await first(env, "SELECT * FROM bank_accounts WHERE bank_account_id = ?", [data.bankAccountId]);
  if (!account) throw new ApiError("BANK_ACCOUNT_NOT_FOUND", "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", {}, 404);
  const transaction = bankTransaction({ bankAccountId: data.bankAccountId, amount, type: "ADJUSTMENT", referenceType: "MANUAL", referenceId: data.reference || "", description: data.description });
  const balance = round(number(account.current_balance) + amount);
  await batch(env, [prepared(env, insertSql("bank_transactions", transaction)), statement(env, "UPDATE bank_accounts SET current_balance = ?, updated_at = ? WHERE bank_account_id = ?", [balance, now(), data.bankAccountId])]);
  await audit(env, actor, "BANK_ADJUSTMENT", "BANK_TRANSACTION", transaction.transaction_id, { amount, balance });
  return { transaction: toApi(transaction), currentBalance: balance };
}
__name(bankAdjustment, "bankAdjustment");
async function loadSystemSettings(env) {
  return { ...DEFAULT_SYSTEM_SETTINGS, ...settingsObject(await all(env, "SELECT * FROM settings")) };
}
__name(loadSystemSettings, "loadSystemSettings");

function makeInvoiceNumber(config, timestamp) {
  const prefix = text(config["Invoice Prefix"] || "ANC").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12) || "ANC";
  return prefix + "-" + timestamp.replace(/D/g, "").slice(0, 14);
}
__name(makeInvoiceNumber, "makeInvoiceNumber");

async function createInvoice({ env, actor, data }) {
  required(data, ["clientId", "issueDate", "dueDate", "amount"]);
  const client = await first(env, "SELECT * FROM clients WHERE client_id = ?", [data.clientId]);
  if (!client) throw new ApiError("CLIENT_NOT_FOUND", "العميل غير موجود.", {}, 404);
  if (data.projectId) {
    const project = await first(env, "SELECT project_id FROM projects WHERE project_id=? AND client_id=?", [data.projectId, data.clientId]);
    if (!project) throw new ApiError("PROJECT_NOT_FOUND", "المشروع غير موجود أو لا يتبع العميل المحدد.", {}, 404);
  }
  const config = await loadSystemSettings(env);
  const timestamp = now();
  const invoice = {
    invoice_id: id("INV"),
    client_id: data.clientId,
    project_id: data.projectId || null,
    invoice_number: data.invoiceNumber || makeInvoiceNumber(config, timestamp),
    issue_date: data.issueDate,
    due_date: data.dueDate,
    amount: round(data.amount),
    tax_amount: round(data.taxAmount),
    currency: data.currency || config["Default Currency"] || "EGP",
    status: data.status || "DRAFT",
    pdf_key: "",
    pdf_url: "",
    notes: text(data.notes),
    created_at: timestamp,
    updated_at: timestamp
  };
  const entry = {
    statement_entry_id: id("STE"),
    client_id: data.clientId,
    project_id: data.projectId || null,
    entry_date: data.issueDate,
    entry_type: "INVOICE",
    reference_type: "INVOICE",
    reference_id: invoice.invoice_id,
    description: "فاتورة رقم " + invoice.invoice_number,
    debit: round(invoice.amount + invoice.tax_amount),
    credit: 0,
    currency: invoice.currency,
    status: invoice.status,
    created_at: timestamp,
    updated_at: timestamp
  };
  await batch(env, [prepared(env, insertSql("invoices", invoice)), prepared(env, insertSql("client_statements", entry))]);
  await audit(env, actor, "INVOICE_CREATED", "INVOICE", invoice.invoice_id, invoice);
  return { invoice: toApi(invoice), statementEntry: toApi(entry) };
}
__name(createInvoice, "createInvoice");

async function createProjectInvoice({ env, actor, data }) {
  required(data, ["clientId", "projectId"]);
  const project = await first(env, "SELECT p.*, c.client_name FROM projects p JOIN clients c ON c.client_id=p.client_id WHERE p.project_id=? AND p.client_id=?", [data.projectId, data.clientId]);
  if (!project) throw new ApiError("PROJECT_NOT_FOUND", "المشروع غير موجود أو لا يتبع العميل المحدد.", {}, 404);
  const sources = await all(env, "SELECT cs.statement_entry_id, cs.reference_type, cs.reference_id, cs.description, cs.debit, cs.currency FROM client_statements cs WHERE cs.client_id=? AND cs.project_id=? AND cs.debit>0 AND cs.status!='CANCELLED' AND cs.reference_type!='INVOICE' AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.source_type=cs.reference_type AND ii.source_id=cs.statement_entry_id) ORDER BY cs.entry_date", [data.clientId, data.projectId]);
  if (!sources.length) throw new ApiError("NO_BILLABLE_ITEMS", "لا توجد بنود غير مفوترة داخل هذا المشروع.");
  const config = await loadSystemSettings(env);
  const timestamp = now();
  const issueDate = data.issueDate || timestamp.slice(0, 10);
  const defaultDue = new Date(issueDate + "T00:00:00.000Z");
  defaultDue.setUTCDate(defaultDue.getUTCDate() + Math.max(0, Math.min(365, number(config["Payment Terms Days"], 14))));
  const dueDate = data.dueDate || defaultDue.toISOString().slice(0, 10);
  const taxRate = data.taxRate === void 0 || data.taxRate === "" ? number(config["Invoice Tax Rate"], 0) : number(data.taxRate);
  if (taxRate < 0 || taxRate > 100) throw new ApiError("INVALID_TAX_RATE", "نسبة الضريبة يجب أن تكون بين 0 و100.");
  const amount = round(sources.reduce((sum2, row) => sum2 + number(row.debit), 0));
  const taxAmount = round(amount * taxRate / 100);
  const invoice = {
    invoice_id: id("INV"),
    client_id: data.clientId,
    project_id: data.projectId,
    invoice_number: data.invoiceNumber || makeInvoiceNumber(config, timestamp),
    issue_date: issueDate,
    due_date: dueDate,
    amount,
    tax_amount: taxAmount,
    currency: data.currency || sources[0].currency || config["Default Currency"] || "EGP",
    status: data.status || "DRAFT",
    pdf_key: "",
    pdf_url: "",
    notes: text(data.notes),
    created_at: timestamp,
    updated_at: timestamp
  };
  const invoiceItems = sources.map((source) => ({
    invoice_item_id: id("INI"),
    invoice_id: invoice.invoice_id,
    project_id: data.projectId,
    source_type: source.reference_type,
    source_id: source.statement_entry_id,
    description: source.description,
    quantity: 1,
    unit_price: round(source.debit),
    amount: round(source.debit),
    created_at: timestamp
  }));
  const entry = {
    statement_entry_id: id("STE"),
    client_id: data.clientId,
    project_id: data.projectId,
    entry_date: issueDate,
    entry_type: "INVOICE_DOCUMENT",
    reference_type: "INVOICE",
    reference_id: invoice.invoice_id,
    description: "فاتورة مشروع " + project.project_name + " رقم " + invoice.invoice_number,
    debit: 0,
    credit: 0,
    currency: invoice.currency,
    status: invoice.status,
    created_at: timestamp,
    updated_at: timestamp
  };
  const statements = [
    prepared(env, insertSql("invoices", invoice)),
    ...invoiceItems.map((item) => prepared(env, insertSql("invoice_items", item))),
    prepared(env, insertSql("client_statements", entry))
  ];
  await batch(env, statements);
  await audit(env, actor, "PROJECT_INVOICE_CREATED", "INVOICE", invoice.invoice_id, { projectId: data.projectId, itemCount: invoiceItems.length, amount, taxAmount });
  return { invoice: toApi({ ...invoice, client_name: project.client_name, project_name: project.project_name }), items: toApiList(invoiceItems), statementEntry: toApi(entry) };
}
__name(createProjectInvoice, "createProjectInvoice");
async function updateInvoice({ env, actor, data }) {
  required(data, ["invoiceId"]);
  const existing = await first(env, "SELECT * FROM invoices WHERE invoice_id = ?", [data.invoiceId]);
  if (!existing) throw new ApiError("INVOICE_NOT_FOUND", "\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.", {}, 404);
  const saved = { ...existing, project_id: data.projectId ?? existing.project_id, issue_date: data.issueDate ?? existing.issue_date, due_date: data.dueDate ?? existing.due_date, amount: data.amount === void 0 ? existing.amount : round(data.amount), tax_amount: data.taxAmount === void 0 ? existing.tax_amount : round(data.taxAmount), currency: data.currency ?? existing.currency, status: data.status ?? existing.status, updated_at: now() };
  const statements = [prepared(env, updateSql("invoices", saved, "invoice_id", saved.invoice_id)), statement(env, `UPDATE client_statements SET entry_date=?, debit=?, currency=?, status=?, updated_at=? WHERE reference_type='INVOICE' AND reference_id=?`, [saved.issue_date, round(saved.amount + saved.tax_amount), saved.currency, saved.status, now(), saved.invoice_id])];
  await batch(env, statements);
  await audit(env, actor, "INVOICE_UPDATED", "INVOICE", saved.invoice_id, data);
  return { invoice: toApi(saved) };
}
__name(updateInvoice, "updateInvoice");
async function recordPayment({ env, actor, data }) {
  required(data, ["invoiceId", "clientId", "paymentDate", "amount"]);
  const invoice = await first(env, "SELECT * FROM invoices WHERE invoice_id = ? AND client_id = ?", [data.invoiceId, data.clientId]);
  if (!invoice) throw new ApiError("INVOICE_NOT_FOUND", "\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0623\u0648 \u0644\u0627 \u062A\u062E\u0635 \u0627\u0644\u0639\u0645\u064A\u0644.", {}, 404);
  const payment = { payment_id: id("PAY"), invoice_id: data.invoiceId, client_id: data.clientId, payment_date: data.paymentDate, amount: round(data.amount), currency: data.currency || invoice.currency, method: text(data.method), reference: text(data.reference), created_at: now() };
  const entry = { statement_entry_id: id("STE"), client_id: data.clientId, entry_date: data.paymentDate, entry_type: "PAYMENT", reference_type: "PAYMENT", reference_id: payment.payment_id, description: `\u062F\u0641\u0639\u0629 \u0644\u0644\u0641\u0627\u062A\u0648\u0631\u0629 ${invoice.invoice_number}`, debit: 0, credit: payment.amount, currency: payment.currency, status: "POSTED", created_at: now(), updated_at: now() };
  const totals = await first(env, "SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE invoice_id = ?", [data.invoiceId]);
  const totalPaid = round(number(totals?.paid) + payment.amount);
  const total = round(number(invoice.amount) + number(invoice.tax_amount));
  const status = totalPaid >= total ? "PAID" : "PARTIALLY_PAID";
  await batch(env, [prepared(env, insertSql("payments", payment)), prepared(env, insertSql("client_statements", entry)), statement(env, "UPDATE invoices SET status = ?, updated_at = ? WHERE invoice_id = ?", [status, now(), invoice.invoice_id])]);
  await audit(env, actor, "PAYMENT_RECORDED", "PAYMENT", payment.payment_id, payment);
  return { payment: toApi(payment), statementEntry: toApi(entry), invoiceStatus: status };
}
__name(recordPayment, "recordPayment");
async function createExpense({ env, actor, data }) {
  required(data, ["expenseDate", "category", "description", "amount"]);
  const expense = { expense_id: id("EXP"), expense_date: data.expenseDate, category: text(data.category), description: text(data.description), client_id: data.clientId || null, project_id: data.projectId || null, amount: round(data.amount), currency: data.currency || "EGP", vendor: text(data.vendor), payment_method: text(data.paymentMethod), created_by: actor.email, created_at: now() };
  const statements = [prepared(env, insertSql("expenses", expense))];
  let transaction = null;
  if (bool(data.autoDebit)) {
    required(data, ["bankAccountId"]);
    const config = await settings(env);
    const debit = await debitAccount(env, data.bankAccountId, expense.amount, data.overrideReason, config);
    transaction = bankTransaction({ bankAccountId: data.bankAccountId, amount: expense.amount, type: "EXPENSE_DEBIT", referenceType: "EXPENSE", referenceId: expense.expense_id, description: expense.description });
    statements.push(prepared(env, insertSql("bank_transactions", transaction)), statement(env, "UPDATE bank_accounts SET current_balance=?, updated_at=? WHERE bank_account_id=?", [debit.next, now(), data.bankAccountId]));
  }
  await batch(env, statements);
  await audit(env, actor, "EXPENSE_CREATED", "EXPENSE", expense.expense_id, expense);
  return { expense: toApi(expense), bankTransaction: toApi(transaction) };
}
__name(createExpense, "createExpense");
async function createInvoicePdf({ env, actor, data }) {
  required(data, ["invoiceId"]);
  const [invoice, items, payments, settingsRows] = await Promise.all([
    first(env, "SELECT i.*, c.client_name, p.project_name FROM invoices i JOIN clients c ON c.client_id=i.client_id LEFT JOIN projects p ON p.project_id=i.project_id WHERE i.invoice_id=?", [data.invoiceId]),
    all(env, "SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY created_at", [data.invoiceId]),
    all(env, "SELECT * FROM payments WHERE invoice_id=? ORDER BY payment_date", [data.invoiceId]),
    all(env, "SELECT * FROM settings")
  ]);
  if (!invoice) throw new ApiError("INVOICE_NOT_FOUND", "الفاتورة غير موجودة.", {}, 404);
  const config = { ...DEFAULT_SYSTEM_SETTINGS, ...settingsObject(settingsRows) };
  const pdf = await buildInvoicePdf({ invoice, items, payments, settings: config });
  const key = "invoices/" + invoice.invoice_id + ".pdf";
  const fileName = invoice.invoice_number + ".pdf";
  await env.FILES.put(key, pdf, {
    httpMetadata: { contentType: "application/pdf", contentDisposition: 'inline; filename="' + fileName + '"' },
    customMetadata: { invoiceId: invoice.invoice_id, clientId: invoice.client_id, projectId: invoice.project_id || "" }
  });
  const url = await signedFileUrl(env, key, 3600);
  const timestamp = now();
  const documentId = id("DOC");
  await batch(env, [
    statement(env, "UPDATE invoices SET pdf_key=?, pdf_url=?, updated_at=? WHERE invoice_id=?", [key, url, timestamp, invoice.invoice_id]),
    statement(env, "INSERT INTO documents (document_id,client_id,project_id,category,title,file_name,content_type,file_size,r2_key,visibility,status,uploaded_by,created_at,updated_at,archived_at) VALUES (?,?,?,?,?,?,?,?,?,'CLIENT','ACTIVE',?,?,?,NULL) ON CONFLICT(r2_key) DO UPDATE SET title=excluded.title,file_name=excluded.file_name,file_size=excluded.file_size,status='ACTIVE',updated_at=excluded.updated_at,archived_at=NULL", [
      documentId, invoice.client_id, invoice.project_id || null, "INVOICE", "فاتورة " + invoice.invoice_number, fileName, "application/pdf", pdf.byteLength, key, actor.email, timestamp, timestamp
    ])
  ]);
  await audit(env, actor, "INVOICE_PDF_CREATED", "INVOICE", invoice.invoice_id, { key, itemCount: items.length, size: pdf.byteLength });
  return { fileId: key, url, name: fileName, size: pdf.byteLength };
}
__name(createInvoicePdf, "createInvoicePdf");var APP_NAME = "ANC Marketing Agency ERP";
var OPERATIONS = Object.freeze({
  "POST ads": createAd,
  "PUT ads": updateAd,
  "POST ads.cancel": cancelAd,
  "POST ads.archive": archiveAd,
  "POST ads.settings": saveAdSettings,
  "POST bank.accounts": createBankAccount,
  "PUT bank.accounts": updateBankAccount,
  "POST bank.deposit": bankDeposit,
  "POST bank.adjustment": bankAdjustment,
  "POST invoices": createInvoice,
  "POST invoices.project": createProjectInvoice,
  "PUT invoices": updateInvoice,
  "POST invoices.pdf": createInvoicePdf,
  "POST payments": recordPayment,
  "POST expenses": createExpense
});
async function dispatchFinancial(operation, context) {
  const handler = OPERATIONS[operation];
  if (!handler) throw new ApiError("FINANCIAL_ROUTE_NOT_FOUND", "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", { operation }, 404);
  return handler(context);
}
__name(dispatchFinancial, "dispatchFinancial");

// src/finance-coordinator.js
var FinanceCoordinator = class {
  static {
    __name(this, "FinanceCoordinator");
  }
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    try {
      const payload = await request.json();
      if (!payload?.operation || !payload?.actor || !payload?.idempotencyKey) throw new ApiError("INVALID_INTERNAL_REQUEST", "\u0637\u0644\u0628 \u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0645\u0627\u0644\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", {}, 400);
      const actorId = payload.actor.userId || payload.actor.email;
      const existing = await first(this.env, "SELECT response_json FROM idempotency_keys WHERE idempotency_key = ? AND actor_id = ? AND route = ?", [payload.idempotencyKey, actorId, payload.operation]);
      if (existing) return Response.json({ ok: true, result: JSON.parse(existing.response_json), replayed: true });
      const result = await dispatchFinancial(payload.operation, { env: this.env, actor: payload.actor, data: payload.data || {} });
      await insert(this.env, "idempotency_keys", { idempotency_key: payload.idempotencyKey, actor_id: actorId, route: payload.operation, response_json: JSON.stringify(result), created_at: now() });
      return Response.json({ ok: true, result, replayed: false });
    } catch (error) {
      return Response.json({ ok: false, error: { code: error?.code || "INTERNAL_ERROR", message: error?.code ? error.message : "\u062D\u062F\u062B \u062E\u0637\u0623 \u0645\u0627\u0644\u064A \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639.", details: error?.details || {}, status: error?.status || 500 } });
    }
  }
};

// src/index.js
async function financialCall(env, operation, actor, data, idempotencyKey) {
  const coordinatorId = env.FINANCE_COORDINATOR.idFromName("anc-global-finance");
  const coordinator = env.FINANCE_COORDINATOR.get(coordinatorId);
  const response = await coordinator.fetch("https://finance.internal/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, actor, data, idempotencyKey })
  });
  const payload = await response.json();
  if (!payload.ok) throw new ApiError(payload.error.code, payload.error.message, payload.error.details, payload.error.status);
  return payload.result;
}
__name(financialCall, "financialCall");
async function parsePayload(request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return {
      route: url.searchParams.get("route") || "health",
      method: "GET",
      data: Object.fromEntries(url.searchParams.entries()),
      idToken: request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "",
      idempotencyKey: request.headers.get("X-Idempotency-Key") || crypto.randomUUID()
    };
  }
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 12 * 1024 * 1024) throw new ApiError("PAYLOAD_TOO_LARGE", "\u062D\u062C\u0645 \u0627\u0644\u0637\u0644\u0628 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u0633\u0645\u0648\u062D.", {}, 413);
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("INVALID_JSON", "\u0635\u064A\u063A\u0629 \u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.");
  }
  return {
    route: body.route || "",
    method: String(body.method || "POST").toUpperCase(),
    data: body.data || {},
    idToken: body.idToken || request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "",
    idempotencyKey: body.idempotencyKey || request.headers.get("X-Idempotency-Key") || crypto.randomUUID()
  };
}
__name(parsePayload, "parsePayload");
var index_default = {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    let origin = "";
    let actor = null;
    let routeName = "";
    try {
      origin = allowedOrigin(request, env);
      const corsHeaders = cors(origin);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
      const url = new URL(request.url);
      if (url.pathname.startsWith("/files/")) {
        const key2 = url.pathname.slice("/files/".length).split("/").map(decodeURIComponent).join("/");
        const response = await serveFile(request, env, key2);
        Object.entries(corsHeaders).forEach(([name, value]) => response.headers.set(name, value));
        return response;
      }
      const payload = await parsePayload(request);
      routeName = payload.route;
      const { key, definition } = resolveRoute(payload.method, payload.route);
      if (!definition.public) {
        if (definition.bootstrap && !payload.idToken) actor = null;
        else actor = await authenticate(env, payload.idToken);
        if (actor) await authorize(env, actor, definition.module, definition.action);
      }
      const context = { env, actor, data: payload.data, request, requestId };
      const result = definition.financial ? await financialCall(env, key, actor, payload.data, payload.idempotencyKey) : await definition.handler(context);
      return success(result, 200, corsHeaders);
    } catch (error) {
      if (env.DB) await auditError(env, actor, error, requestId, routeName);
      return failure(error, cors(origin));
    }
  }
};
export {
  FinanceCoordinator,
  index_default as default
};
//# sourceMappingURL=index.js.map
