ALTER TABLE projects
  ADD COLUMN progress_percent REAL NOT NULL DEFAULT 0
  CHECK (progress_percent >= 0 AND progress_percent <= 100);

ALTER TABLE projects
  ADD COLUMN progress_updated_at TEXT;

