import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInvoicePdf as buildCoreInvoicePdf } from './invoice-pdf-core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadAsset(relativePath) {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(fullPath);
  } catch (e) {
    console.error('Failed to load asset:', relativePath, e);
    return null;
  }
}

export function buildInvoicePdf(input) {
  const fontBytes = loadAsset('./fonts/NotoSansArabic-Regular.ttf');
  const logoBytes = loadAsset('./assets/logo-dark.png');
  const markBytes = loadAsset('./assets/mark-dark.png');

  return buildCoreInvoicePdf({
    ...input,
    assets: { fontBytes, logoBytes, markBytes }
  });
}
