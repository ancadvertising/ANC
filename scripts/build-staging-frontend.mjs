import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'frontend');
const outputDir = path.join(repoRoot, 'dist', 'staging-frontend');
const basePath = '/ANC/';
const apiUrl = 'https://anc-marketing-erp-api-staging.anc-advertising.workers.dev';
const googleClientId = '158138229306-em772bvnc463dce5fni0to8jqe3npj3o.apps.googleusercontent.com';

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.dirname(outputDir), { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

function isHtml(content) {
  return /^\s*<!doctype html>/i.test(content);
}

for (const file of await walk(outputDir)) {
  const extension = path.extname(file).toLowerCase();
  if (!['', '.html'].includes(extension)) continue;
  const content = await readFile(file, 'utf8');
  if (!isHtml(content)) continue;
  const staged = content
    .replace(/\b(href|src)="\/(?!\/)/g, `$1="${basePath}`)
    .replace('<span class="stage-pill production-pill">LIVE</span>',
      '<span class="stage-pill">STAGING</span>');
  await writeFile(file, staged, 'utf8');
}

const manifestPath = path.join(outputDir, 'manifest.webmanifest');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.id = basePath;
manifest.start_url = `${basePath}?source=pwa`;
manifest.scope = basePath;
manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `${basePath}${icon.src.replace(/^\/+/, '')}` }));
manifest.shortcuts = (manifest.shortcuts || []).map((shortcut) => ({
  ...shortcut,
  url: `${basePath}${shortcut.url.replace(/^\/+/, '')}`,
  icons: (shortcut.icons || []).map((icon) => ({ ...icon, src: `${basePath}${icon.src.replace(/^\/+/, '')}` }))
}));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const version = process.env.GITHUB_SHA ? `3.1.0-staging.${process.env.GITHUB_SHA.slice(0, 7)}` : '3.1.0-staging';
const config = `window.APP_CONFIG = Object.freeze({
  API_BASE_URL: '${apiUrl}',
  BASE_PATH: '${basePath}',
  ENVIRONMENT: 'staging',
  GOOGLE_CLIENT_ID: '${googleClientId}',
  APP_VERSION: '${version}',
  DEFAULT_CURRENCY: 'EGP',
  REQUEST_TIMEOUT_MS: 30000
});
`;
await writeFile(path.join(outputDir, 'config.js'), config, 'utf8');
await cp(path.join(outputDir, 'index.html'), path.join(outputDir, '404.html'));
await writeFile(path.join(outputDir, '.nojekyll'), '', 'utf8');

console.log(`Built staging frontend at ${outputDir}`);
console.log(`Base path: ${basePath}`);
console.log(`API: ${apiUrl}`);
