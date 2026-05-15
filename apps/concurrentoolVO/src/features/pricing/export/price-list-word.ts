/**
 * Word (.docx) renderer for the price-list snapshot.
 *
 * Implementation: builds an OOXML document directly from PriceListSnapshot using
 * the `docx` library (per CONTEXT D-14 documented fallback — html-docx-js's
 * `with`-statement source is incompatible with Vite 8 / rolldown).
 *
 * Library is lazy-imported so docx (~150KB) only lands in the bundle when the
 * user actually clicks the Word export option.
 */

import type { PriceListSnapshot } from './price-list-snapshot';

export async function renderPriceListWordBlob(snapshot: PriceListSnapshot): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: snapshot.title, bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: snapshot.dateLabel, italics: true })],
    }),
    new Paragraph({ text: '' }),
  ];

  for (const row of snapshot.rows) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: row.providerLabel, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Prijsmodel: ${row.pricingType}` })],
      }),
      new Paragraph({
        children: [new TextRun({ text: row.description })],
      }),
      new Paragraph({ text: '' }),
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: snapshot.disclaimer, italics: true, size: 18 })],
    }),
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}
