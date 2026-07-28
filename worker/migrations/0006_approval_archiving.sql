ALTER TABLE approval_requests
  ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1));

ALTER TABLE approval_requests
  ADD COLUMN archived_at TEXT;

ALTER TABLE approval_requests
  ADD COLUMN archived_by TEXT NOT NULL DEFAULT '';

CREATE INDEX idx_approval_requests_archived_created
  ON approval_requests(archived, created_at DESC);
