import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const workerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workerRoot, '..');
const read = (relative) => readFile(path.join(repoRoot, relative), 'utf8');

test('backend exposes the completed platform workflows', async () => {
  const source = await read('worker/src/index.js');
  for (const marker of [
    'DELETE users',
    'POST users.permissions',
    'POST ads.archive',
    'GET invoices.projectPreview',
    'POST invoices.project',
    'GET system.settings',
    'PUT system.settings',
    'GET documents',
    'POST documents',
    'DELETE documents'
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /JOIN clients c ON c\.client_id=i\.client_id/);
  assert.match(source, /buildInvoicePdf/);
});

test('frontend wires live users, ads, finance, settings and documents modules', async () => {
  const [index, app, api, users, ads, finance, settings, documents] = await Promise.all([
    read('frontend/index.html'), read('frontend/app.js'), read('frontend/api-client.js'),
    read('frontend/js/users.js'), read('frontend/js/ads.js'), read('frontend/js/finance.js'),
    read('frontend/js/settings.js'), read('frontend/js/documents.js')
  ]);
  assert.match(index, /\/js\/settings\.js/);
  assert.match(index, /\/js\/documents\.js/);
  assert.match(app, /renderLiveModule\('settings'\)/);
  assert.match(app, /renderLiveModule\('documents'\)/);
  assert.match(api, /delete: \(route, data = \{\}\)/);
  assert.match(users, /users\.permissions/);
  assert.match(users, /API\.delete\('users'/);
  assert.match(ads, /ads\.archive/);
  assert.match(finance, /invoices\.projectPreview/);
  assert.match(finance, /invoices\.project/);
  assert.match(settings, /system\.settings/);
  assert.match(documents, /API\.post\('documents'/);
});

test('all extensionless route shells match the application shell', async () => {
  const shell = await read('frontend/index.html');
  const routes = ['dashboard','clients','projects','orders','ads','studio','tasks','finance','banking','reports','documents','employees','approvals','audit','settings','operations','users','profitability','billing','clientportal','employeeportal','adminportal','status','alerts'];
  for (const route of routes) assert.equal(await read('frontend/' + route), shell, route + ' must match index.html');
});

test('migration contains the workflow schema and remains append-only', async () => {
  const migration = await read('worker/migrations/0003_platform_workflows.sql');
  assert.match(migration, /CREATE TABLE invoice_items/);
  assert.match(migration, /CREATE TABLE documents/);
  assert.match(migration, /ALTER TABLE paid_ads ADD COLUMN archived/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM/i);
});