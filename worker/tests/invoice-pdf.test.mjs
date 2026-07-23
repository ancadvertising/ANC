import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { buildInvoicePdf } from '../src/invoice-pdf-core.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../src');
const output = path.resolve(here, '../../tmp/pdfs/invoice-output/anc-invoice-preview.pdf');

test('builds a branded Arabic ANC invoice PDF', async () => {
  const assets = {
    fontBytes: await readFile(path.join(source, 'fonts/NotoSansArabic-Regular.ttf')),
    logoBytes: await readFile(path.join(source, 'assets/logo-dark.png')),
    markBytes: await readFile(path.join(source, 'assets/mark-dark.png'))
  };
  const pdf = await buildInvoicePdf({
    invoice: {
      invoiceNumber: 'ANC-20260723001',
      clientName: 'شركة البازار للتسويق',
      projectName: 'حملة صيف 2026',
      issueDate: '2026-07-23',
      dueDate: '2026-08-06',
      currency: 'EGP',
      taxAmount: 690,
      notes: 'شكرًا لتعاملكم مع ANC Advertising.'
    },
    items: [
      { description: 'إدارة إعلان ممول على Meta', quantity: 1, unitPrice: 2500, amount: 2500 },
      { description: 'تصوير وإنتاج محتوى الحملة', quantity: 1, unitPrice: 1800, amount: 1800 },
      { description: 'تعديلات تصميم وتسليم نهائي', quantity: 3, unitPrice: 433.33, amount: 1300 }
    ],
    payments: [{ amount: 2000 }],
    settings: {
      'Company Name': 'ANC Advertising',
      'Company Legal Name': 'ANC Advertising For Advertising Solutions',
      'Company Email': 'anc.adv.agency@gmail.com',
      'Company Phone': '+2010 9797 5454',
      'Company Address': 'Damanhour, Egypt',
      'Invoice Footer': 'This invoice excludes cancelled orders and cancelled services.'
    },
    assets
  });
  assert.equal(new TextDecoder().decode(pdf.slice(0, 5)), '%PDF-');
  assert.ok(pdf.byteLength > 20000);
  await mkdir(path.dirname(output), { recursive:true });
  await writeFile(output, pdf);
});