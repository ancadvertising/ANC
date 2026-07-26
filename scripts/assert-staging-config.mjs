import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(repoRoot, 'worker', 'wrangler.jsonc');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const staging = config.env?.staging;
const failures = [];

const fail = (condition, message) => {
  if (condition) failures.push(message);
};

fail(!staging, 'Missing env.staging in worker/wrangler.jsonc.');
fail(process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REF_NAME !== 'staging',
  `Staging workflow cannot run from branch "${process.env.GITHUB_REF_NAME || 'unknown'}".`);

if (staging) {
  const productionDb = config.d1_databases?.[0];
  const stagingDb = staging.d1_databases?.[0];
  const productionBucket = config.r2_buckets?.[0];
  const stagingBucket = staging.r2_buckets?.[0];
  const variables = staging.vars || {};

  fail(!String(staging.name || '').endsWith('-staging'), 'Staging Worker name must end with "-staging".');
  fail(variables.ENVIRONMENT !== 'staging', 'ENVIRONMENT must equal "staging".');
  fail(!String(variables.API_PUBLIC_URL || '').includes('-staging.'), 'Staging API URL must contain "-staging".');
  fail(String(variables.ALLOWED_ORIGINS || '').includes('anc-marketing-erp.pages.dev'),
    'Production Pages origin is forbidden in staging CORS.');
  fail(!String(variables.ALLOWED_ORIGINS || '').includes('https://ancadvertising.github.io'),
    'GitHub Pages staging origin is missing from staging CORS.');
  fail(!String(stagingDb?.database_name || '').endsWith('-staging'), 'Staging D1 database name must end with "-staging".');
  fail(!String(stagingBucket?.bucket_name || '').endsWith('-staging'), 'Staging R2 bucket name must end with "-staging".');
  fail(stagingDb?.database_id === productionDb?.database_id, 'Staging and production must not share a D1 database.');
  fail(stagingBucket?.bucket_name === productionBucket?.bucket_name, 'Staging and production must not share an R2 bucket.');
}

for (const relativePath of ['frontend/index.html', 'frontend/app.js', 'frontend/manifest.webmanifest']) {
  const content = await readFile(path.join(repoRoot, relativePath), 'utf8');
  fail(/[§ÃØ]/.test(content), `${relativePath} contains signs of broken UTF-8 text.`);
}

if (failures.length) {
  console.error('Staging safety check failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Staging safety check passed. Production resources are isolated.');
