import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const workerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workerRoot, '..');
const read = (relative) => readFile(path.join(repoRoot, relative), 'utf8');

test('advanced notes persist author identity, labels and audit events', async () => {
  const [worker, ui, settings, migration] = await Promise.all([
    read('worker/src/index.js'),
    read('frontend/js/ui.js'),
    read('frontend/js/settings.js'),
    read('worker/migrations/0004_governance_portals.sql')
  ]);

  for (const marker of ['GET note.labels', 'POST note.labels', 'GET notes', 'POST notes']) {
    assert.match(worker, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(worker, /requirePrimaryManager\(actor\)/);
  assert.match(worker, /created_by_name: actor\.name \|\| actor\.email/);
  assert.match(worker, /created_by_email: actor\.email/);
  assert.match(worker, /NOTE_CREATED/);
  assert.match(worker, /Note body is required/);
  assert.match(ui, /loadRecordNotes/);
  assert.match(ui, /record-note-form/);
  assert.match(ui, /API\.post\('notes'/);
  assert.match(settings, /API\.post\('note\.labels'/);
  assert.match(migration, /CREATE TABLE note_labels/);
  assert.match(migration, /CREATE TABLE entity_notes/);
  assert.match(migration, /CREATE TABLE note_label_links/);
});

test('safe delete is visible across managed records and always requests approval', async () => {
  const [app, api, users, ads, tasks, studio, documents, finance, worker] = await Promise.all([
    read('frontend/app.js'),
    read('frontend/api-client.js'),
    read('frontend/js/users.js'),
    read('frontend/js/ads.js'),
    read('frontend/js/operations.js'),
    read('frontend/js/studio.js'),
    read('frontend/js/documents.js'),
    read('frontend/js/finance.js'),
    read('worker/src/index.js')
  ]);

  assert.match(app, /data-action="delete-\$\{entityType\}"/);
  assert.match(app, /deleteEntity\('client'/);
  assert.match(app, /deleteEntity\('project'/);
  assert.match(users, /data-user-delete/);
  assert.match(api, /'DELETE users': \['USER','userId','DELETE'\]/);
  assert.match(ads, /data-ad-delete/);
  assert.match(api, /'POST ads\.cancel': \['AD','adId','DELETE'\]/);
  assert.match(tasks, /data-task-delete/);
  assert.match(tasks, /entityType:'TASK'.*action:'DELETE'/s);
  assert.match(studio, /data-job-delete/);
  assert.match(studio, /entityType:'STUDIO_JOB'.*action:'DELETE'/s);
  assert.match(documents, /data-document-delete/);
  assert.match(documents, /entityType:'DOCUMENT'.*action:'DELETE'/s);
  assert.match(finance, /data-account-delete/);
  assert.match(finance, /data-expense-delete/);
  assert.match(finance, /data-invoice-delete/);
  assert.match(finance, /entityType:'BANK_ACCOUNT'.*action:'DELETE'/s);
  assert.match(finance, /entityType:'EXPENSE'.*action:'DELETE'/s);
  assert.match(finance, /entityType:'INVOICE'.*action:'DELETE'/s);
  assert.match(worker, /CLIENT_HAS_OPEN_PROJECTS/);
  assert.match(worker, /PROJECT_HAS_ACTIVE_WORK/);
  assert.match(worker, /INVOICE_HAS_PAYMENTS/);
  assert.match(worker, /\["ARCHIVE", "DELETE"\]\.includes\(action\)/);
});
test('money formatter accepts a table row without treating it as a currency code', async () => {
  const ui = await read('frontend/js/ui.js');

  assert.match(ui, /typeof currencyOrRow === 'object'/);
  assert.match(ui, /currencyOrRow\.Currency \|\| currencyOrRow\.currency/);
  assert.match(ui, /\^\[A-Z\]\{3\}\$/);
  assert.match(ui, /const currency = resolveCurrency\(currencyOrRow\)/);
});
