CREATE TABLE IF NOT EXISTS approval_requests (
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

CREATE INDEX IF NOT EXISTS idx_approval_requests_status_created
  ON approval_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_requests_requester
  ON approval_requests(requested_by_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_requests_one_pending_entity
  ON approval_requests(requested_by_user_id, entity_type, entity_id, action)
  WHERE status IN ('PENDING', 'PROCESSING');
INSERT INTO roles (role_id, role_code, role_name, description, active, created_at)
VALUES (
  'ROLE-ASSISTANT-MANAGER',
  'ASSISTANT_MANAGER',
  'Assistant Manager',
  'Can propose management changes that require primary-manager approval',
  1,
  datetime('now')
)
ON CONFLICT(role_code) DO UPDATE SET
  role_name = excluded.role_name,
  description = excluded.description,
  active = 1;