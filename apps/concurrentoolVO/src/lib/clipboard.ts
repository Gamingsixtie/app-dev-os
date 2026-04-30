import type { ReportData, DmuTarget } from '@/features/export/types';
import { PROVIDER_LABELS, type ProviderKey } from '@/engine/price-comparison';

/**
 * Format a number as Euro currency (Dutch locale, no decimals).
 */
function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Build clipboard content (plain text + HTML) from report data and DMU target.
 */
export function buildClipboardContent(
  data: ReportData,
  dmuTarget: DmuTarget,
): { html: string; plain: string } {
  const lines: string[] = [];

  // Header
  lines.push(`**${data.schoolName}** - Vergelijking`);
  lines.push(`Datum: ${data.date}`);
  lines.push('');
  lines.push(`Geselecteerde modules: ${data.selectedModules.join(', ')}`);

  // Comparison totals
  if (data.comparison) {
    lines.push('');
    lines.push('Totaalkosten per jaar:');
    const providers: ProviderKey[] = ['cito', 'dia', 'jij', 'saqi'];
    for (const provider of providers) {
      const total = data.comparison.totals[provider];
      if (total > 0) {
        lines.push(`  ${PROVIDER_LABELS[provider]}: ${formatEuro(total)}`);
      }
    }
  }

  // Price difference
  if (data.priceDifference !== null && data.priceDifference > 0) {
    lines.push('');
    lines.push(`Prijsvoordeel Cito: ${formatEuro(data.priceDifference)} per jaar`);
  }

  // Migration / time savings
  if (data.migration) {
    lines.push('');
    lines.push(`Tijdwinst: ${data.migration.totalTimeSavingsHours} uur/jaar`);
    if (data.migration.totalTimeSavingsValue > 0) {
      lines.push(`Waarde tijdwinst: ${formatEuro(data.migration.totalTimeSavingsValue)}/jaar`);
    }
    if (data.migration.totalAnnualValue > 0) {
      lines.push(`Totale jaarlijkse waarde: ${formatEuro(data.migration.totalAnnualValue)}`);
    }
    if (data.migration.breakEvenMonth !== null && data.migration.breakEvenMonth > 0) {
      lines.push(`Break-even: na ${data.migration.breakEvenMonth} maanden`);
    }
  }

  // DMU-focused conclusion
  lines.push('');
  lines.push(buildConclusion(data, dmuTarget));

  // Footer
  lines.push('');
  lines.push('---');
  lines.push(`Gegenereerd met Cito Rekentool op ${data.date}`);

  const plain = lines.join('\n');

  // Build HTML: convert **text** to <strong>text</strong>, join with <br>
  const htmlBody = lines
    .map((line) => line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
    .join('<br>');
  const html = `<div style="font-family:sans-serif;font-size:14px">${htmlBody}</div>`;

  return { html, plain };
}

/**
 * Build a DMU-focused conclusion line.
 */
function buildConclusion(data: ReportData, dmuTarget: DmuTarget): string {
  const generic = 'Conclusie: Cito biedt een combinatie van prijsvoordeel, tijdwinst en toekomstbestendigheid.';

  switch (dmuTarget) {
    case 'coordinator': {
      const hours = data.migration?.totalTimeSavingsHours;
      if (hours && hours > 0) {
        return `Conclusie: Overstap naar Cito levert ${hours} uur tijdwinst per jaar en vereenvoudigt het dagelijks werk.`;
      }
      return generic;
    }
    case 'mt': {
      const value = data.migration?.totalAnnualValue;
      if (value && value > 0) {
        return `Conclusie: Cito biedt strategische waarde door toekomstbestendig platform met doorontwikkeling en totale jaarlijkse waarde van ${formatEuro(value)}.`;
      }
      return generic;
    }
    case 'finance': {
      const diff = data.priceDifference;
      const breakEven = data.migration?.breakEvenMonth;
      if (diff !== null && diff > 0 && breakEven != null && breakEven > 0) {
        return `Conclusie: Financieel voordeel van ${formatEuro(diff)} per jaar met break-even na ${breakEven} maanden.`;
      }
      return generic;
    }
    case 'generiek':
    default:
      return generic;
  }
}

/**
 * Copy HTML + plain text to clipboard with fallback to text-only.
 */
export async function copyToClipboard(
  html: string,
  plainText: string,
): Promise<boolean> {
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    const item = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch {
      return false;
    }
  }
}
