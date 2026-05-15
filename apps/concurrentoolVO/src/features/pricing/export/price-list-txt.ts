/**
 * Pure TXT renderer for the price-list snapshot.
 * Output is tab-separated; pasteable into spreadsheets / email body.
 */

import type { PriceListSnapshot } from './price-list-snapshot';

export function renderPriceListTxt(s: PriceListSnapshot): string {
  const lines: string[] = [];
  lines.push(s.title);
  lines.push(`Datum: ${s.dateLabel}`);
  lines.push('');
  lines.push(['Aanbieder', 'Prijsmodel', 'Beschrijving'].join('\t'));
  lines.push('-'.repeat(80));
  for (const r of s.rows) {
    lines.push([r.providerLabel, r.pricingType, r.description].join('\t'));
  }
  lines.push('');
  lines.push(s.disclaimer);
  return lines.join('\n');
}
