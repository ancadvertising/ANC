-- ANC ERP staging-only schema baseline.
-- Generated from the production schema without records on 2026-07-26.
-- Never execute this file against the production D1 database.
PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE employees (
  employee_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  start_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LEAD',
  primary_contact TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  account_manager TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  username TEXT NOT NULL DEFAULT '',
  password_salt TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  user_type TEXT NOT NULL CHECK (user_type IN ('ADMIN','EMPLOYEE','CLIENT')),
  employee_id TEXT REFERENCES employees(employee_id),
  client_id TEXT REFERENCES clients(client_id),
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  last_login TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE roles (
  role_id TEXT PRIMARY KEY,
  role_code TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE permissions (
  permission_id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(module, action)
);
CREATE TABLE employee_permissions (
  employee_permission_id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  permission_id TEXT NOT NULL REFERENCES permissions(permission_id),
  allowed INTEGER NOT NULL CHECK (allowed IN (0,1)),
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(employee_id, permission_id)
);
CREATE TABLE contacts (
  contact_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  primary_contact INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE client_activities (
  activity_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  employee_id TEXT REFERENCES employees(employee_id),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  activity_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  account_manager TEXT NOT NULL DEFAULT '',
  start_date TEXT,
  due_date TEXT,
  budget REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(project_id),
  task_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  assignee TEXT NOT NULL DEFAULT '',
  employee_id TEXT REFERENCES employees(employee_id),
  assigned_email TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  estimated_hours REAL NOT NULL DEFAULT 0,
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE task_comments (
  comment_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(task_id),
  employee_id TEXT REFERENCES employees(employee_id),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE task_attachments (
  attachment_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(task_id),
  file_key TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE task_work_updates (
  update_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(task_id),
  employee_id TEXT REFERENCES employees(employee_id),
  progress_percent REAL NOT NULL DEFAULT 0,
  progress_details TEXT NOT NULL DEFAULT '',
  delivery_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE timesheets (
  timesheet_id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  project_id TEXT REFERENCES projects(project_id),
  task_id TEXT REFERENCES tasks(task_id),
  work_date TEXT NOT NULL,
  hours REAL NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  approval_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE bank_accounts (
  bank_account_id TEXT PRIMARY KEY,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number_masked TEXT NOT NULL DEFAULT '',
  opening_balance REAL NOT NULL DEFAULT 0,
  current_balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE paid_ads (
  ad_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  project_id TEXT REFERENCES projects(project_id),
  ad_name TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  days REAL NOT NULL,
  daily_rate REAL NOT NULL,
  base_spend REAL NOT NULL,
  cost_rate REAL NOT NULL,
  internal_cost REAL NOT NULL,
  commission_rate REAL NOT NULL,
  commission REAL NOT NULL,
  sale_price REAL NOT NULL,
  profit REAL NOT NULL,
  profit_margin REAL NOT NULL,
  minimum_profit_amount REAL NOT NULL,
  minimum_profit_margin REAL NOT NULL,
  override_reason TEXT NOT NULL DEFAULT '',
  bank_account_id TEXT REFERENCES bank_accounts(bank_account_id),
  auto_debit INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  client_requirements TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  cancelled_at TEXT,
  cancellation_reason TEXT NOT NULL DEFAULT ''
, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE campaigns (
  campaign_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  project_id TEXT REFERENCES projects(project_id),
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  budget REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE ads_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE bank_transactions (
  transaction_id TEXT PRIMARY KEY,
  bank_account_id TEXT NOT NULL REFERENCES bank_accounts(bank_account_id),
  transaction_date TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('DEPOSIT','AD_DEBIT','EXPENSE_DEBIT','ADJUSTMENT','REFUND')),
  amount REAL NOT NULL,
  reference_type TEXT NOT NULL DEFAULT '',
  reference_id TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'POSTED',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE client_statements (
  statement_entry_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  entry_date TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  description TEXT NOT NULL,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
, project_id TEXT);
CREATE TABLE studio_jobs (
  studio_job_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  project_id TEXT REFERENCES projects(project_id),
  job_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO',
  assigned_to TEXT NOT NULL DEFAULT '',
  employee_id TEXT REFERENCES employees(employee_id),
  due_date TEXT,
  delivery_url TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE studio_assets (
  asset_id TEXT PRIMARY KEY,
  studio_job_id TEXT NOT NULL REFERENCES studio_jobs(studio_job_id),
  file_key TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE invoices (
  invoice_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  project_id TEXT REFERENCES projects(project_id),
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount REAL NOT NULL,
  tax_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  pdf_key TEXT NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
, notes TEXT NOT NULL DEFAULT '');
CREATE TABLE payments (
  payment_id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(invoice_id),
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  payment_date TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  method TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE expenses (
  expense_id TEXT PRIMARY KEY,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  client_id TEXT REFERENCES clients(client_id),
  project_id TEXT REFERENCES projects(project_id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  vendor TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE statements (
  statement_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  statement_date TEXT NOT NULL,
  from_date TEXT,
  to_date TEXT,
  total_invoiced REAL NOT NULL DEFAULT 0,
  total_paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  pdf_key TEXT NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE notifications (
  notification_id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(employee_id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_module TEXT NOT NULL DEFAULT '',
  related_id TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE audit_log (
  audit_id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE idempotency_keys (
  idempotency_key TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  route TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (idempotency_key, actor_id, route)
);
CREATE TABLE approval_requests (
  approval_id TEXT PRIMARY KEY,
  requested_by_user_id TEXT NOT NULL,
  requested_by_email TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('CLIENT', 'PROJECT')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'STATUS', 'ARCHIVE', 'RESTORE')),
  payload_json TEXT NOT NULL,
  before_json TEXT NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED')),
  reviewed_by_user_id TEXT,
  reviewed_by_email TEXT NOT NULL DEFAULT '',
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE TABLE invoice_items (
  invoice_item_id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(source_type, source_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
CREATE TABLE documents (
  document_id TEXT PRIMARY KEY,
  client_id TEXT,
  project_id TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  visibility TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (visibility IN ('INTERNAL', 'CLIENT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(client_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_tasks_employee ON tasks(employee_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_ads_client ON paid_ads(client_id);
CREATE INDEX idx_ads_project ON paid_ads(project_id);
CREATE INDEX idx_bank_tx_account ON bank_transactions(bank_account_id, transaction_date);
CREATE INDEX idx_bank_tx_reference ON bank_transactions(reference_type, reference_id);
CREATE INDEX idx_statements_client ON client_statements(client_id, entry_date);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_approval_requests_status_created
  ON approval_requests(status, created_at DESC);
CREATE INDEX idx_approval_requests_requester
  ON approval_requests(requested_by_user_id, created_at DESC);
CREATE UNIQUE INDEX idx_approval_requests_one_pending_entity
  ON approval_requests(requested_by_user_id, entity_type, entity_id, action)
  WHERE status IN ('PENDING', 'PROCESSING');
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_project ON invoice_items(project_id);
CREATE INDEX idx_documents_client ON documents(client_id, created_at DESC);
CREATE INDEX idx_documents_project ON documents(project_id, created_at DESC);
CREATE INDEX idx_documents_status ON documents(status, created_at DESC);
INSERT OR IGNORE INTO d1_migrations(name) VALUES
  ('0001_initial.sql'),
  ('0002_assistant_approvals.sql'),
  ('0003_platform_workflows.sql');
