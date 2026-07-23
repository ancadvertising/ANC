ALTER TABLE paid_ads ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE client_statements ADD COLUMN project_id TEXT;
ALTER TABLE invoices ADD COLUMN notes TEXT NOT NULL DEFAULT '';

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

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_project ON invoice_items(project_id);

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

CREATE INDEX idx_documents_client ON documents(client_id, created_at DESC);
CREATE INDEX idx_documents_project ON documents(project_id, created_at DESC);
CREATE INDEX idx_documents_status ON documents(status, created_at DESC);

UPDATE client_statements
SET project_id = (
  SELECT paid_ads.project_id
  FROM paid_ads
  WHERE paid_ads.ad_id = client_statements.reference_id
)
WHERE reference_type = 'PAID_AD' AND project_id IS NULL;

UPDATE client_statements
SET project_id = (
  SELECT invoices.project_id
  FROM invoices
  WHERE invoices.invoice_id = client_statements.reference_id
)
WHERE reference_type = 'INVOICE' AND project_id IS NULL;

INSERT INTO settings(setting_key, setting_value, description, updated_at) VALUES
  ('Company Name', 'ANC Advertising', 'Brand name used on invoices and documents', datetime('now')),
  ('Company Legal Name', 'ANC Advertising For Advertising Solutions', 'Legal company name', datetime('now')),
  ('Company Email', 'anc.adv.agency@gmail.com', 'Billing contact email', datetime('now')),
  ('Company Phone', '+2010 9797 5454', 'Billing contact phone', datetime('now')),
  ('Company Address', 'Damanhour, Egypt', 'Billing address', datetime('now')),
  ('Invoice Prefix', 'ANC', 'Invoice number prefix', datetime('now')),
  ('Invoice Tax Rate', '0', 'Default invoice tax percentage', datetime('now')),
  ('Payment Terms Days', '14', 'Default payment due period', datetime('now')),
  ('Invoice Footer', 'This invoice excludes cancelled orders and cancelled services.', 'Invoice footer note', datetime('now')),
  ('Default Currency', 'EGP', 'Default platform currency', datetime('now'))
ON CONFLICT(setting_key) DO NOTHING;