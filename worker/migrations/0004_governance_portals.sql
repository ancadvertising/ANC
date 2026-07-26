PRAGMA foreign_keys = OFF;

CREATE TABLE approval_requests_v2 (
  approval_id TEXT PRIMARY KEY,
  requested_by_user_id TEXT NOT NULL,
  requested_by_email TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('CLIENT','PROJECT','TASK','AD','STUDIO_JOB','USER','DOCUMENT','INVOICE','BANK_ACCOUNT','EXPENSE')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS','ARCHIVE','RESTORE','DELETE','PERMISSIONS')),
  payload_json TEXT NOT NULL,
  before_json TEXT NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','APPROVED','REJECTED')),
  reviewed_by_user_id TEXT,
  reviewed_by_email TEXT NOT NULL DEFAULT '',
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
INSERT INTO approval_requests_v2 SELECT * FROM approval_requests;
DROP TABLE approval_requests;
ALTER TABLE approval_requests_v2 RENAME TO approval_requests;
CREATE INDEX idx_approvals_status_created ON approval_requests(status, created_at DESC);
CREATE INDEX idx_approvals_requester ON approval_requests(requested_by_user_id, created_at DESC);

ALTER TABLE expenses ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE expenses ADD COLUMN updated_at TEXT;
ALTER TABLE expenses ADD COLUMN archived_at TEXT;

CREATE TABLE note_labels (
  label_id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  color TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE entity_notes (
  note_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE note_label_links (
  note_id TEXT NOT NULL REFERENCES entity_notes(note_id),
  label_id TEXT NOT NULL REFERENCES note_labels(label_id),
  PRIMARY KEY (note_id, label_id)
);
CREATE INDEX idx_entity_notes_lookup ON entity_notes(entity_type, entity_id, created_at DESC);

CREATE TABLE popup_notifications (
  notification_id TEXT PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  message_en TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('EMPLOYEES','CLIENTS','ALL')),
  frequency TEXT NOT NULL CHECK (frequency IN ('ONCE','EVERY_SESSION')),
  requires_ack INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE popup_notification_receipts (
  notification_id TEXT NOT NULL REFERENCES popup_notifications(notification_id),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  seen_at TEXT,
  acknowledged_at TEXT,
  PRIMARY KEY (notification_id, user_id, session_id)
);
CREATE INDEX idx_popup_notifications_active ON popup_notifications(active, starts_at, ends_at);

CREATE TABLE service_requests (
  request_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(client_id),
  project_id TEXT REFERENCES projects(project_id),
  title TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','IN_REVIEW','QUOTED','ACCEPTED','REJECTED','CLOSED')),
  created_by_user_id TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  client_unread INTEGER NOT NULL DEFAULT 0,
  admin_unread INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE service_request_messages (
  message_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(request_id),
  sender_user_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'MESSAGE' CHECK (message_type IN ('MESSAGE','QUOTATION','STATUS')),
  quotation_amount REAL,
  quotation_currency TEXT,
  quotation_valid_until TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_service_requests_client ON service_requests(client_id, updated_at DESC);
CREATE INDEX idx_service_request_messages ON service_request_messages(request_id, created_at);

CREATE TABLE studio_job_assignments (
  studio_job_id TEXT NOT NULL REFERENCES studio_jobs(studio_job_id),
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  assigned_hours REAL NOT NULL DEFAULT 0,
  hourly_cost REAL NOT NULL DEFAULT 0,
  actual_hours REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (studio_job_id, employee_id)
);
ALTER TABLE studio_jobs ADD COLUMN sale_price REAL NOT NULL DEFAULT 0;
ALTER TABLE studio_jobs ADD COLUMN direct_cost REAL NOT NULL DEFAULT 0;
ALTER TABLE studio_jobs ADD COLUMN billable INTEGER NOT NULL DEFAULT 1;

CREATE TABLE page_policies (
  policy_id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  portal TEXT NOT NULL CHECK (portal IN ('ADMIN','EMPLOYEE','CLIENT')),
  visibility TEXT NOT NULL DEFAULT 'VISIBLE' CHECK (visibility IN ('VISIBLE','HIDDEN')),
  access_level TEXT NOT NULL DEFAULT 'READ_ONLY' CHECK (access_level IN ('READ_ONLY','FULL_ACCESS')),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(page_key, portal)
);

CREATE TABLE request_metrics (
  metric_id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_request_metrics_created ON request_metrics(created_at DESC);

PRAGMA foreign_keys = ON;