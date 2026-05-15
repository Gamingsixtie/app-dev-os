/**
 * Pure HTML renderer for the price-list snapshot.
 * Standalone document — inline CSS, Cito-branding color (#003082), NL lang attr.
 *
 * Defense-in-depth: every snapshot-derived string is escaped via escapeHtml()
 * even though current inputs come from static PROVIDER_CONFIGS (mitigates T-26-03-01).
 */

import type { PriceListSnapshot } from './price-list-snapshot';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPriceListHtml(s: PriceListSnapshot): string {
  const rows = s.rows
    .map(
      (r) => `      <tr>
        <td><strong>${escapeHtml(r.providerLabel)}</strong></td>
        <td>${escapeHtml(r.pricingType)}</td>
        <td>${escapeHtml(r.description)}</td>
      </tr>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(s.title)}</title>
  <style>
    body {
      font-family: Helvetica, Arial, sans-serif;
      color: #1A1A1A;
      max-width: 900px;
      margin: 2rem auto;
      padding: 1rem;
    }
    h1 {
      color: #003082;
      border-bottom: 3px solid #003082;
      padding-bottom: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .brand {
      color: #003082;
      font-weight: bold;
    }
    .date {
      color: #6B7280;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }
    th {
      background: #003082;
      color: #FFFFFF;
      text-align: left;
      padding: 0.5rem;
    }
    td {
      border-bottom: 1px solid #E5E7EB;
      padding: 0.5rem;
      vertical-align: top;
    }
    .disclaimer {
      color: #FF6600;
      font-style: italic;
      font-size: 0.85rem;
      border-top: 1px solid #E5E7EB;
      padding-top: 1rem;
    }
  </style>
</head>
<body>
  <h1><span class="brand">CITO</span> — ${escapeHtml(s.title.replace(/^Cito Rekentool —\s*/, ''))}</h1>
  <div class="date">${escapeHtml(s.dateLabel)}</div>
  <table>
    <thead>
      <tr><th>Aanbieder</th><th>Prijsmodel</th><th>Beschrijving</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p class="disclaimer">${escapeHtml(s.disclaimer)}</p>
</body>
</html>`;
}
