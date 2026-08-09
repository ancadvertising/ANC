import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const workerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workerRoot, '..');

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await javascriptFiles(target));
    else if (entry.name.endsWith('.js')) files.push(target);
  }
  return files;
}

test('every static frontend API request has a matching Worker route', async () => {
  const frontendRoot = path.join(repoRoot, 'frontend');
  const files = await javascriptFiles(frontendRoot);
  const calls = new Map();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/API\.(get|post|put|delete)\(\s*['"]([^'"]+)['"]/g)) {
      calls.set(`${match[1].toUpperCase()} ${match[2]}`, path.relative(repoRoot, file));
    }
    for (const match of source.matchAll(/ANCAuth\.request\(\s*['"]([^'"]+)['"]\s*,\s*['"](GET|POST|PUT|DELETE)['"]/g)) {
      calls.set(`${match[2]} ${match[1]}`, path.relative(repoRoot, file));
    }
  }

  const worker = await readFile(path.join(workerRoot, 'src', 'index.js'), 'utf8');
  const routes = new Set([...worker.matchAll(/"(GET|POST|PUT|DELETE) ([^"]+)":\s*(?:route|financial)\(/g)]
    .map(match => `${match[1]} ${match[2]}`));
  const missing = [...calls].filter(([operation]) => !routes.has(operation));

  assert.deepEqual(missing, [], `Frontend calls without Worker routes: ${missing.map(([operation, file]) => `${operation} (${file})`).join(', ')}`);
});
