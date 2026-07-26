CREATE TABLE studio_job_types (
  job_type_code TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_studio_job_types_active_sort
  ON studio_job_types(active, sort_order, name_en);

INSERT INTO studio_job_types
  (job_type_code, name_ar, name_en, active, sort_order, created_by, created_at, updated_at)
VALUES
  ('PHOTOGRAPHY', 'تصوير فوتوغرافي', 'Photography', 1, 10, 'SYSTEM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('VIDEOGRAPHY', 'تصوير فيديو', 'Videography', 1, 20, 'SYSTEM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('EDITING', 'مونتاج', 'Editing', 1, 30, 'SYSTEM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DESIGN', 'تصميم', 'Design', 1, 40, 'SYSTEM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DELIVERY', 'تسليم', 'Delivery', 1, 50, 'SYSTEM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('EQUIPMENT_RENTAL', 'تأجير معدات', 'Equipment Rental', 1, 60, 'SYSTEM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
