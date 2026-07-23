import fontBytes from './fonts/NotoSansArabic-Regular.ttf';
import logoBytes from './assets/logo-dark.png';
import markBytes from './assets/mark-dark.png';
import { buildInvoicePdf as buildCoreInvoicePdf } from './invoice-pdf-core.js';

export function buildInvoicePdf(input) {
  return buildCoreInvoicePdf({
    ...input,
    assets: { fontBytes, logoBytes, markBytes }
  });
}