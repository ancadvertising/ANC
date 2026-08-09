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
  assert.match(app, /settings:\s*'settings'/);
  assert.match(app, /documents:\s*'documents'/);
  assert.match(api, /delete: \(route, data = \{\}\)/);
  assert.match(users, /users\.permissions/);
  assert.match(users, /API\.delete\('users'/);
  assert.match(ads, /ads\.archive/);
  assert.match(finance, /invoices\.projectPreview/);
  assert.match(finance, /invoices\.project/);
  assert.match(settings, /system\.settings/);
  assert.match(documents, /API\.post\('documents'/);
});

test('every navigation page resolves to a native or connected live module', async () => {
  const [app, finance, reports, worker] = await Promise.all([
    read('frontend/app.js'),
    read('frontend/js/finance.js'),
    read('frontend/js/reports.js'),
    read('worker/src/index.js')
  ]);

  for (const [page, moduleName] of Object.entries({
    orders:'requests', ads:'ads', studio:'studio', tasks:'operations', finance:'finance',
    banking:'banking', reports:'reports', documents:'documents', employees:'users',
    audit:'audit', settings:'settings'
  })) {
    assert.match(app, new RegExp(`${page}:\\s*'${moduleName}'`), `${page} must resolve to ${moduleName}`);
  }

  for (const alias of ['adminportal','clientportal','employeeportal','operations','users','profitability','billing','status','alerts']) {
    assert.match(app, new RegExp(`${alias}:\\s*'`), `${alias} legacy route must redirect to a live page`);
  }

  assert.match(app, /currentRoute === 'finance'[\s\S]{0,300}currentRole === 'CLIENT'/, 'client finance must load before the client fallback');
  assert.match(finance, /ANCPageModules\.banking\s*=\s*\{\s*load:\s*loadBanking/);
  assert.match(reports, /audit:\{load:audit\}/);
  assert.match(worker, /CLIENT:\s*\{[^}]*FINANCE:\s*\["VIEW",\s*"PRINT"\]/);
  assert.match(worker, /actor\.userType === "CLIENT" && invoice\.client_id !== actor\.clientId/);
  assert.match(worker, /JOIN bank_accounts a ON a\.bank_account_id=t\.bank_account_id/);
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
test('primary manager can configure studio job types without changing historical jobs', async () => {
  const [worker, studio, migration] = await Promise.all([
    read('worker/src/index.js'),
    read('frontend/js/studio.js'),
    read('worker/migrations/0005_studio_job_types.sql')
  ]);

  assert.match(worker, /DEFAULT_STUDIO_JOB_TYPES/);
  assert.match(worker, /async function createStudioJobType/);
  assert.match(worker, /async function updateStudioJobType/);
  assert.match(worker, /activeStudioJobType\(env, data\.jobType\)/);
  assert.match(worker, /"GET studio\.jobTypes"/);
  assert.match(worker, /"POST studio\.jobTypes"/);
  assert.match(worker, /"PUT studio\.jobTypes"/);
  assert.match(studio, /typeManagementSection/);
  assert.match(studio, /API\.post\('studio\.jobTypes'/);
  assert.match(studio, /API\.put\('studio\.jobTypes'/);
  assert.match(studio, /EQUIPMENT_RENTAL/);
  assert.match(migration, /CREATE TABLE studio_job_types/);
  assert.match(migration, /EQUIPMENT_RENTAL/);
});

test('projects expose a persisted completion percentage across API and portals', async () => {
  const [worker, app, styles, migration, baseline] = await Promise.all([
    read('worker/src/index.js'),
    read('frontend/app.js'),
    read('frontend/styles.css'),
    read('worker/migrations/0007_project_progress.sql'),
    read('worker/schema/staging-baseline.sql')
  ]);

  assert.match(migration, /ALTER TABLE projects[\s\S]*progress_percent/);
  assert.match(migration, /progress_updated_at/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM/i);
  assert.match(baseline, /progress_percent REAL NOT NULL DEFAULT 0/);
  assert.match(worker, /progress_percent: progress/);
  assert.match(worker, /averageProjectProgress/);
  assert.match(app, /progressPercent: source\.progress/);
  assert.match(app, /نسبة إتمام المشروع/);
  assert.match(styles, /\.project-progress-track/);
});
