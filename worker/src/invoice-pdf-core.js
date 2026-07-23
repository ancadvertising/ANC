import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const COLORS = Object.freeze({
  ink: rgb(0.035, 0.035, 0.04),
  muted: rgb(0.36, 0.37, 0.4),
  line: rgb(0.76, 0.77, 0.79),
  soft: rgb(0.95, 0.95, 0.96),
  accent: rgb(0.62, 0.92, 0.08),
  white: rgb(1, 1, 1)
});

function cleanText(value) {
  return String(value ?? '').trim();
}

function formatMoney(value, currency) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + cleanText(currency || 'EGP');
}

const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_PATTERN = /[A-Za-z]/;
const MIXED_RUN_PATTERN = /[A-Za-z0-9@+%().,:/\-]+|[^A-Za-z0-9@+%().,:/\-]+/g;

function fontRuns(fontOrSet, text) {
  const value = cleanText(text) || '—';
  if (!fontOrSet || !fontOrSet.arabic || !fontOrSet.latin) {
    return [{ text: value, font: fontOrSet }];
  }
  const hasArabic = ARABIC_PATTERN.test(value);
  const hasLatin = LATIN_PATTERN.test(value);
  if (hasArabic && !hasLatin) return [{ text: value, font: fontOrSet.arabic }];
  if (!hasArabic) return [{ text: value, font: fontOrSet.latin }];

  const runs = (value.match(MIXED_RUN_PATTERN) || [value]).map((run) => ({
    text: run.trim(),
    font: LATIN_PATTERN.test(run) ? fontOrSet.latin : fontOrSet.arabic
  })).filter((run) => run.text);
  return runs.reverse();
}

function runGap(fontOrSet, size) {
  return fontOrSet && fontOrSet.latin ? fontOrSet.latin.widthOfTextAtSize(' ', size) : 0;
}

function textWidth(fontOrSet, text, size) {
  const runs = fontRuns(fontOrSet, text);
  return runs.reduce((width, run, index) => {
    let runWidth;
    try {
      runWidth = run.font.widthOfTextAtSize(run.text, size);
    } catch {
      runWidth = run.font.widthOfTextAtSize(run.text.replace(/[^ -~؀-ۿ]/g, ''), size);
    }
    return width + runWidth + (index < runs.length - 1 ? runGap(fontOrSet, size) : 0);
  }, 0);
}

function fitText(font, text, maxWidth, preferredSize = 10, minimumSize = 7) {
  let size = preferredSize;
  const value = cleanText(text);
  while (size > minimumSize && textWidth(font, value, size) > maxWidth) size -= 0.5;
  return { text: value, size };
}

function drawAlignedText(page, font, text, options = {}) {
  const value = cleanText(text);
  const size = options.size || 10;
  const maxWidth = options.maxWidth || CONTENT_WIDTH;
  const fitted = fitText(font, value, maxWidth, size, options.minimumSize || 7);
  let x = options.x || MARGIN;
  if (options.align === 'right') x += maxWidth - textWidth(font, fitted.text, fitted.size);
  if (options.align === 'center') x += (maxWidth - textWidth(font, fitted.text, fitted.size)) / 2;
  const runs = fontRuns(font, fitted.text);
  runs.forEach((run, index) => {
    page.drawText(run.text, {
      x,
      y: options.y,
      size: fitted.size,
      font: run.font,
      color: options.color || COLORS.ink,
      opacity: options.opacity ?? 1
    });
    x += run.font.widthOfTextAtSize(run.text, fitted.size);
    if (index < runs.length - 1) x += runGap(font, fitted.size);
  });
}

function drawRule(page, y, thickness = 0.8, color = COLORS.line) {
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness, color });
}

function drawPageFurniture(page, assets, settings, pageNumber) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.white });
  page.drawImage(assets.mark, { x: 165, y: 185, width: 270, height: 270, opacity: 0.045 });
  page.drawImage(assets.logo, { x: MARGIN, y: PAGE_HEIGHT - 105, width: 150, height: 57.5 });

  drawAlignedText(page, assets.fontBold, 'INVOICE', {
    x: 360, y: PAGE_HEIGHT - 70, maxWidth: PAGE_WIDTH - MARGIN - 360, align: 'right', size: 20
  });
  drawAlignedText(page, assets.font, 'Page ' + pageNumber, {
    x: 360, y: PAGE_HEIGHT - 92, maxWidth: PAGE_WIDTH - MARGIN - 360, align: 'right', size: 8, color: COLORS.muted
  });

  drawRule(page, PAGE_HEIGHT - 118, 1.2, COLORS.ink);

  const footerY = 45;
  drawRule(page, footerY + 34, 0.8, COLORS.line);
  drawAlignedText(page, assets.fontBold, settings['Company Legal Name'] || settings['Company Name'] || 'ANC Advertising', {
    x: MARGIN, y: footerY + 17, maxWidth: 330, size: 9
  });
  drawAlignedText(page, assets.font, [settings['Company Phone'], settings['Company Email']].filter(Boolean).join(' · '), {
    x: MARGIN, y: footerY + 3, maxWidth: 390, size: 7.5, color: COLORS.muted
  });
  drawAlignedText(page, assets.font, settings['Company Address'] || '', {
    x: 410, y: footerY + 3, maxWidth: PAGE_WIDTH - MARGIN - 410, align: 'right', size: 7.5, color: COLORS.muted
  });
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 15, color: COLORS.ink });
  page.drawRectangle({ x: PAGE_WIDTH - 115, y: 0, width: 115, height: 15, color: COLORS.accent });
}

function drawMeta(page, font, fontBold, invoice) {
  const top = PAGE_HEIGHT - 147;
  page.drawRectangle({ x: MARGIN, y: top - 77, width: CONTENT_WIDTH, height: 77, color: COLORS.soft });
  page.drawRectangle({ x: MARGIN, y: top - 77, width: 5, height: 77, color: COLORS.accent });

  const client = cleanText(invoice.clientName || invoice.client_name || '—');
  const project = cleanText(invoice.projectName || invoice.project_name || '—');
  drawAlignedText(page, fontBold, 'العميل', { x: MARGIN + 17, y: top - 22, maxWidth: 130, size: 8, color: COLORS.muted });
  drawAlignedText(page, fontBold, client, { x: MARGIN + 17, y: top - 43, maxWidth: 245, size: 12 });
  drawAlignedText(page, font, 'المشروع: ' + project, { x: MARGIN + 17, y: top - 63, maxWidth: 245, size: 8.5, color: COLORS.muted });

  const rightX = 330;
  drawAlignedText(page, fontBold, 'No. ' + cleanText(invoice.invoiceNumber || invoice.invoice_number), {
    x: rightX, y: top - 22, maxWidth: PAGE_WIDTH - MARGIN - rightX, align: 'right', size: 10
  });
  drawAlignedText(page, font, 'Issue: ' + cleanText(invoice.issueDate || invoice.issue_date), {
    x: rightX, y: top - 43, maxWidth: PAGE_WIDTH - MARGIN - rightX, align: 'right', size: 8.5, color: COLORS.muted
  });
  drawAlignedText(page, font, 'Due: ' + cleanText(invoice.dueDate || invoice.due_date), {
    x: rightX, y: top - 62, maxWidth: PAGE_WIDTH - MARGIN - rightX, align: 'right', size: 8.5, color: COLORS.muted
  });
}

const COLUMNS = Object.freeze([
  { key: 'number', label: 'No.', width: 32, align: 'center' },
  { key: 'description', label: 'البيان', width: 233, align: 'left' },
  { key: 'quantity', label: 'Qty', width: 45, align: 'center' },
  { key: 'unitPrice', label: 'Unit price', width: 95, align: 'right' },
  { key: 'amount', label: 'Amount', width: 106, align: 'right' }
]);

function drawTableHeader(page, fontBold, y) {
  let x = MARGIN;
  page.drawRectangle({ x, y: y - 26, width: CONTENT_WIDTH, height: 26, color: COLORS.ink });
  for (const column of COLUMNS) {
    drawAlignedText(page, fontBold, column.label, {
      x: x + 6, y: y - 18, maxWidth: column.width - 12, align: column.align, size: 8.5, color: COLORS.white
    });
    x += column.width;
  }
  return y - 26;
}

function drawTableRow(page, font, item, index, y, currency) {
  const height = 34;
  const quantity = Number(item.quantity || 1);
  const values = {
    number: String(index + 1),
    description: item.description || 'Service',
    quantity: quantity.toFixed(quantity % 1 ? 2 : 0),
    unitPrice: formatMoney(item.unitPrice ?? item.unit_price ?? item.amount, currency),
    amount: formatMoney(item.amount, currency)
  };
  let x = MARGIN;
  page.drawRectangle({
    x, y: y - height, width: CONTENT_WIDTH, height,
    color: index % 2 ? rgb(0.985, 0.985, 0.99) : COLORS.white,
    borderColor: COLORS.line, borderWidth: 0.45
  });
  for (const column of COLUMNS) {
    drawAlignedText(page, font, values[column.key], {
      x: x + 6, y: y - 21, maxWidth: column.width - 12, align: column.align, size: 8.5, minimumSize: 6.5
    });
    x += column.width;
    if (x < PAGE_WIDTH - MARGIN) page.drawLine({ start: { x, y }, end: { x, y: y - height }, thickness: 0.35, color: COLORS.line });
  }
  return y - height;
}

function drawTotals(page, assets, invoice, totals, settings, y) {
  const boxWidth = 242;
  const x = PAGE_WIDTH - MARGIN - boxWidth;
  const rows = [
    ['الإجمالي قبل الضريبة', formatMoney(totals.subtotal, invoice.currency)],
    ['الضريبة', formatMoney(totals.taxAmount, invoice.currency)],
    ['إجمالي المطلوب', formatMoney(totals.total, invoice.currency)],
    ['المدفوع', formatMoney(totals.paid, invoice.currency)],
    ['المتبقي', formatMoney(totals.balance, invoice.currency)]
  ];
  rows.forEach(([label, value], index) => {
    const rowY = y - (index * 27);
    page.drawRectangle({
      x, y: rowY - 27, width: boxWidth, height: 27,
      color: index === rows.length - 1 ? COLORS.ink : (index === 2 ? COLORS.soft : COLORS.white),
      borderColor: COLORS.line, borderWidth: 0.5
    });
    drawAlignedText(page, index === 2 || index === rows.length - 1 ? assets.fontBold : assets.font, label, {
      x: x + 9, y: rowY - 18, maxWidth: 120, size: 8, color: index === rows.length - 1 ? COLORS.white : COLORS.ink
    });
    drawAlignedText(page, assets.fontBold, value, {
      x: x + 128, y: rowY - 18, maxWidth: boxWidth - 137, align: 'right', size: 8.5,
      color: index === rows.length - 1 ? COLORS.accent : COLORS.ink
    });
  });

  const noteY = y - 155;
  drawAlignedText(page, assets.fontBold, 'ملاحظات', { x: MARGIN, y: noteY, maxWidth: 220, size: 9 });
  drawAlignedText(page, assets.font, invoice.notes || settings['Invoice Footer'] || '', {
    x: MARGIN, y: noteY - 19, maxWidth: 250, size: 8, color: COLORS.muted, minimumSize: 6.5
  });
}

export async function buildInvoicePdf({ invoice, items = [], payments = [], settings = {}, assets }) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle('Invoice ' + cleanText(invoice.invoiceNumber || invoice.invoice_number));
  pdf.setAuthor(settings['Company Name'] || 'ANC Advertising');
  pdf.setCreator('ANC Marketing Agency ERP');
  pdf.setProducer('ANC Marketing Agency ERP');
  pdf.setCreationDate(new Date());

  const arabicFont = await pdf.embedFont(assets.fontBytes, { subset: true });
  const latinFont = await pdf.embedFont(StandardFonts.Helvetica);
  const latinFontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const font = { arabic: arabicFont, latin: latinFont };
  const fontBold = { arabic: arabicFont, latin: latinFontBold };
  const logo = await pdf.embedPng(assets.logoBytes);
  const mark = await pdf.embedPng(assets.markBytes);
  const embedded = { font, fontBold, logo, mark };

  const normalizedItems = items.length ? items : [{
    description: invoice.projectName || invoice.project_name || 'Project services',
    quantity: 1,
    unitPrice: Number(invoice.amount || 0),
    amount: Number(invoice.amount || 0)
  }];

  const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const invoiceTax = Number(invoice.taxAmount ?? invoice.tax_amount ?? 0);
  const taxRate = subtotal ? (invoiceTax / subtotal) * 100 : Number(settings['Invoice Tax Rate'] || 0);
  const taxAmount = invoiceTax || (subtotal * taxRate / 100);
  const total = subtotal + taxAmount;
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount ?? payment.Amount ?? 0), 0);
  const totals = { subtotal, taxRate, taxAmount, total, paid, balance: total - paid };

  let pageNumber = 0;
  let page;
  let y;
  const addPage = (includeMeta = false) => {
    pageNumber += 1;
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageFurniture(page, embedded, settings, pageNumber);
    if (includeMeta) drawMeta(page, font, fontBold, invoice);
    y = includeMeta ? PAGE_HEIGHT - 251 : PAGE_HEIGHT - 145;
    y = drawTableHeader(page, fontBold, y);
  };

  addPage(true);
  normalizedItems.forEach((item, index) => {
    if (y < 205) addPage(false);
    y = drawTableRow(page, font, item, index, y, invoice.currency || 'EGP');
  });

  if (y < 270) addPage(false);
  drawTotals(page, embedded, invoice, totals, settings, y - 18);
  return pdf.save();
}