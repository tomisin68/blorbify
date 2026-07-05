import PDFDocument from 'pdfkit';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNaira(kobo) {
  return `NGN ${(toNumber(kobo) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

// Renders a single consistent document layout (order receipt, invoice, or
// financial report) shared across receipt.service.js, invoice.service.js, and
// monthlyReport.service.js — one PDFDocument buffered in memory, no temp files
// and no headless browser.
export function renderDocumentPdf({
  docType,
  storeName,
  reference = '',
  dateLabel = '',
  billTo = null,
  items = [],
  subtotal,
  deliveryFee = 0,
  discount = 0,
  total,
  note = '',
  footerNote = '',
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .fillColor('#0f1518')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Blorbify', { continued: false });

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#444444')
      .text(storeName || 'Your store', { continued: false });

    doc.moveDown(1);
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#0f1518')
      .text(docType);

    doc.fontSize(10).font('Helvetica').fillColor('#555555');
    if (reference) doc.text(`Reference: ${reference}`);
    if (dateLabel) doc.text(`Date: ${dateLabel}`);

    if (billTo) {
      doc.moveDown(0.8);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f1518').text('Bill to');
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      if (billTo.name) doc.text(billTo.name);
      if (billTo.email) doc.text(billTo.email);
      if (billTo.phone) doc.text(billTo.phone);
      if (billTo.address) doc.text(billTo.address);
    }

    doc.moveDown(1.2);

    const tableTop = doc.y;
    const columns = { description: 50, qty: 320, unitPrice: 380, subtotal: 470 };
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f1518');
    doc.text('Description', columns.description, tableTop, { width: 260 });
    doc.text('Qty', columns.qty, tableTop, { width: 50, align: 'right' });
    doc.text('Unit price', columns.unitPrice, tableTop, { width: 80, align: 'right' });
    doc.text('Subtotal', columns.subtotal, tableTop, { width: 80, align: 'right' });
    doc
      .moveTo(50, tableTop + 16)
      .lineTo(550, tableTop + 16)
      .strokeColor('#dddddd')
      .stroke();

    let rowY = tableTop + 24;
    doc.font('Helvetica').fillColor('#333333');
    for (const item of items) {
      const quantity = toNumber(item.quantity, 1);
      const unitPrice = toNumber(item.unitPrice ?? item.price, 0);
      const lineSubtotal = toNumber(item.subtotal, unitPrice * quantity);

      doc.text(item.description || item.name || 'Item', columns.description, rowY, { width: 260 });
      doc.text(String(quantity), columns.qty, rowY, { width: 50, align: 'right' });
      doc.text(formatNaira(unitPrice), columns.unitPrice, rowY, { width: 80, align: 'right' });
      doc.text(formatNaira(lineSubtotal), columns.subtotal, rowY, { width: 80, align: 'right' });
      rowY += 20;
    }

    doc.y = rowY + 10;
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor('#dddddd')
      .stroke();
    doc.moveDown(0.6);

    const totalsX = 380;
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    if (subtotal !== undefined) {
      doc.text('Subtotal', totalsX, doc.y, { width: 90 });
      doc.text(formatNaira(subtotal), columns.subtotal, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    }
    if (deliveryFee) {
      doc.text('Delivery fee', totalsX, doc.y, { width: 90 });
      doc.text(formatNaira(deliveryFee), columns.subtotal, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    }
    if (discount) {
      doc.text('Discount', totalsX, doc.y, { width: 90 });
      doc.text(`-${formatNaira(discount)}`, columns.subtotal, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    }
    if (total !== undefined) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fillColor('#0f1518');
      doc.text('Total', totalsX, doc.y, { width: 90 });
      doc.text(formatNaira(total), columns.subtotal, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    }

    if (note) {
      doc.moveDown(1.2);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f1518').text('Note');
      doc.font('Helvetica').fillColor('#555555').text(note, { width: 500 });
    }

    if (footerNote) {
      doc.moveDown(1.5);
      doc.fontSize(8).font('Helvetica').fillColor('#999999').text(footerNote, { width: 500 });
    }

    doc.end();
  });
}
